import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createMockSupabase } from '@/lib/supabase/mock';

/**
 * SECURITY: Server-Side Supabase Client Factory
 * 
 * Creates a client that integrates with Next.js cookies to persist user sessions.
 * This is REQUIRED for Server Actions to know who the user is.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


/**
 * Creates a Supabase client that respects RLS policies and user session.
 * Use this for all user-facing operations in Server Actions and Server Components.
 * 
 * note: This is async because cookies() is async in Next.js 15+.
 */
export async function createClient() {
    /* 
    // Mock override if needed
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true') {
        return createMockSupabase();
    }
    */

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error(
            '[SECURITY] Supabase configuration missing. ' +
            'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        );
    }

    const cookieStore = await cookies();

    return createServerClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // The `set` method was called from a Server Component.
                    }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // The `delete` method was called from a Server Component.
                    }
                },
            },
        }
    );
}


