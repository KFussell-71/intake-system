'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';

/**
 * Server Action: Get Portal Activity
 * Replaces direct Supabase fetching in PortalActivityPanel.
 */
export async function getPortalActivityAction(limit = 20) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        // SECURITY: Check if user is supervisor or admin
        const profile = await prisma.profile.findUnique({
            where: { id: auth.userId },
            select: { role: true }
        });

        if (profile?.role !== 'supervisor' && profile?.role !== 'admin') {
            return { success: false, error: 'Access denied: Supervisory role required' };
        }

        const activities = await prisma.portalActivity.findMany({
            include: {
                client: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return {
            success: true,
            data: activities.map(a => ({
                id: a.id,
                client_id: a.clientId,
                action: a.action,
                metadata: a.metadata as any,
                created_at: a.createdAt.toISOString(),
                clients: { name: a.client.name }
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
