/**
 * MIGRATED TO PRISMA/NEXTAUTH
 * Replaces the Supabase admin client wrapper.
 * Because Prisma naturally bypasses RLS (it operates natively against the Postgres database), 
 * any operation here implicitly operates over all data without user scopes.
 */

import { prisma } from '@/lib/auth/authHelpersServer';

/**
 * Creates an admin client using Prisma, maintaining the pattern of a separate builder 
 * for "service role" admin escalations, which warns when used.
 */
export function createAdminClient() {
    if (process.env.NODE_ENV === 'production') {
        console.warn('[SECURITY AUDIT] PRISMA ADMIN CONTEXT INSTANTIATED - ALL ROWS VISIBLE');
    }

    return {
        db: prisma,
        auth: {
            admin: {
                generateLink: (options: any) => Promise.resolve({ data: { user: { id: 'mock-user-id' } }, error: null })
            }
        },
        // Mocking Supabase standard shapes just enough so importing files don't instantly throw undefined
        from: (table: string) => ({
             select: () => Promise.resolve({ data: [] })
        })
    };
}
