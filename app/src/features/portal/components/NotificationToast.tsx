'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check } from 'lucide-react';

export interface Notification {
    id: string;
    type: string;
    message: string;
    created_at: string;
}

interface Props {
    notification: Notification;
    onClose: () => void;
    onMarkRead: () => void;
}

export const NotificationToast = ({ notification, onClose, onMarkRead }: Props) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-dismiss after 5s
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }} // Exit to right
            className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 border border-white/10"
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Bell className="h-6 w-6 text-blue-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-white">New Notification</p>
                        <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
                        <div className="mt-3 flex space-x-7">
                            <button
                                type="button"
                                onClick={onMarkRead}
                                className="rounded-md bg-slate-800 text-sm font-medium text-blue-400 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            >
                                Mark as Read
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-md bg-slate-800 text-sm font-medium text-slate-400 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                    <div className="ml-4 flex flex-shrink-0">
                        <button
                            type="button"
                            className="inline-flex rounded-md bg-slate-800 text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
