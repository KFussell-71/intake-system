import { createClient } from '@/lib/supabase/server';

export interface RateLimitStatus {
    allowed: boolean;
    remaining: number;
    resetAt: string;
}

/**
 * Robust Database-Backed Rate Limiter
 * 
 * Unlike in-memory Maps, this persists through server restarts and
 * scales across multiple server instances.
 */
export async function checkRateLimit(
    identifier: string,
    resource: string,
    limit: number,
    windowMs: number
): Promise<RateLimitStatus> {
    const supabase = await createClient();
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);

    try {
        // 1. Attempt to get or create the rate limit record
        const { data, error } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('identifier', identifier)
            .eq('resource', resource)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = JSON object requested, but no rows returned
            throw error;
        }

        // 2. Not found or expired? Initialize new window
        if (!data || new Date(data.reset_at) < now) {
            const { data: newData, error: insertError } = await supabase
                .from('rate_limits')
                .upsert({
                    identifier,
                    resource,
                    count: 1,
                    last_request_at: now.toISOString(),
                    reset_at: resetAt.toISOString()
                }, { onConflict: 'identifier, resource' })
                .select()
                .single();

            if (insertError) throw insertError;

            return {
                allowed: true,
                remaining: limit - 1,
                resetAt: resetAt.toISOString()
            };
        }

        // 3. Exceeded?
        if (data.count >= limit) {
            return {
                allowed: false,
                remaining: 0,
                resetAt: data.reset_at
            };
        }

        // 4. Increment count
        const { data: updatedData, error: updateError } = await supabase
            .from('rate_limits')
            .update({
                count: data.count + 1,
                last_request_at: now.toISOString()
            })
            .eq('id', data.id)
            .select()
            .single();

        if (updateError) throw updateError;

        return {
            allowed: true,
            remaining: limit - updatedData.count,
            resetAt: data.reset_at
        };

    } catch (error) {
        console.error('[RATE_LIMIT] Database error:', error);
        // Fail open in case of DB failure to avoid blocking legitimate users, 
        // but log the incident.
        return {
            allowed: true,
            remaining: 1,
            resetAt: resetAt.toISOString()
        };
    }
}
