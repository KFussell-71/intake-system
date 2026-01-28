import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config/unifiedConfig';

const { url, anonKey } = config.supabase;
const isSupabaseConfigured = !!(url && anonKey);

// Create a real or mock Supabase client
let supabaseInstance: SupabaseClient | null = null;

if (isSupabaseConfigured) {
    supabaseInstance = createSupabaseClient(url!, anonKey!);
}

// Mock auth state for demo mode
let mockUser: { email: string } | null = null;

// Mock Supabase client for demo mode
const mockSupabase = {
    auth: {
        signInWithPassword: async ({ email }: { email: string; password: string }) => {
            // Accept any credentials for demo
            mockUser = { email };
            return { data: { user: mockUser }, error: null };
        },
        getUser: async () => {
            return { data: { user: mockUser }, error: null };
        },
        signOut: async () => {
            mockUser = null;
            return { error: null };
        },
    },
};

// Export the appropriate client
export const supabase = isSupabaseConfigured ? supabaseInstance! : (mockSupabase as unknown as SupabaseClient);
export const createClient = () => supabase;
export { isSupabaseConfigured };
