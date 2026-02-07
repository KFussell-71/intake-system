"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { ClipboardCheck, FileText, UserPlus, AlertCircle, Activity, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineEvent {
    id: string;
    date: string;
    type: 'intake' | 'note' | 'system' | 'status_change';
    title: string;
    status?: string;
    description?: string;
}

interface ClientTimelineProps {
    events: TimelineEvent[];
}

export function ClientTimeline({ events }: ClientTimelineProps) {
    const getIcon = (type: string) => {
        switch (type) {
            case 'intake': return <ClipboardCheck className="w-5 h-5 text-blue-500" />;
            case 'note': return <FileText className="w-5 h-5 text-amber-500" />;
            case 'system': return <UserPlus className="w-5 h-5 text-green-500" />;
            case 'status_change': return <Activity className="w-5 h-5 text-purple-500" />;
            default: return <AlertCircle className="w-5 h-5 text-slate-400" />;
        }
    };

    if (!events || events.length === 0) {
        return (
            <Card className="p-8 text-center text-slate-500 bg-slate-50 border-dashed">
                <p>No timeline events recorded yet.</p>
            </Card>
        );
    }

    return (
        <div className="relative space-y-8 pl-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {events.map((event, idx) => (
                <div key={event.id || idx} className="relative group">
                    {/* Icon Dot */}
                    <div className="absolute -left-11 top-1 w-7 h-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm z-10 group-hover:scale-110 transition-transform">
                        {getIcon(event.type)}
                    </div>

                    {/* Event Card */}
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-default border-slate-200/60 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                    {event.title}
                                    {event.status && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                event.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {event.status}
                                        </span>
                                    )}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium">
                                    {format(new Date(event.date), 'MMMM d, yyyy • h:mm a')}
                                </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {event.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                                {event.description}
                            </p>
                        )}
                    </Card>
                </div>
            ))}
        </div>
    );
}
