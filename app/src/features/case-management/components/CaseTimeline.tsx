'use client';

import { useEffect, useState } from 'react';
import { caseService } from '@/services/CaseService';
import { GlassCard } from '@/components/ui/GlassCard';
import {
    Activity,
    FileText,
    Stethoscope,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
    caseId: string;
}

export function CaseTimeline({ caseId }: Props) {
    const [timeline, setTimeline] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTimeline();
    }, [caseId]);

    const loadTimeline = async () => {
        try {
            const data = await caseService.getCaseTimeline(caseId);
            setTimeline(data);
        } catch (error) {
            console.error('Failed to load timeline:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="h-48 bg-slate-50 animate-pulse rounded-xl" />;

    if (timeline.length === 0) {
        return (
            <div className="text-center py-8 text-slate-400 text-sm">
                No activity recorded yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {timeline.map((item, index) => (
                <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${getTypeStyles(item).bg}`}>
                            {getTypeIcon(item)}
                        </div>
                        {index < timeline.length - 1 && (
                            <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-800 my-1" />
                        )}
                    </div>
                    <div className="flex-1 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                    {getTypeLabel(item)}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    by {item.author?.username || item.provider?.username || 'System'}
                                </p>
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                {format(new Date(item.date), 'MMM d, h:mm a')}
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            {item.content || item.notes || item.service_type}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function getTypeIcon(item: any) {
    if (item.type === 'note') {
        if (item.note_type === 'clinical') return <Stethoscope className="w-4 h-4" />;
        if (item.note_type === 'incident') return <AlertTriangle className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
    }
    if (item.type === 'service') return <CheckCircle2 className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
}

function getTypeStyles(item: any) {
    if (item.type === 'note') {
        if (item.note_type === 'incident') return { bg: 'bg-red-100 border-red-200 text-red-600' };
        if (item.note_type === 'clinical') return { bg: 'bg-indigo-100 border-indigo-200 text-indigo-600' };
        return { bg: 'bg-blue-100 border-blue-200 text-blue-600' };
    }
    if (item.type === 'service') return { bg: 'bg-green-100 border-green-200 text-green-600' };
    return { bg: 'bg-slate-100 border-slate-200 text-slate-600' };
}

function getTypeLabel(item: any) {
    if (item.type === 'note') {
        if (item.note_type === 'incident') return 'Incident Report';
        if (item.note_type === 'clinical') return 'Clinical Note';
        return 'General Note';
    }
    if (item.type === 'service') return `Service: ${item.service_type}`;
    return 'Activity';
}
