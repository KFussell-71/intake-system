/**
 * Authentication and Authorization Utilities (SERVER-SIDE)
 * 
 * For use in API routes only.
 * Uses Next.js server-side APIs (cookies, headers).
 * Uses modern @supabase/ssr for server-side auth.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ============================================
// Types
// ============================================

export interface AuthResult {
    authenticated: boolean;
    userId?: string;
    error?: string;
}

export interface AuthzResult {
    authorized: boolean;
    userId?: string;
    role?: string;
    error?: string;
}

export type UserRole = 'admin' | 'supervisor' | 'staff' | 'client';

// ============================================
// Supabase Client Factory
// ============================================

/**
 * Create a Supabase server client for API routes
 */
export async function createSupabaseServerClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Ignore errors from Server Components
                    }
                },
                remove(name: string, options: any) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Ignore errors from Server Components
                    }
                },
            },
        }
    );
}

// ============================================
// Authentication
// ============================================

/**
 * Verify user is authenticated (for API routes)
 * Uses Supabase SSR client with cookies
 */
export async function verifyAuthentication(): Promise<AuthResult> {
    try {
        // SECURITY: Allow Mock Auth in Development ONLY
        // This enables AI features to work in the "Mock Mode" demo
        const isMockAllowed = process.env.NEXT_PUBLIC_ALLOW_MOCK_AUTH === 'true' || process.env.ALLOW_MOCK_AUTH === 'true';
        const isDev = process.env.NODE_ENV === 'development';

        if (isDev && isMockAllowed) {
            const cookieStore = await cookies();
            const mockToken = cookieStore.get('sb-access-token')?.value;

            if (mockToken === 'mock-token') {
                console.warn('[SECURITY] API: Accepting MOCK Authentication');
                return {
                    authenticated: true,
                    userId: 'mock-user-id' // Matches SEED_USER in mock.ts
                };
            }
        }

        const supabase = await createSupabaseServerClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Authentication error:', error);
            return { authenticated: false, error: 'Authentication failed' };
        }

        if (!session || !session.user) {
            return { authenticated: false, error: 'No active session' };
        }

        return {
            authenticated: true,
            userId: session.user.id
        };
    } catch (error) {
        console.error('Exception during authentication:', error);
        return { authenticated: false, error: 'Authentication system error' };
    }
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
        // First verify authentication
        const authResult = await verifyAuthentication();
        if (!authResult.authenticated) {
            return {
                authorized: false,
                error: authResult.error || 'Not authenticated'
            };
        }

        const userId = authResult.userId!;

        // SECURITY: Mock Auth Bypass for Authorization
        if (userId === 'mock-user-id') {
            console.warn('[SECURITY] API: Bypass Profile Check for Mock User');
            return {
                authorized: true,
                userId,
                role: 'supervisor' // Grant high privilege for demo
            };
        }

        // Get user's role from profiles table
        const supabase = await createSupabaseServerClient();
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return {
                authorized: false,
                error: 'Failed to verify user role'
            };
        }

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
// CSRF Protection
// ============================================

/**
 * Verify request origin matches host (CSRF protection)
 * 
 * @param request - Next.js request object
 * @returns true if origin is valid, false otherwise
 */
export function verifyOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    // If no origin header, allow (same-origin requests may not have it)
    if (!origin) {
        return true;
    }

    // Verify origin contains the host
    if (!host || !origin.includes(host)) {
        console.warn(`CSRF: Origin ${origin} does not match host ${host}`);
        return false;
    }

    // SECURITY REMEDIATION: FINDING 9 - Missing HTTPS Enforcement
    // Reject non-HTTPS origins in production to prevent intercepted payloads
    if (process.env.NODE_ENV === 'production' && !origin.startsWith('https://')) {
        console.error(`SECURITY: Blocked non-HTTPS origin in production: ${origin}`);
        return false;
    }

    return true;
}

// ============================================
// Input Validation
// ============================================

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return UUID_REGEX.test(uuid);
}

/**
 * Validate array of UUIDs
 */
export function validateUUIDs(uuids: string[]): { valid: boolean; invalidIds: string[] } {
    const invalidIds = uuids.filter(id => !isValidUUID(id));
    return {
        valid: invalidIds.length === 0,
        invalidIds
    };
}

/**
 * Sanitize text input
 * - Trim whitespace
 * - Remove null bytes
 * - Enforce length limit
 */
export function sanitizeText(
    text: string,
    maxLength: number = 2000
): { sanitized: string; valid: boolean; error?: string } {
    if (!text) {
        return { sanitized: '', valid: true };
    }

    // Remove null bytes and trim
    const sanitized = text.replace(/\0/g, '').trim();

    // Check length
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
 * Validate assignment type enum
 */
export function isValidAssignmentType(type: string): type is 'primary' | 'secondary' {
    return type === 'primary' || type === 'secondary';
}
