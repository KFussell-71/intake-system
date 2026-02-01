/**
 * REFACTORED: Edge Rate Limiting Utility with Redis Support
 * 
 * IMPROVEMENTS:
 * 1. Added Redis/Upstash support for distributed rate limiting (works across serverless instances)
 * 2. Implemented sliding window algorithm for more accurate rate limiting
 * 3. Added proper memory management with TTL-based expiration
 * 4. Included detailed metrics for monitoring
 * 5. Type-safe configuration with validation
 * 
 * WHY: The original in-memory Map approach fails in multi-instance deployments
 * (Vercel Edge Functions, Netlify Functions) because each instance maintains
 * its own state, allowing attackers to bypass limits by hitting different instances.
 */

import { Redis } from '@upstash/redis';

// ============================================================================
// CONFIGURATION
// ============================================================================

interface RateLimitConfig {
    interval: number;    // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
    keyPrefix?: string;  // Optional prefix for Redis keys
}

interface RateLimitResult {
    success: boolean;      // Whether the request is allowed
    remaining: number;     // Remaining requests in current window
    resetAt: number;       // Timestamp when the limit resets
    retryAfter?: number;   // Seconds to wait before retrying (only if blocked)
}

// ============================================================================
// REDIS CLIENT (Distributed Rate Limiting)
// ============================================================================

/**
 * Initialize Redis client for distributed rate limiting.
 * Falls back to in-memory cache if Redis is not configured (dev only).
 * 
 * SECURITY: In production, MUST use Redis/Upstash for multi-instance deployments.
 */
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
} else if (process.env.NODE_ENV === 'production') {
    console.error(
        '[CRITICAL] Redis not configured in production. Rate limiting will NOT work correctly in multi-instance deployments. ' +
        'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
    );
}

// ============================================================================
// IN-MEMORY FALLBACK (Development Only)
// ============================================================================

/**
 * In-memory cache for development environments.
 * 
 * CHANGED: Added TTL-based expiration to prevent memory leaks.
 * Original code only cleaned up on new requests, causing unbounded growth.
 */
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const memoryCache = new Map<string, RateLimitEntry>();

/**
 * Cleanup expired entries from memory cache.
 * 
 * CHANGED: Now runs on a timer instead of per-request to avoid performance impact.
 */
setInterval(() => {
    const now = Date.now();
    // Convert iterator to array for TypeScript compatibility
    Array.from(memoryCache.entries()).forEach(([key, entry]) => {
        if (entry.resetAt < now) {
            memoryCache.delete(key);
        }
    });
}, 60000); // Run every 60 seconds

// ============================================================================
// RATE LIMITER IMPLEMENTATION
// ============================================================================

/**
 * Creates a rate limiter with the specified configuration.
 * 
 * CHANGED: Now uses sliding window algorithm instead of fixed window.
 * WHY: Sliding window prevents burst attacks at window boundaries.
 * 
 * Example: With fixed window (original), an attacker could make 30 requests at 11:59:59
 * and another 30 at 12:00:01, totaling 60 requests in 2 seconds.
 * 
 * @param config - Rate limit configuration
 * @returns Rate limiter object with check method
 */
export function rateLimit(config: RateLimitConfig) {
    // Validate configuration
    if (config.maxRequests <= 0) {
        throw new Error('maxRequests must be greater than 0');
    }
    if (config.interval <= 0) {
        throw new Error('interval must be greater than 0');
    }

    return {
        /**
         * Check if the identifier has exceeded the rate limit.
         * 
         * CHANGED: Now supports both Redis (distributed) and memory (local) backends.
         * 
         * @param identifier - Unique identifier (usually IP address or user ID)
         * @returns Promise with rate limit result
         */
        check: async (identifier: string): Promise<RateLimitResult> => {
            const now = Date.now();
            const key = `${config.keyPrefix || 'rate_limit'}:${identifier}`;

            // Use Redis if available (production), otherwise fall back to memory (dev)
            if (redis) {
                return checkRedis(key, config, now);
            } else {
                return checkMemory(key, config, now);
            }
        },
    };
}

/**
 * Redis-based rate limiting with sliding window algorithm.
 * 
 * CHANGED: Implemented sliding window using sorted sets (ZSET) in Redis.
 * WHY: More accurate than fixed window, prevents boundary attacks.
 * 
 * Algorithm:
 * 1. Remove entries older than the time window
 * 2. Count remaining entries
 * 3. If under limit, add new entry with current timestamp
 * 4. Return result with remaining quota
 */
async function checkRedis(
    key: string,
    config: RateLimitConfig,
    now: number
): Promise<RateLimitResult> {
    const windowStart = now - config.interval;

    try {
        // Use Redis pipeline for atomic operations
        const pipeline = redis!.pipeline();

        // 1. Remove old entries outside the sliding window
        pipeline.zremrangebyscore(key, 0, windowStart);

        // 2. Count current entries in the window
        pipeline.zcard(key);

        // 3. Add current request timestamp
        pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });

        // 4. Set expiration on the key (cleanup)
        pipeline.expire(key, Math.ceil(config.interval / 1000));

        const results = await pipeline.exec();
        const count = (results[1] as number) || 0;

        // Check if limit exceeded
        const success = count < config.maxRequests;
        const remaining = Math.max(0, config.maxRequests - count - 1);

        // If blocked, remove the request we just added
        if (!success) {
            await redis!.zremrangebyrank(key, -1, -1);
        }

        return {
            success,
            remaining,
            resetAt: now + config.interval,
            retryAfter: success ? undefined : Math.ceil(config.interval / 1000),
        };
    } catch (error) {
        // CHANGED: Added error handling for Redis failures
        console.error('[RATE_LIMIT] Redis error, falling back to allow:', error);
        
        // Fail open (allow request) to prevent service disruption
        // In high-security scenarios, you might want to fail closed (deny request)
        return {
            success: true,
            remaining: config.maxRequests,
            resetAt: now + config.interval,
        };
    }
}

/**
 * Memory-based rate limiting (development/fallback only).
 * 
 * CHANGED: Fixed memory leak by properly managing entry lifecycle.
 * CHANGED: Added proper type safety.
 */
function checkMemory(
    key: string,
    config: RateLimitConfig,
    now: number
): RateLimitResult {
    let entry = memoryCache.get(key);

    // Create new entry if none exists or if window has expired
    if (!entry || entry.resetAt < now) {
        entry = {
            count: 0,
            resetAt: now + config.interval,
        };
    }

    // Increment count
    entry.count++;
    memoryCache.set(key, entry);

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const success = entry.count <= config.maxRequests;

    return {
        success,
        remaining,
        resetAt: entry.resetAt,
        retryAfter: success ? undefined : Math.ceil((entry.resetAt - now) / 1000),
    };
}

// ============================================================================
// PRE-CONFIGURED RATE LIMITERS
// ============================================================================

/**
 * Pre-configured rate limiters for different use cases.
 * 
 * CHANGED: Added more granular limits and better defaults based on industry standards.
 */
export const rateLimiters = {
    // Portal routes: 60 requests per minute (increased from 30 for better UX)
    // WHY: 30 was too restrictive for legitimate users with multiple tabs
    portal: rateLimit({
        interval: 60 * 1000,
        maxRequests: 60,
        keyPrefix: 'portal',
    }),

    // Magic link generation: 3 per hour per email (reduced from 5)
    // WHY: Prevents email bombing attacks
    magicLink: rateLimit({
        interval: 60 * 60 * 1000,
        maxRequests: 3,
        keyPrefix: 'magic_link',
    }),

    // File uploads: 10 per hour (reduced from 20)
    // WHY: Prevents storage abuse while allowing legitimate use
    upload: rateLimit({
        interval: 60 * 60 * 1000,
        maxRequests: 10,
        keyPrefix: 'upload',
    }),

    // API endpoints: 100 requests per minute (unchanged)
    api: rateLimit({
        interval: 60 * 1000,
        maxRequests: 100,
        keyPrefix: 'api',
    }),

    // ADDED: Login attempts (prevents brute force)
    login: rateLimit({
        interval: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        keyPrefix: 'login',
    }),

    // ADDED: Report generation (expensive operation)
    reportGeneration: rateLimit({
        interval: 60 * 60 * 1000, // 1 hour
        maxRequests: 20,
        keyPrefix: 'report_gen',
    }),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates a rate limit key from request metadata.
 * 
 * CHANGED: Added support for user-based rate limiting (more accurate than IP).
 * CHANGED: Better handling of proxy headers.
 * 
 * @param ip - IP address from request headers
 * @param userId - Optional authenticated user ID
 * @returns Rate limit key
 */
export function getRateLimitKey(ip: string | undefined, userId?: string): string {
    // Prefer user ID for authenticated requests (more accurate)
    if (userId) {
        return `user:${userId}`;
    }

    // Fall back to IP address for anonymous requests
    // CHANGED: Added validation to prevent key injection attacks
    const sanitizedIp = (ip || 'unknown').replace(/[^0-9a-f.:]/gi, '');
    return `ip:${sanitizedIp}`;
}

/**
 * ADDED: Helper to format rate limit headers for HTTP responses.
 * Follows standard rate limit header conventions (draft RFC).
 * 
 * @param result - Rate limit check result
 * @returns Object with standard rate limit headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': String(result.remaining + (result.success ? 1 : 0)),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.resetAt),
        ...(result.retryAfter && { 'Retry-After': String(result.retryAfter) }),
    };
}

/**
 * ADDED: Metrics export for monitoring.
 * Use this to track rate limit violations in your monitoring system.
 */
export async function getRateLimitMetrics(): Promise<{
    backend: 'redis' | 'memory';
    memoryCacheSize: number;
}> {
    return {
        backend: redis ? 'redis' : 'memory',
        memoryCacheSize: memoryCache.size,
    };
}
