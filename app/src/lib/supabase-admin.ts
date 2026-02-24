import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config/unifiedConfig';

// SECURITY: This key bypasses RLS. Never expose to the client.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Admin features will fail.');
}

let _supabaseAdmin: SupabaseClient | null = null;

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
    get: (target, prop) => {
        if (!_supabaseAdmin) {
            _supabaseAdmin = createClient(
                config.supabase.url || '',
                SERVICE_ROLE_KEY || '',
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );
        }
        return (_supabaseAdmin as any)[prop];
    }
});
