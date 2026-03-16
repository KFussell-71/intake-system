/**
 * SECURITY: Auth Guards
 * 
 * Standardized authentication enforcement for Server Actions.
 * Enforces the invariant: No business logic executes without a verified identity.
 * Migrated to NextAuth/Prisma.
 */

import { getServerSession } from 'next-auth/next';
import { prisma } from './authHelpersServer'; // Import the global prisma instance we created

interface AuthContext {
    user: any; // Using any or a mapped NextAuth User type
}

/**
 * Require an authenticated user session.
 * Throws an error if the user is not signed in.
 * 
 * @returns {Promise<AuthContext>} The authenticated user context.
 */
export async function requireAuth(): Promise<AuthContext> {
    const session = await getServerSession();
    const user = session?.user;

    const isMockAuthAllowed = process.env.NODE_ENV === 'development' &&
        (process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true' || process.env.ALLOW_MOCK_AUTH === 'true');

    if (isMockAuthAllowed) {
        return { user: { id: 'mock-user-id' } };
    }

    if (!user) {
        throw new Error('Unauthorized: Active session required');
    }

    return { user: { ...user, id: (user as any).id || (user as any).sub } };
}

/**
 * Require a specific role from the user profile.
 * 
 * @param allowedRoles - Array of roles allowed to proceed (e.g. ['admin', 'supervisor'])
 */
export async function requireRole(allowedRoles: string[]) {
    const { user } = await requireAuth();

    if (user.id === 'mock-user-id') {
        return { user, role: 'supervisor' };
    }

    const profile = await prisma.profile.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
        throw new Error(`Forbidden: Requires one of [${allowedRoles.join(', ')}] role`);
    }

    return { user, role: profile.role };
}
