/**
 * Authentication and Authorization Utilities (CLIENT-SIDE)
 * 
 * For use in client-side utilities and components.
 * Uses standard Supabase client.
 */

import { supabase } from '../supabase';

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
// Authentication
// ============================================

/**
 * Verify user is authenticated (for client-side utilities)
 * Uses standard supabase client
 */
export async function verifyAuthenticationClient(): Promise<AuthResult> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Authentication error:', error);
            return { authenticated: false, error: 'Authentication failed' };
        }

        if (!user) {
            return { authenticated: false, error: 'Not authenticated' };
        }

        return {
            authenticated: true,
            userId: user.id
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
 * Verify user has supervisor or admin role (for client-side utilities)
 */
export async function verifySupervisorRole(): Promise<AuthzResult> {
    try {
        // First verify authentication
        const authResult = await verifyAuthenticationClient();
        if (!authResult.authenticated) {
            return {
                authorized: false,
                error: authResult.error || 'Not authenticated'
            };
        }

        const userId = authResult.userId!;

        // Get user's role from profiles table
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

        // Check if user is supervisor or admin
        const allowedRoles: UserRole[] = ['supervisor', 'admin'];
        if (!allowedRoles.includes(profile.role as UserRole)) {
            return {
                authorized: false,
                userId,
                role: profile.role,
                error: 'Insufficient permissions - supervisor or admin role required'
            };
        }

        return {
            authorized: true,
            userId,
            role: profile.role
        };
    } catch (error) {
        console.error('Exception during role verification:', error);
        return {
            authorized: false,
            error: 'Authorization system error'
        };
    }
}
