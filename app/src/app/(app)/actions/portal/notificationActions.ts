'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { getPortalClientData } from '@/actions/portal/getPortalClientData';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Get Unread Notifications for the Portal Client using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function getUnreadNotificationsAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Resolve Client ID (using refactored portal data helper)
        const clientData = await getPortalClientData();
        if (!clientData.success || !clientData.data) {
            return { success: false, error: 'Unauthorized: Portal access missing' };
        }

        const clientId = clientData.data.client.id;

        // 2. Fetch unread notifications via Prisma
        const data = await prisma.notification.findMany({
            where: {
                clientId: clientId,
                isRead: false
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: 'Failed to fetch notifications' };
    }
}

/**
 * Server Action: Mark Notification as Read using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function markNotificationAsReadAction(notificationId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        // SECURITY: We should verify the notification belongs to this client
        const portalAccess = await prisma.portalAccess.findUnique({
            where: { id: auth.userId },
            select: { clientId: true }
        });

        if (!portalAccess) return { success: false, error: 'Portal access missing' };

        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                clientId: portalAccess.clientId
            },
            data: {
                isRead: true
            }
        });

        // 3. Unified Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'UPDATE',
            entityType: 'notification',
            entityId: notificationId,
            details: { action: 'mark_as_read' }
        });

        return { success: true };

    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: 'Failed to update notification' };
    }
}
