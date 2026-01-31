import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config/unifiedConfig';

/**
 * SECURITY: Supabase Client Factory
 * 
 * This module provides the Supabase client for the application.
 * 
 * SECURITY CONTROLS:
 * 1. Production REQUIRES valid Supabase URL and Anon Key - application will not start without them
 * 2. Mock client is ONLY available when ALL of these conditions are met:
 *    - NODE_ENV === 'development'
 *    - ALLOW_MOCK_AUTH === 'true' (explicit opt-in)
 * 3. Mock client logs a warning on every use
 */

const { url, anonKey } = config.supabase;
const isSupabaseConfigured = !!(url && anonKey);
const isDevelopment = process.env.NODE_ENV === 'development';
const isMockAuthExplicitlyAllowed = process.env.ALLOW_MOCK_AUTH === 'true';

// SECURITY: Mock auth is ONLY permitted in development with explicit flag
const canUseMockAuth = isDevelopment && isMockAuthExplicitlyAllowed && !isSupabaseConfigured;

// Create a real Supabase client if configured
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
    supabaseInstance = createSupabaseClient(url!, anonKey!);
} else if (!canUseMockAuth) {
    // SECURITY: In production, fail loudly if Supabase is not configured
    // This prevents silent security bypass
    console.error(
        '[SECURITY CRITICAL] Supabase is not configured and mock auth is not permitted. ' +
        'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
    // Note: We don't throw here to allow build to succeed, but runtime auth will fail
}

// Mock auth state for development ONLY
let mockUser: { email: string; id: string } | null = null;

/**
 * SECURITY: Mock Supabase client for development ONLY
 * 
 * WARNING: This mock client accepts ANY credentials.
 * It should NEVER be used in production.
 * 
 * Activation requires:
 * 1. NODE_ENV === 'development'
 * 2. ALLOW_MOCK_AUTH === 'true'
 * 3. Supabase NOT configured
 */
const mockSupabase = {
    auth: {
        signInWithPassword: async ({ email }: { email: string; password: string }) => {
            console.warn('[SECURITY] Using MOCK authentication - NOT FOR PRODUCTION');
            mockUser = { email, id: 'mock-user-' + Date.now() };
            return { data: { user: mockUser }, error: null };
        },
        getUser: async () => {
            if (mockUser) {
                console.warn('[SECURITY] Using MOCK user session - NOT FOR PRODUCTION');
            }
            return { data: { user: mockUser }, error: null };
        },
        signOut: async () => {
            mockUser = null;
            return { error: null };
        },
    },
    from: () => {
        console.error('[SECURITY] Mock Supabase does not support database operations');
        throw new Error('Database operations require valid Supabase configuration');
    },
    rpc: () => {
        console.error('[SECURITY] Mock Supabase does not support RPC operations');
        throw new Error('RPC operations require valid Supabase configuration');
    },
    storage: {
        from: () => {
            console.error('[SECURITY] Mock Supabase does not support storage operations');
            throw new Error('Storage operations require valid Supabase configuration');
        }
    }
};

// Export the appropriate client based on security conditions
function getSupabaseClient(): SupabaseClient {
    if (isSupabaseConfigured && supabaseInstance) {
        return supabaseInstance;
    }

    if (canUseMockAuth) {
        console.warn('[SECURITY] Returning MOCK Supabase client - DEVELOPMENT ONLY');
        return mockSupabase as unknown as SupabaseClient;
    }

    // SECURITY: Fail-safe - return a client that will fail all operations
    throw new Error(
        '[SECURITY] Supabase is not configured and mock auth is not permitted. ' +
        'Check your environment variables.'
    );
}

export const supabase = getSupabaseClient();
export const createClient = () => getSupabaseClient();
export { isSupabaseConfigured };
