/**
 * Real-time Notifications Hook (Refactored)
 * 
 * Replaces direct Supabase browser client with Server Actions and Polling.
 * This ensures compliance with the Prisma/NextAuth unified security model.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getNotificationsAction } from '@/app/(app)/actions/notificationActions';
import { toast } from 'sonner';

export interface Notification {
    id: string;
    userId: string | null;
    clientId: string | null;
    type: string;
    message: string;
    link?: string | null;
    isRead: boolean;
    createdAt: Date | string;
    metadata?: any;
}

export function useRealtimeNotifications(userId: string | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        
        try {
            const result = await getNotificationsAction();
            if (result.success && result.data) {
                const fetchedNotifications = result.data as unknown as Notification[];
                
                // Compare with current to detect new ones for toast (only for polling, not initial)
                if (!isInitial && fetchedNotifications.length > notifications.length) {
                    const latest = fetchedNotifications[0];
                    if (new Date(latest.createdAt).getTime() > new Date(notifications[0]?.createdAt || 0).getTime()) {
                        showToastNotification(latest);
                    }
                }

                setNotifications(fetchedNotifications);
                setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length);
            }
        } catch (err) {
            console.error('Failed to sync notifications:', err);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [notifications]);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        fetchNotifications(true);

        // POLL FALLBACK: Every 30 seconds check for new notifications if real-time bridge is unavailable
        // This is a bridge-gap while we move away from Supabase specific client.
        const interval = setInterval(() => {
            fetchNotifications(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [userId, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        refresh: fetchNotifications
    };
}

function showToastNotification(notification: Notification) {
    const isUrgent = notification.metadata?.urgent === true;

    toast(notification.type?.toUpperCase() || 'NOTIFICATION', {
        description: notification.message,
        duration: isUrgent ? 10000 : 5000,
        className: isUrgent ? 'border-red-500' : undefined
    });
}
