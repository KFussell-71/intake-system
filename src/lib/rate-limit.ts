/**
 * SECURITY: Edge Rate Limiting Utility
 * 
 * Implements IP-based rate limiting for abuse prevention.
 * Uses in-memory LRU cache for Edge runtime compatibility.
 * 
 * NOTE: For production at scale, consider using Vercel KV or Upstash Redis.
 */

interface RateLimitConfig {
    interval: number;    // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Simple in-memory cache (works for single-instance, consider Redis for multi-instance)
const cache = new Map<string, RateLimitEntry>();

// Periodically clean expired entries
const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    const entries = Array.from(cache.entries());
    for (const [key, entry] of entries) {
        if (entry.resetAt < now) {
            cache.delete(key);
        }
    }
    lastCleanup = now;
}

/**
 * Creates a rate limiter with the specified configuration
 * 
 * @param config - Rate limit configuration
 * @returns Rate limiter object
 */
export function rateLimit(config: RateLimitConfig) {
    return {
        /**
         * Check if the identifier has exceeded the rate limit
         * 
         * @param identifier - Unique identifier (usually IP address)
         * @returns Object with success boolean and remaining requests
         */
        check: async (identifier: string): Promise<{ success: boolean; remaining: number; resetAt: number }> => {
            cleanupExpiredEntries();

            const now = Date.now();
            const key = `rate_limit:${identifier}`;

            let entry = cache.get(key);

            // Create new entry if none exists or if window has expired
            if (!entry || entry.resetAt < now) {
                entry = {
                    count: 0,
                    resetAt: now + config.interval
                };
            }

            // Increment count
            entry.count++;
            cache.set(key, entry);

            const remaining = Math.max(0, config.maxRequests - entry.count);
            const success = entry.count <= config.maxRequests;

            return {
                success,
                remaining,
                resetAt: entry.resetAt
            };
        }
    };
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
    // General portal routes: 30 requests per minute
    portal: rateLimit({
        interval: 60 * 1000,
        maxRequests: 30
    }),

    // Magic link generation: 5 per hour per email
    magicLink: rateLimit({
        interval: 60 * 60 * 1000,
        maxRequests: 5
    }),

    // File uploads: 20 per hour
    upload: rateLimit({
        interval: 60 * 60 * 1000,
        maxRequests: 20
    }),

    // API endpoints: 100 requests per minute
    api: rateLimit({
        interval: 60 * 1000,
        maxRequests: 100
    })
};

/**
 * Generates a rate limit key from request
 * Uses IP address as primary identifier
 */
export function getRateLimitKey(ip: string | undefined, userId?: string): string {
    if (userId) {
        return `user:${userId}`;
    }
    return `ip:${ip || 'unknown'}`;
}
