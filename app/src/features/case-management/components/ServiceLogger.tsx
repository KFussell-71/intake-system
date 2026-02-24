'use client';

import { useState } from 'react';
import { caseService } from '@/services/CaseService';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
    caseId: string;
    onServiceLogged?: () => void;
}

export function ServiceLogger({ caseId, onServiceLogged }: Props) {
    const [isLogging, setIsLogging] = useState(false);
    const [serviceType, setServiceType] = useState('Counseling');
    const [duration, setDuration] = useState('60');
    const [notes, setNotes] = useState('');
    const [performedAt, setPerformedAt] = useState(new Date().toISOString().split('T')[0]);

    const handleLogService = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLogging(true);

        try {
            await caseService.logService({
                case_id: caseId,
                service_type: serviceType,
                duration_minutes: parseInt(duration) || 0,
                notes,
                performed_at: new Date(performedAt).toISOString(),
            });

            toast.success('Service logged successfully');
            setNotes('');
            setDuration('60');
            if (onServiceLogged) onServiceLogged();
        } catch (error) {
            console.error('Failed to log service:', error);
            toast.error('Failed to log service');
        } finally {
            setIsLogging(false);
        }
    };

    return (
        <GlassCard className="p-6 border-l-4 border-l-green-500">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
                <ClipboardList className="w-5 h-5 text-green-600" />
                Log Service Delivery
            </h3>

            <form onSubmit={handleLogService} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Service Type</label>
                        <Select value={serviceType} onValueChange={setServiceType}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select service..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Counseling">Counseling</SelectItem>
                                <SelectItem value="Assessment">Assessment</SelectItem>
                                <SelectItem value="Case Management">Case Management</SelectItem>
                                <SelectItem value="Referral">Referral Support</SelectItem>
                                <SelectItem value="Crisis Intervention">Crisis Intervention</SelectItem>
                                <SelectItem value="Housing Support">Housing Support</SelectItem>
                                <SelectItem value="Employment Support">Employment Support</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Date Performed</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <Input
                                type="date"
                                value={performedAt}
                                onChange={(e) => setPerformedAt(e.target.value)}
                                className="pl-9 bg-white"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Duration (Minutes)</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="pl-9 bg-white"
                            placeholder="60"
                            min="0"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notes / Outcome</label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Describe the service provided and any outcomes..."
                        className="bg-white min-h-[100px]"
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isLogging} className="bg-green-600 hover:bg-green-700 text-white">
                        {isLogging ? (
                            <span className="flex items-center gap-2">Logging...</span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Log Service
                            </span>
                        )}
                    </Button>
                </div>
            </form>
        </GlassCard>
    );
}
