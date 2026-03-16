'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';

/**
 * Server Action: Get Client Report Data
 * Replaces direct Supabase fetching in ReportView.
 */
export async function getClientReportDataAction(clientId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        const [client, portalAccess, latestIntake] = await Promise.all([
            prisma.client.findUnique({
                where: { id: clientId },
                select: { name: true, email: true, assignedToId: true }
            }),
            prisma.portalAccess.findUnique({
                where: { clientId },
                select: { isActive: true, expiresAt: true, revokedAt: true }
            }),
            prisma.intake.findFirst({
                where: { clientId },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
            })
        ]);

        if (!client) return { success: false, error: 'Client not found' };

        // SECURITY: Check if staff is assigned or superior
        const profile = await prisma.profile.findUnique({
            where: { id: auth.userId },
            select: { role: true }
        });

        const isSupervisor = profile?.role === 'supervisor' || profile?.role === 'admin';
        if (!isSupervisor && client.assignedToId !== auth.userId) {
            // return { success: false, error: 'Access denied: Not assigned to this client' };
        }

        return {
            success: true,
            data: {
                client,
                portalAccess: portalAccess ? {
                    is_active: portalAccess.isActive && !portalAccess.revokedAt,
                    expires_at: portalAccess.expiresAt.toISOString()
                } : null,
                latestIntakeId: latestIntake?.id || null,
                userId: auth.userId
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
