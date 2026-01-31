'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Check, Clock, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    id: string;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export const NotificationCenter = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time notifications
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
                setNotifications(prev => [payload.new as Notification, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) setNotifications(data);
        setLoading(false);
    };

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative group">
            <button className="relative p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 mt-4 w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right z-[100]">
                <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                    <h4 className="font-bold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">
                            {unreadCount} New
                        </span>
                    )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center animate-pulse text-slate-400 text-xs">Syncing notifications...</div>
                    ) : notifications.length > 0 ? (
                        <AnimatePresence initial={false}>
                            {notifications.map((n) => (
                                <motion.div
                                    key={n.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`p-4 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors relative group/item ${!n.is_read ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${n.type === 'DOCUMENT_UPLOAD' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {n.type === 'DOCUMENT_UPLOAD' ? <FileText className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs leading-relaxed ${!n.is_read ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        {!n.is_read && (
                                            <button
                                                onClick={() => markAsRead(n.id)}
                                                className="opacity-0 group-hover/item:opacity-100 p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md transition-all shadow-lg shadow-green-500/20"
                                                title="Mark as read"
                                            >
                                                <Check className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="p-8 text-center text-slate-400 text-xs">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p>No new notifications</p>
                        </div>
                    )}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-b-3xl text-center">
                    <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                        View All Activity
                    </button>
                </div>
            </div>
        </div>
    );
};
