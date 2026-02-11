/**
 * Supabase Client for Client-Side Operations
 * 
 * This creates a Supabase client for use in client components and hooks
 */

import { createBrowserClient } from '@supabase/ssr';
import { createMockSupabase } from './mock';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Export as a function to ensure consistent initialization logic
export const createClient = () => {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true') {
        return createMockSupabase();
    }
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Also export the singleton for existing code that imports 'supabase' directly
export const supabase = createClient();
