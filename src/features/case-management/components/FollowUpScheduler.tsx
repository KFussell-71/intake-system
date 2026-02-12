'use client';

import { useState } from 'react';
import { caseService } from '@/services/CaseService';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle2, AlarmClock } from 'lucide-react';

interface Props {
    caseId: string;
    onFollowUpScheduled?: () => void;
}

export function FollowUpScheduler({ caseId, onFollowUpScheduled }: Props) {
    const [isScheduling, setIsScheduling] = useState(false);
    const [type, setType] = useState('check_in');
    const [scheduledDate, setScheduledDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scheduledDate) {
            toast.error('Please select a date');
            return;
        }
        setIsScheduling(true);

        try {
            await caseService.scheduleFollowUp({
                case_id: caseId,
                scheduled_date: scheduledDate,
                type,
                notes
            });

            toast.success('Follow-up scheduled');
            setNotes('');
            setScheduledDate('');
            if (onFollowUpScheduled) onFollowUpScheduled();
        } catch (error) {
            console.error('Failed to schedule follow-up:', error);
            toast.error('Failed to schedule follow-up');
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <GlassCard className="p-6 border-l-4 border-l-purple-500">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
                <AlarmClock className="w-5 h-5 text-purple-600" />
                Schedule Follow-up
            </h3>

            <form onSubmit={handleSchedule} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Type</label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="check_in">Check-in</SelectItem>
                                <SelectItem value="assessment">Assessment</SelectItem>
                                <SelectItem value="service">Service Delivery</SelectItem>
                                <SelectItem value="planning">Case Planning</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <Input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="pl-9 bg-white"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Purpose of this follow-up..."
                        className="bg-white min-h-[80px]"
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isScheduling} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {isScheduling ? 'Scheduling...' : (
                            <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Schedule Event
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </GlassCard>
    );
}
