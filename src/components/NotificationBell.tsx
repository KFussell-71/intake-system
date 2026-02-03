/**
 * Notification Bell Component
 * 
 * Displays unread notification count and dropdown with recent notifications
 */

'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/notificationService';
import { useRouter } from 'next/navigation';

interface NotificationBellProps {
    userId: string;
}

export function NotificationBell({ userId }: NotificationBellProps) {
    const { notifications, unreadCount, loading } = useRealtimeNotifications(userId);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleNotificationClick = async (notification: any) => {
        // Mark as read
        if (!notification.read) {
            await markNotificationRead(notification.id);
        }

        // Navigate to link
        if (notification.link) {
            router.push(notification.link);
        }

        setIsOpen(false);
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsRead(userId);
    };

    return (
        <div className="relative">
            {/* Bell Icon with Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6 text-slate-600 dark:text-slate-300" />

                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown Content */}
                    <div className="absolute right-0 mt-2 w-96 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 z-50">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500">
                                    Loading...
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No notifications
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full border-b border-slate-100 p-4 text-left transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Unread Indicator */}
                                            {!notification.read && (
                                                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                                            )}

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {notification.title}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                                    {notification.message}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatTime(notification.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t border-slate-200 p-2 dark:border-slate-700">
                                <button
                                    onClick={() => {
                                        router.push('/notifications');
                                        setIsOpen(false);
                                    }}
                                    className="w-full rounded-md p-2 text-center text-sm text-primary hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                    View all notifications
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

/**
 * Format timestamp to relative time
 */
function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}
