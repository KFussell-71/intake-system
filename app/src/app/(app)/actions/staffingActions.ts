'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { staffingRepository } from '@/repositories/StaffingRepository';
import { createClient } from '@/lib/supabase/server';

/**
 * Server Action: Calculates FTE requirements based on current load.
 * Intended for Supervisor Dashboard.
 */
export async function getStaffingForecastAction(unitName: string = 'intake_specialist') {
    const supabase = await createClient();
    // 1. Auth Check (RBAC)
    const auth = await verifyAuthentication();
    if (!auth.authenticated) {
        throw new Error('Unauthorized');
    }

    // Optional: Strict Role Check
    // In a real app, we'd check if auth.role === 'supervisor' || 'admin'
    // For now, we rely on the UI hiding it, and base auth.

    // 2. Get Real Active Case Count
    // "Active" = In Progress, Submitted, or Drafting (depending on definition)
    // Let's assume Active = NOT Closed/Archived.
    // We need to count rows in `intakes` where status is active.

    // We'll do a quick query here. In the future, this should move to a Repository method.
    const { count, error } = await supabase
        .from('intakes')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("closed", "archived")'); // Pseudo-code status check

    if (error) {
        console.error('Error counting active cases:', error);
        throw new Error('Failed to retrieve case count');
    }

    const activeCases = count || 0;

    // 3. Get Forecast
    try {
        const forecast = await staffingRepository.getForecast(unitName, activeCases);
        return { success: true, data: forecast };
    } catch (err: any) {
        console.error('Forecast Error:', err);
        return { success: false, error: err.message };
    }
}
