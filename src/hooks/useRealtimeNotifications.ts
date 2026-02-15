/**
 * Real-time Notifications Hook
 * 
 * Subscribes to real-time notification updates using Supabase Realtime
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { Notification } from '@/lib/notifications/notificationService';
import { toast } from 'sonner'; // Assuming you're using sonner for toasts

export function useRealtimeNotifications(userId: string | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        // Fetch initial notifications
        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
            setLoading(false);
        };

        fetchNotifications();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newNotification = payload.new as Notification;

                    // Add to notifications list
                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show toast notification
                    showToastNotification(newNotification);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const updatedNotification = payload.new as Notification;

                    // Update notifications list
                    setNotifications(prev =>
                        prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
                    );

                    // Update unread count
                    if (updatedNotification.read) {
                        setUnreadCount(prev => Math.max(0, prev - 1));
                    }
                }
            )
            .subscribe();

        // Cleanup subscription
        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return {
        notifications,
        unreadCount,
        loading
    };
}

/**
 * Show toast notification
 */
function showToastNotification(notification: Notification) {
    const isUrgent = notification.metadata?.urgent === true;

    toast(notification.title, {
        description: notification.message,
        action: notification.link ? {
            label: 'View',
            onClick: () => window.location.href = notification.link!
        } : undefined,
        duration: isUrgent ? 10000 : 5000,
        className: isUrgent ? 'border-red-500' : undefined
    });
}
