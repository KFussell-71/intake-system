'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { getUnreadNotificationsAction, markNotificationAsReadAction } from '@/app/actions/portal/notificationActions';
import { NotificationToast, Notification } from '../components/NotificationToast';

interface NotificationContextType {
    notifications: Notification[];
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    // Only fetch for authenticated users (we handle this via server action check mostly, 
    // but in a client component we might fetch 401s if not logged in.
    // The Layout should wrap this only for protected routes)

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

    const fetchNotifications = useCallback(async () => {
        const { success, data } = await getUnreadNotificationsAction();
        if (success && data) {
            // Find NEW notifications to show as toasts
            // (ones we haven't seen in the current session state yet, or just unread ones)
            // Strategy: show toasts for ALL unread notifications fetched that identify as "new" to this client state

            // Simple approach: data is all unread. 
            // We only want to toast items that we haven't toasted *recently* or are new since last poll.
            // For MVP: If list grows, toast the new ones.

            setNotifications(prev => {
                const newIds = new Set(data.map((n: any) => n.id));
                const prevIds = new Set(prev.map(n => n.id));

                // Identify truly new items
                const newItems = data.filter((n: any) => !prevIds.has(n.id));

                if (newItems.length > 0) {
                    setActiveToasts(current => [...current, ...newItems]);
                }

                return data as Notification[];
            });
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Polling every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkRead = async (id: string) => {
        await markNotificationAsReadAction(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        setActiveToasts(prev => prev.filter(n => n.id !== id));
    };

    const handleDismissToast = (id: string) => {
        setActiveToasts(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notifications, refreshNotifications: fetchNotifications }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                <AnimatePresence>
                    {activeToasts.map(notification => (
                        <NotificationToast
                            key={notification.id}
                            notification={notification}
                            onClose={() => handleDismissToast(notification.id)}
                            onMarkRead={() => handleMarkRead(notification.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    );
};
