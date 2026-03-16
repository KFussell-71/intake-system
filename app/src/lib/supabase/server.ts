/**
 * MIGRATED TO PRISMA/NEXTAUTH
 * Provides a unified client for backend operations.
 */

import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/auth/authHelpersServer';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Base Supabase client for storage only
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Gets the current session and initialized clients.
 * Replaces the Supabase createClient() function.
 */
export async function createClient() {
    const session = await getServerSession();
    const user = session?.user;

    return {
        session,
        user,
        db: prisma,
        storage: supabaseAdmin.storage, // Expose storage access
        auth: {
            getUser: async () => ({ data: { user } })
        }
    };
}
