import React, { useState } from 'react';
import { BrainCircuit, MessageSquare, Plus, Trash2, User } from 'lucide-react';
import { useObservations } from '../hooks/useObservations';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SelectionHighlighter } from './SelectionHighlighter';
import { intakeService } from '@/services/IntakeService';
import { toast } from 'sonner';

interface Props {
    intakeId: string;
}

const DOMAINS = [
    { value: 'appearance', label: 'Appearance & Hygiene' },
    { value: 'affect', label: 'Affect & Mood' },
    { value: 'speech', label: 'Speech & Communication' },
    { value: 'cognition', label: 'Cognition & Memory' },
    { value: 'behavior', label: 'General Behavior' },
    { value: 'strengths', label: 'Key Strengths' },
    { value: 'barriers', label: 'Reported Barriers' }
];

export const ModernizedObservationsSection: React.FC<Props> = ({ intakeId }) => {
    const { observations, loading, adding, addObservation, removeObservation, setSectionStatus } = useObservations(intakeId);

    // Form State
    const [domain, setDomain] = useState('appearance');
    const [clientStatement, setClientStatement] = useState('');
    const [counselorObservation, setCounselorObservation] = useState('');

    // Promotion State
    const [promotingText, setPromotingText] = useState<string | null>(null);
    const [promotionCategory, setPromotionCategory] = useState('Vocational');

    const handleAdd = async () => {
        if (!clientStatement.trim() && !counselorObservation.trim()) return;

        const promises = [];
        if (clientStatement.trim()) {
            promises.push(addObservation(domain, clientStatement, 'client'));
        }
        if (counselorObservation.trim()) {
            promises.push(addObservation(domain, counselorObservation, 'counselor'));
        }

        await Promise.all(promises);
        setClientStatement('');
        setCounselorObservation('');
    };

    const handlePromote = async () => {
        if (!promotingText) return;
        try {
            await intakeService.promoteNarrativeToBarrier(intakeId, promotingText, promotionCategory);
            toast.success("Successfully promoted to clinical barrier");
            setPromotingText(null);
        } catch (error) {
            toast.error("Failed to promote text");
        }
    };

    if (loading) return <div className="p-4 text-center">Loading observations...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Panel */}
                <GlassCard className="p-5 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            Add Observation
                        </h3>
                        <div className="w-1/2">
                            <Select value={domain} onValueChange={setDomain}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOMAINS.map(d => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Client Statement */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                <User className="w-4 h-4" />
                                Client Statement
                            </label>
                            <ElegantTextarea
                                label="Client Statement"
                                name="clientStatement"
                                value={clientStatement}
                                onChange={(e) => setClientStatement(e.target.value)}
                                placeholder="What did the client say directly?"
                                rows={2}
                                className="border-blue-100 focus:border-blue-400 bg-blue-50/30"
                            />
                        </div>

                        {/* Counselor Observation */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                                <BrainCircuit className="w-4 h-4" />
                                Counselor Observation
                            </label>
                            <ElegantTextarea
                                label="Counselor Observation"
                                name="counselorObservation"
                                value={counselorObservation}
                                onChange={(e) => setCounselorObservation(e.target.value)}
                                placeholder="What did you observe clinically?"
                                rows={2}
                                className="border-purple-100 focus:border-purple-400 bg-purple-50/30"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleAdd}
                            disabled={(!clientStatement.trim() && !counselorObservation.trim()) || adding}
                            className="w-full sm:w-auto"
                        >
                            {adding ? 'Logging...' : 'Log Entries'}
                        </Button>
                    </div>
                </GlassCard>

                {/* List Panel */}
                <div className="space-y-3">
                    <h3 className="font-bold text-sm text-slate-500 uppercase tracking-wider">Recent Logs</h3>

                    {observations.length === 0 && (
                        <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 text-sm">
                            No observations recorded.
                        </div>
                    )}

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {observations.map(obs => (
                            <SelectionHighlighter key={obs.id} onPromote={setPromotingText}>
                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm group hover:border-primary/30 transition-all">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            {obs.source === 'counselor' ? (
                                                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-100 flex gap-1 items-center">
                                                    <BrainCircuit className="w-3 h-3" /> Clinical
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 flex gap-1 items-center">
                                                    <MessageSquare className="w-3 h-3" /> Client
                                                </Badge>
                                            )}
                                            <span className="text-xs font-semibold text-slate-500 uppercase">{obs.domain}</span>
                                        </div>
                                        <button
                                            onClick={() => removeObservation(obs.id)}
                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {obs.value}
                                    </p>
                                    <div className="text-[10px] text-slate-400 mt-2 text-right">
                                        {new Date(obs.observed_at).toLocaleString()}
                                    </div>
                                </div>
                            </SelectionHighlighter>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 gap-4 border-t border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setSectionStatus('in_progress')}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                    Save as Draft
                </button>
                <button
                    onClick={() => setSectionStatus('complete')}
                    className="px-4 py-2 bg-linear-to-r from-teal-600 to-emerald-600 text-white rounded-md hover:shadow-lg transition-all"
                >
                    Mark Complete
                </button>
            </div>

            {/* Promotion Modal */}
            {promotingText && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <GlassCard className="max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold">
                            <BrainCircuit className="w-5 h-5" />
                            Promote to Clinical Barrier
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            "{promotingText}"
                        </p>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Barrier Category</label>
                            <Select value={promotionCategory} onValueChange={setPromotionCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {['Vocational', 'Medical', 'Psychological', 'Environmental', 'Physical'].map(c => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="ghost" onClick={() => setPromotingText(null)}>Cancel</Button>
                            <Button className="bg-indigo-600 text-white" onClick={handlePromote}>Confirm Promotion</Button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

