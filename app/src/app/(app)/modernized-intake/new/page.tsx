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
    // MIGRATED: Uses Prisma transaction wrapper instead of direct RPC
    const { clientRepository } = await import('@/repositories/ClientRepository');
    const data = await clientRepository.createClientWithIntakeRPC({
        p_name: 'New Client',
        p_phone: undefined,
        p_email: undefined,
        p_address: undefined,
        p_ssn_last_four: '',
        p_report_date: new Date().toISOString().split('T')[0],
        p_completion_date: undefined,
        p_intake_data: {}
    });

    if (!data?.intake_id) {
        console.error('[NewIntakeRedirect] Failed to pre-create intake');
        // Fallback to legacy if generation fails for some reason
        redirect('/dashboard?error=intake_init_failed');
    }

    // Redirect to the hub for the real ID
    redirect(`/modernized-intake/${data.intake_id}`);
}
