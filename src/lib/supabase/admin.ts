import { createClient } from '@supabase/supabase-js';

/**
 * SECURITY: Admin Supabase Client
 * 
 * This module provides a Supabase client with SERVICE ROLE privileges.
 * 
 * 🔴 DANGER: This client BYPASSES ALL RLS (Row Level Security).
 * 
 * USAGE RULES:
 * 1. ONLY use for system-level operations (cron, invitations, specialized admin override).
 * 2. NEVER use for standard user data fetching.
 * 3. NEVER expose this client to the browser (it requires the Service Role Key).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createAdminClient() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
            '[SECURITY] Admin Supabase configuration missing. ' +
            'Set SUPABASE_SERVICE_ROLE_KEY for admin operations.'
        );
    }

    // Production Alert: Ensure visibility when super-admin powers are invoked
    if (process.env.NODE_ENV === 'production') {
        console.warn('[SECURITY AUDIT] ADMIN CLIENT INSTANTIATED - RLS BYPASSED');
    }

    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}
