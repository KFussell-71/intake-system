import { createClient } from '@/lib/supabase/server';
import { User } from '@supabase/supabase-js';

/**
 * SECURITY: Auth Guards
 * 
 * Standardized authentication enforcement for Server Actions.
 * Enforces the invariant: No business logic executes without a verified identity.
 */

interface AuthContext {
    user: User;
    supabase: Awaited<ReturnType<typeof createClient>>;
}

/**
 * Require an authenticated user session.
 * Throws an error if the user is not signed in.
 * 
 * @returns {Promise<AuthContext>} The authenticated user and configured Supabase client.
 */
export async function requireAuth(): Promise<AuthContext> {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Unauthorized: Active session required');
    }

    return { user, supabase };
}

/**
 * Require a specific role from the user profile.
 * 
 * @param allowedRoles - Array of roles allowed to proceed (e.g. ['admin', 'supervisor'])
 */
export async function requireRole(allowedRoles: string[]) {
    const { user, supabase } = await requireAuth();

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
        throw new Error(`Forbidden: Requires one of [${allowedRoles.join(', ')}] role`);
    }

    return { user, supabase, role: profile.role };
}
