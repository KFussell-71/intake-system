/**
 * Authentication and Authorization Utilities (SERVER-SIDE)
 * 
 * For use in API routes only.
 * Uses NextAuth.js server-side APIs and Prisma.
 */

import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';

export { prisma };

// ============================================
// Types
// ============================================

export interface AuthResult {
    authenticated: boolean;
    userId?: string;
    role?: string;
    error?: string;
}

export interface AuthzResult {
    authorized: boolean;
    userId?: string;
    role?: string;
    error?: string;
    isServiceRole?: boolean;
}

export type UserRole = 'admin' | 'supervisor' | 'staff' | 'client';

// ============================================
// Authentication
// ============================================

/**
 * Verify user is authenticated (for API routes)
 * Uses NextAuth getServerSession
 */
export async function verifyAuthentication(): Promise<AuthResult> {
    const isMockAuthAllowed = process.env.NODE_ENV === 'development' &&
        (process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true' || process.env.ALLOW_MOCK_AUTH === 'true');

    if (isMockAuthAllowed) {
        return {
            authenticated: true,
            userId: 'mock-user-id',
            error: undefined
        };
    }

    // Use NextAuth getServerSession
    const session = await getServerSession();
    const user = session?.user as any;

    if (!user) {
        return { authenticated: false, error: 'No active session' };
    }

    const userId = user.id || user.sub;

    // Fetch role from profile
    const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { role: true }
    });

    return {
        authenticated: true,
        userId,
        role: profile?.role,
        error: undefined
    };
}

// ============================================
// Authorization
// ============================================

/**
 * Verify user has required role (for API routes)
 * 
 * @param allowedRoles - Array of roles that are authorized
 * @returns Authorization result with user info
 */
export async function verifyAuthorization(
    allowedRoles: UserRole[]
): Promise<AuthzResult> {
    try {
        const authResult = await verifyAuthentication();
        if (!authResult.authenticated) {
            return {
                authorized: false,
                error: authResult.error || 'Not authenticated'
            };
        }

        const userId = authResult.userId!;

        // Mock Auth Bypass for Authorization
        if (userId === 'mock-user-id') {
            console.warn('[SECURITY] API: Bypass Profile Check for Mock User');
            return {
                authorized: true,
                userId,
                role: 'supervisor'
            };
        }

        // Get user's role from Prisma profiles table
        const profile = await prisma.profile.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (!profile || !profile.role) {
            return {
                authorized: false,
                error: 'User profile not found'
            };
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(profile.role as UserRole)) {
            return {
                authorized: false,
                userId,
                role: profile.role,
                error: `Insufficient permissions - requires one of: ${allowedRoles.join(', ')}`
            };
        }

        return {
            authorized: true,
            userId,
            role: profile.role
        };
    } catch (error) {
        console.error('Exception during authorization:', error);
        return {
            authorized: false,
            error: 'Authorization system error'
        };
    }
}

// ============================================
// CSRF Validation and Others (unchanged)
// ============================================

export function verifyOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (!origin) {
        return true;
    }

    if (!host || !origin.includes(host)) {
        console.warn(`CSRF: Origin ${origin} does not match host ${host}`);
        return false;
    }

    if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) {
        console.error(`SECURITY: Blocked non-HTTPS origin in production: ${origin}`);
        return false;
    }

    return true;
}

export function isValidUUID(uuid: string): boolean {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return UUID_REGEX.test(uuid);
}

export function validateUUIDs(uuids: string[]): { valid: boolean; invalidIds: string[] } {
    const invalidIds = uuids.filter(id => !isValidUUID(id));
    return {
        valid: invalidIds.length === 0,
        invalidIds
    };
}

export function sanitizeText(text: string, maxLength: number = 2000): { sanitized: string; valid: boolean; error?: string } {
    if (!text) {
        return { sanitized: '', valid: true };
    }
    const sanitized = text.replace(/\0/g, '').trim();
    if (sanitized.length > maxLength) {
        return {
            sanitized: sanitized.substring(0, maxLength),
            valid: false,
            error: `Text exceeds maximum length of ${maxLength} characters`
        };
    }
    return { sanitized, valid: true };
}

/**
 * Verify user has access to a specific client/case
 * Checks for supervisor/admin role OR direct assignment
 */
export async function verifyClientAccess(clientId: string): Promise<AuthzResult> {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { authorized: false, error: 'Not authenticated' };
    }

    if (auth.role === 'supervisor' || auth.role === 'admin') {
        return { authorized: true, userId: auth.userId, role: auth.role };
    }

    // Check if worker is assigned to client OR created it
    const access = await prisma.client.findUnique({
        where: { id: clientId },
        select: { assignedToId: true, createdById: true }
    });

    if (!access || (access.assignedToId !== auth.userId && access.createdById !== auth.userId)) {
        return { authorized: false, error: 'User is not authorized for this client' };
    }

    return { authorized: true, userId: auth.userId, role: auth.role };
}

export function isValidAssignmentType(type: string): type is 'primary' | 'secondary' {
    return type === 'primary' || type === 'secondary';
}
