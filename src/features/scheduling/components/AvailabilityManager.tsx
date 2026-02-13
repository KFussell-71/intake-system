'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Loader2, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addAvailabilityBlock, deleteAvailabilityBlock, getAvailabilityBlocks, AvailabilityBlock } from '@/app/actions/availabilityActions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils'; // Assuming generic utility exists, else use clsx/tailwind-merge

interface AvailabilityManagerProps {
    userId: string;
}

export function AvailabilityManager({ userId }: AvailabilityManagerProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Calendar State
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

    useEffect(() => {
        loadBlocks();
    }, [currentDate]);

    async function loadBlocks() {
        setLoading(true);
        // Fetch a bit wider range to be safe
        const fetchStart = addDays(weekStart, -1);
        const fetchEnd = addDays(weekEnd, 1);

        const res = await getAvailabilityBlocks(userId, fetchStart, fetchEnd);
        if (res.success && res.data) {
            setBlocks(res.data);
        } else {
            toast.error('Failed to load schedule');
        }
        setLoading(false);
    }

    async function handleAddBlock(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const date = formData.get('date') as string;
        const startTime = formData.get('start_time') as string;
        const endTime = formData.get('end_time') as string;
        const title = formData.get('title') as string;

        // Construct ISO strings
        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);

        const res = await addAvailabilityBlock({
            user_id: userId,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            title: title || 'Deep Work',
            is_recurring: false
        });

        if (res.success) {
            toast.success('Block added');
            setIsDialogOpen(false);
            loadBlocks();
        } else {
            toast.error(res.message || 'Failed to add block');
        }
        setIsSubmitting(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Start deletion?')) return;
        const res = await deleteAvailabilityBlock(id, userId);
        if (res.success) {
            toast.success('Block removed');
            loadBlocks(); // Refresh
        } else {
            toast.error('Failed to remove block');
        }
    }

    const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, -7))}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold w-40 text-center">
                        {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                    </h2>
                    <Button variant="outline" size="icon" onClick={() => setCurrentDate(addDays(currentDate, 7))}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-slate-900 text-white hover:bg-slate-800">
                            <Plus className="w-4 h-4 mr-2" />
                            Block Time
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Block Unavailable Time</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddBlock} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Date</Label>
                                <Input name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Input name="start_time" type="time" required defaultValue="09:00" />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Input name="end_time" type="time" required defaultValue="10:00" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason (Optional)</Label>
                                <Input name="title" placeholder="Lunch, Meeting, etc." />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Block'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-visible">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b border-slate-200">
                    <div className="p-4 border-r border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
                        Time
                    </div>
                    {days.map(day => (
                        <div key={day.toISOString()} className={cn(
                            "p-2 text-center border-r border-slate-100 last:border-0",
                            isSameDay(day, new Date()) ? "bg-blue-50/50" : ""
                        )}>
                            <div className="text-xs font-medium text-slate-500">{format(day, 'EEE')}</div>
                            <div className={cn(
                                "text-sm font-bold mt-1 w-8 h-8 rounded-full flex items-center justify-center mx-auto",
                                isSameDay(day, new Date()) ? "bg-blue-600 text-white" : "text-slate-900"
                            )}>{format(day, 'd')}</div>
                        </div>
                    ))}
                </div>

                {/* Time Rows */}
                <div className="relative">
                    {timeSlots.map(hour => (
                        <div key={hour} className="grid grid-cols-8 h-12 border-b border-slate-100 last:border-0">
                            <div className="border-r border-slate-100 bg-slate-50 text-xs text-slate-400 p-2 text-right">
                                {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                            </div>
                            {days.map(day => {
                                // Find blocks for this day and overlapping this hour
                                const dayBlocks = blocks.filter(b => {
                                    const blockStart = new Date(b.start_time);
                                    const blockEnd = new Date(b.end_time);
                                    return isSameDay(blockStart, day) &&
                                        blockStart.getHours() <= hour &&
                                        blockEnd.getHours() > hour;
                                });

                                return (
                                    <div key={day.toISOString()} className="border-r border-slate-100 relative p-1">
                                        {dayBlocks.map(block => (
                                            <div
                                                key={block.id}
                                                className="absolute inset-x-1 top-1 bottom-1 bg-red-100 border border-red-200 rounded text-[10px] text-red-700 p-1 truncate cursor-pointer hover:bg-red-200 transition-colors group z-10"
                                                title={`${block.title} (${format(new Date(block.start_time), 'h:mm a')} - ${format(new Date(block.end_time), 'h:mm a')})`}
                                            >
                                                {block.title}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(block.id); }}
                                                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-300 rounded"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
