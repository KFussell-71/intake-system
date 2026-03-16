'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { dashboardService } from '@/services/DashboardService';
import { DashboardStats } from '@/types/dashboard';

/**
 * Server Action: Get Dashboard Stats.
 * Replaces DashboardController.getStats() for secure, server-side data fetching.
 */
export async function getDashboardStatsAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // We pass the userId to the repository via the service to ensure correct workload counts
        // Note: DashboardRepository.getDashboardStats now takes userId
        const stats = await (dashboardService as any).repo.getDashboardStats(auth.userId);
        
        return { 
            success: true, 
            data: stats as DashboardStats,
            role: auth.role,
            userId: auth.userId
        };
    } catch (error: any) {
        console.error('Dashboard Stats Action Error:', error);
        return { success: false, error: error.message };
    }
}
