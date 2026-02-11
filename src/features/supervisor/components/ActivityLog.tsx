'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSupervisorActions } from '@/lib/supervisor/supervisorCore';
import { CheckCircle, XCircle, UserPlus, FileCheck, Download, Loader2, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityLogProps {
    limit?: number;
    showFilters?: boolean;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
    approve: <CheckCircle className="w-4 h-4 text-emerald-600" />,
    return: <XCircle className="w-4 h-4 text-orange-600" />,
    assign: <UserPlus className="w-4 h-4 text-blue-600" />,
    bulk_approve: <FileCheck className="w-4 h-4 text-emerald-600" />,
    bulk_export: <Download className="w-4 h-4 text-slate-600" />
};

const ACTION_LABELS: Record<string, string> = {
    approve: 'Approved Report',
    return: 'Returned for Revision',
    assign: 'Assigned Client',
    bulk_approve: 'Bulk Approved',
    bulk_export: 'Bulk Exported'
};

const ACTION_COLORS: Record<string, string> = {
    approve: 'bg-emerald-50 border-emerald-200',
    return: 'bg-orange-50 border-orange-200',
    assign: 'bg-blue-50 border-blue-200',
    bulk_approve: 'bg-emerald-50 border-emerald-200',
    bulk_export: 'bg-slate-50 border-slate-200'
};

export const ActivityLog: React.FC<ActivityLogProps> = ({
    limit = 10,
    showFilters = false
}) => {
    const [actions, setActions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('');

    useEffect(() => {
        loadActions();
    }, [limit, filter]);

    const loadActions = async () => {
        setLoading(true);
        const result = await getSupervisorActions({
            actionType: filter || undefined,
            limit
        });

        if (!result.error) {
            setActions(result.data);
        }
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">Activity Log</CardTitle>
                    {showFilters && (
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            <option value="">All Actions</option>
                            <option value="approve">Approvals</option>
                            <option value="return">Returns</option>
                            <option value="assign">Assignments</option>
                            <option value="bulk_approve">Bulk Approvals</option>
                        </select>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : actions.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-slate-500">No activity to display</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {actions.map((action, index) => (
                            <motion.div
                                key={action.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`border rounded-lg p-3 ${ACTION_COLORS[action.action_type] || 'bg-slate-50 border-slate-200'}`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Icon */}
                                    <div className="flex-shrink-0 mt-0.5">
                                        {ACTION_ICONS[action.action_type] || <FileCheck className="w-4 h-4" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {ACTION_LABELS[action.action_type] || action.action_type}
                                                </p>
                                                {action.notes && (
                                                    <p className="text-xs text-slate-600 mt-0.5">
                                                        {action.notes}
                                                    </p>
                                                )}
                                                {action.metadata && action.metadata.count && (
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {action.metadata.count} items processed
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-500 whitespace-nowrap">
                                                {formatDate(action.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
