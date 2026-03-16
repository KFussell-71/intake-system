'use server';

import { verifyAuthorization, prisma } from '@/lib/auth/authHelpersServer';
import { staffingRepository } from '@/repositories/StaffingRepository';

/**
 * Server Action: Calculates FTE requirements based on current load using Prisma.
 * Intended for Supervisor Dashboard.
 */
export async function getStaffingForecastAction(unitName: string = 'intake_specialist') {
    // 1. Auth Check (RBAC: requires supervisor or admin)
    const auth = await verifyAuthorization(['supervisor', 'admin']);
    if (!auth.authorized) {
        throw new Error('Unauthorized');
    }

    try {
        // 2. Get Real Active Case Count using Prisma
        // Active = NOT draft, closed, or archived (aligned with Catalog's focus on active workloads)
        const activeCases = await prisma.intake.count({
            where: {
                status: {
                    notIn: ['closed', 'archived']
                }
            }
        });

        // 3. Get Forecast from repository
        const forecast = await staffingRepository.getForecast(unitName, activeCases);
        return { success: true, data: forecast };

    } catch (err: any) {
        console.error('Forecast Error:', err);
        return { success: false, error: err.message };
    }
}
