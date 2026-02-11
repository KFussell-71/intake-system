'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface AuditEvent {
    id: string;
    event_type: string;
    field_path: string | null;
    old_value: string | null;
    new_value: string | null;
    changed_by: string | null; // UUID
    changed_at: string;
    // In a real app, we'd join with profiles to get names, 
    // but for now we'll show the ID or fetch names if needed.
    // Optimization: Add `changer_name` to event or client-side cache profiles.
}

interface Props {
    intakeId: string;
    fieldPath?: string; // If provided, filter by specific field
    isOpen: boolean;
    onClose: () => void;
}

export const AuditHistoryModal: React.FC<Props> = ({ intakeId, fieldPath, isOpen, onClose }) => {
    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        const fetchHistory = async () => {
            setLoading(true);
            // supabase instance is already imported


            let query = supabase
                .from('intake_events')
                .select('*')
                .eq('intake_id', intakeId)
                .order('changed_at', { ascending: false });

            if (fieldPath) {
                // Filter by field path prefix or exact match
                // We'll use 'like' for nested fields or exact match
                query = query.ilike('field_path', `${fieldPath}%`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching audit history:', error);
            } else {
                setEvents(data as any);
            }
            setLoading(false);
        };

        fetchHistory();
    }, [intakeId, fieldPath, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-500" />
                        Audit History {fieldPath ? `- ${fieldPath}` : ''}
                    </DialogTitle>
                    <DialogDescription>
                        Traceability log of all modifications.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    {loading ? (
                        <div className="text-center py-8 text-slate-400">Loading history...</div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">No history found for this item.</div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event) => (
                                <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(event.changed_at), 'MMM d, yyyy HH:mm:ss')}
                                        </div>
                                        <div className="flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                                            <User className="w-3 h-3" />
                                            <span className="font-mono">{event.changed_by?.slice(0, 8)}...</span>
                                        </div>
                                    </div>

                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">
                                        {event.event_type} <span className="text-slate-400 font-normal">on</span> {event.field_path || 'General'}
                                    </div>

                                    <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-xs mt-2">
                                        <div className="p-2 bg-red-50 dark:bg-red-900/10 text-red-600 rounded border border-red-100 dark:border-red-900/20 break-all">
                                            {event.old_value || <span className="italic text-slate-400">Empty</span>}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-400" />
                                        <div className="p-2 bg-green-50 dark:bg-green-900/10 text-green-600 rounded border border-green-100 dark:border-green-900/20 break-all">
                                            {event.new_value || <span className="italic text-slate-400">Removed</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
