'use client';

import { useState } from 'react';
import { OutcomeMeasure, OutcomeService, outcomeService } from '@/services/OutcomeService';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, TrendingUp } from 'lucide-react';

interface Props {
    measures: OutcomeMeasure[];
    caseId: string;
    onOutcomeLogged?: () => void;
}

export function OutcomeLog({ measures, caseId, onOutcomeLogged }: Props) {
    const [selectedMeasureId, setSelectedMeasureId] = useState<string>('');
    const [value, setValue] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedMeasure = measures.find(m => m.id === selectedMeasureId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMeasureId || !value) {
            toast.error('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await outcomeService.logOutcome({
                case_id: caseId,
                measure_id: selectedMeasureId,
                value: parseFloat(value),
                notes
            });

            toast.success('Outcome recorded successfully');
            setValue('');
            setNotes('');
            if (onOutcomeLogged) onOutcomeLogged();
        } catch (error) {
            console.error(error);
            toast.error('Failed to record outcome');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <GlassCard className="p-6 border-l-4 border-l-orange-500">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-slate-900">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Log Outcome
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Metric</label>
                    <Select value={selectedMeasureId} onValueChange={setSelectedMeasureId}>
                        <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select outcome metric..." />
                        </SelectTrigger>
                        <SelectContent>
                            {measures.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Value {selectedMeasure && `(${selectedMeasure.min_value} - ${selectedMeasure.max_value})`}
                    </label>
                    <Input
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={`Enter score/value` + (selectedMeasure ? ` (${selectedMeasure.unit})` : '')}
                        className="bg-white"
                        min={selectedMeasure?.min_value}
                        max={selectedMeasure?.max_value}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Context / Notes</label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Context for this score change..."
                        className="bg-white min-h-[80px]"
                    />
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {isSubmitting ? 'Saving...' : 'Record Outcome'}
                    </Button>
                </div>
            </form>
        </GlassCard>
    );
}
