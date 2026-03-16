"use server";

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Create a system notification using Prisma.
 */
export async function createNotification(data: {
    client_id?: string;
    staff_id?: string;
    type: string;
    message: string;
    link?: string;
}) {
    try {
        await prisma.notification.create({
            data: {
                clientId: data.client_id!, // Assume it's provided if it's required in schema
                staffId: data.staff_id || null,
                type: data.type,
                message: data.message,
                link: data.link || null
            }
        });
    } catch (error) {
        console.error('Notification Exception:', error);
    }
}

/**
 * Server Action: Get Notifications for the current user.
 */
export async function getNotificationsAction(limit: number = 50) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { staffId: auth.userId },
                    { clientId: auth.userId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return { success: true, data: notifications as any }; // Cast to any to avoid complex type mapping for now
    } catch (error: any) {
        console.error('Error fetching staff notifications:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Mark all notifications as read for current user.
 */
export async function markAllNotificationsReadAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        await prisma.notification.updateMany({
            where: {
                OR: [
                    { staffId: auth.userId },
                    { clientId: auth.userId }
                ],
                isRead: false
            },
            data: { isRead: true }
        });

        // Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'UPDATE',
            entityType: 'notification',
            entityId: 'all',
            details: { action: 'mark_all_read' }
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Mark a single notification as read.
 */
export async function markNotificationReadAction(notificationId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                OR: [
                    { staffId: auth.userId },
                    { clientId: auth.userId }
                ]
            },
            data: {
                isRead: true
            }
        });

        // Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'UPDATE',
            entityType: 'notification',
            entityId: notificationId,
            details: { action: 'mark_read' }
        });

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

