import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';

/**
 * Modernized Intake "New" Redirect Route.
 * Responsibilities:
 * 1. Ensure user is authenticated.
 * 2. Pre-generate a stable intake record via RPC (Relational-First).
 * 3. Redirect to /[id] hub with a real UUID.
 */
export default async function NewModernizedIntakeRedirect() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        redirect('/login');
    }

    const supabase = await createClient();

    // Generate a placeholder record to get a real UUID
    // This uses the same RPC as the legacy system but starts with empty data
    const { data, error } = await supabase.rpc('create_client_intake', {
        p_name: 'New Client',
        p_phone: null,
        p_email: null,
        p_address: null,
        p_ssn_last_four: null,
        p_report_date: new Date().toISOString().split('T')[0],
        p_completion_date: null,
        p_intake_data: {}
    });

    if (error || !data?.intake_id) {
        console.error('[NewIntakeRedirect] Failed to pre-create intake:', error);
        // Fallback to legacy if generation fails for some reason
        redirect('/dashboard?error=intake_init_failed');
    }

    // Redirect to the hub for the real ID
    redirect(`/modernized-intake/${data.intake_id}`);
}
