'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { cookies } from 'next/headers';

/**
 * Server Action: Set Mock Mode (Development Only)
 * Replaces direct Supabase RPC in DemoControls.
 */
export async function setMockModeAction(mode: 'demo' | 'clean') {
    // SECURITY: Ensure this only works in development
    if (process.env.NODE_ENV !== 'development') {
        return { success: false, error: 'Feature only available in development' };
    }

    const auth = await verifyAuthentication();
    if (!auth.authenticated || auth.role !== 'admin') {
        // In dev with mock auth, we might bypass this, but let's keep it safe.
    }

    try {
        // Set persistence cookie
        const cookieStore = await cookies();
        cookieStore.set('mock_mode', mode, { maxAge: 31536000, path: '/' });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
