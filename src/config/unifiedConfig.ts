import { z } from 'zod';

const configSchema = z.object({
    supabase: z.object({
        url: z.string().url(),
        anonKey: z.string().min(1),
    }),
    env: z.enum(['development', 'production', 'test']),
    isProd: z.boolean(),
});

const _config = {
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    env: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
};

// Validate configuration
const parsed = configSchema.safeParse(_config);

if (!parsed.success) {
    if (_config.isProd) {
        console.error('❌ CRITICAL: Invalid production configuration:', parsed.error.format());
        throw new Error('Production deployment failed: Missing or invalid required environment variables.');
    } else {
        console.warn('⚠️ Development mode: Some environment variables are missing. Using default/mock settings.');
    }
}

export const config = _config;
export type Config = typeof config;
export const isSupabaseConfigured = parsed.success;
