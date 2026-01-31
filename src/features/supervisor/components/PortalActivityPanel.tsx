'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

interface PortalActivity {
    id: string;
    client_id: string;
    action: string;
    metadata: Record<string, unknown>;
    created_at: string;
    clients?: {
        name: string;
    } | null;
}

/**
 * Portal Activity Panel for Supervisor Dashboard
 * 
 * Displays recent client portal activity for supervisory oversight.
 * Shows uploads, logins, and other portal actions.
 */
export default function PortalActivityPanel() {
    const [activities, setActivities] = useState<PortalActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const supabase = createClient();

                const { data, error: fetchError } = await supabase
                    .from('portal_activity')
                    .select(`
                        id,
                        client_id,
                        action,
                        metadata,
                        created_at,
                        clients (name)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (fetchError) {
                    setError('Failed to load portal activity');
                    return;
                }

                // Transform the data to match our interface
                const transformed: PortalActivity[] = (data || []).map((item: Record<string, unknown>) => ({
                    id: item.id as string,
                    client_id: item.client_id as string,
                    action: item.action as string,
                    metadata: (item.metadata as Record<string, unknown>) || {},
                    created_at: item.created_at as string,
                    clients: Array.isArray(item.clients) && item.clients.length > 0
                        ? { name: (item.clients[0] as { name: string }).name }
                        : (item.clients as { name: string } | null)
                }));

                setActivities(transformed);
            } catch {
                setError('Failed to load portal activity');
            } finally {
                setLoading(false);
            }
        }

        fetchActivity();
    }, []);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'DOCUMENT_UPLOADED':
                return (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                    </div>
                );
            case 'LOGIN':
                return (
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </div>
                );
            case 'INVITE_SENT':
                return (
                    <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                );
            case 'ACCESS_REVOKED':
            case 'ACCESS_EXPIRED':
                return (
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'DOCUMENT_UPLOADED': return 'Uploaded document';
            case 'LOGIN': return 'Logged in';
            case 'INVITE_SENT': return 'Invitation sent';
            case 'ACCESS_REVOKED': return 'Access revoked';
            case 'ACCESS_EXPIRED': return 'Access expired';
            case 'PROFILE_VIEWED': return 'Viewed profile';
            case 'STATUS_VIEWED': return 'Viewed status';
            default: return action;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Client Portal Activity</h3>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Client Portal Activity</h3>
                <p className="text-sm text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Client Portal Activity</h3>
                <span className="text-xs text-slate-400">Last 20 actions</span>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-sm text-slate-400">No portal activity yet</p>
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg"
                        >
                            {getActionIcon(activity.action)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">
                                    {activity.clients?.name || 'Unknown Client'}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {getActionLabel(activity.action)}
                                </p>
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                                {formatTime(activity.created_at)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
