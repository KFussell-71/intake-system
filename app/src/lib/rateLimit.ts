import { prisma as db } from '@/lib/auth/authHelpersServer';

export interface RateLimitStatus {
    allowed: boolean;
    remaining: number;
    resetAt: string;
}

/**
 * Robust Database-Backed Rate Limiter
 */
export async function checkRateLimit(
    identifier: string,
    resource: string,
    limit: number,
    windowMs: number
): Promise<RateLimitStatus> {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    try {
        // 1. Get current limit
        const rl = await db.rateLimit.findUnique({
            where: {
                identifier_resource: {
                    identifier,
                    resource
                }
            }
        });

        // 2. Not found or expired? Reset window
        if (!rl || rl.resetAt < now) {
            const newRl = await db.rateLimit.upsert({
                where: {
                    identifier_resource: {
                        identifier,
                        resource
                    }
                },
                create: {
                    identifier,
                    resource,
                    count: 1,
                    lastRequestAt: now,
                    resetAt: resetAt
                },
                update: {
                    count: 1,
                    lastRequestAt: now,
                    resetAt: resetAt
                }
            });

            return {
                allowed: true,
                remaining: limit - 1,
                resetAt: resetAt.toISOString()
            };
        }

        // 3. Exceeded?
        if (rl.count >= limit) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: rl.resetAt.toISOString()
            };
        }

        // 4. Increment count
        const updated = await db.rateLimit.update({
            where: { id: rl.id },
            data: {
                count: { increment: 1 },
                lastRequestAt: now
            }
        });

        return {
            allowed: true,
            remaining: limit - updated.count,
            resetAt: rl.resetAt.toISOString()
        };

    } catch (error) {
        console.error('[RATE_LIMIT] Database error:', error);
        return {
            allowed: true,
            remaining: 1,
            resetAt: resetAt.toISOString()
        };
    }
}
