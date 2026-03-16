'use client';

import { useEffect, useState, useCallback } from 'react';
import { getPortalActivityAction } from '@/app/(app)/actions/getPortalActivityAction';

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
 * Portal Activity Panel (Refactored)
 * 
 * Migrated from direct Supabase browser client to secure Server Action fetching.
 * Displays recent portal activity with session validation and supervisory oversight.
 */
export default function PortalActivityPanel() {
    const [activities, setActivities] = useState<PortalActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActivity = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            const result = await getPortalActivityAction(20);
            if (result.success && result.data) {
                setActivities(result.data as any);
            } else {
                setError(result.error || 'Failed to load activity');
            }
        } catch {
            setError('Internal Error');
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchActivity(true);

        // Polling fallback every 30s
        const interval = setInterval(() => fetchActivity(false), 30000);
        return () => clearInterval(interval);
    }, [fetchActivity]);

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
            default:
                return (
                    <div className="w-8 h-8 rounded-lg bg-slate-500/20 flex items-center justify-center text-slate-400">?</div>
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
                <div className="animate-pulse flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
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
                <p className="text-center py-8 text-sm text-slate-400">No portal activity recently</p>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {activities.map((activity) => (
                        <div
                            key={activity.id}
                            className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900/80 transition-colors"
                        >
                            {getActionIcon(activity.action)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate font-medium">
                                    {activity.clients?.name || 'Unknown Client'}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                                    {getActionLabel(activity.action)}
                                </p>
                            </div>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {formatTime(activity.created_at)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
