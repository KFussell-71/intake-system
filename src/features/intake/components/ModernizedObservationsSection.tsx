import React, { useState } from 'react';
import { BrainCircuit, MessageSquare, Plus, Trash2, User } from 'lucide-react';
import { useObservations } from '../hooks/useObservations';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    { value: 'barriers', label: 'Reported Barriers' } // overlap with Barriers domain, but for free text
];

export const ModernizedObservationsSection: React.FC<Props> = ({ intakeId }) => {
    const { observations, loading, adding, addObservation, removeObservation, setSectionStatus } = useObservations(intakeId);

    // Form State
    const [domain, setDomain] = useState('appearance');
    const [clientStatement, setClientStatement] = useState('');
    const [counselorObservation, setCounselorObservation] = useState('');

    const handleAdd = async () => {
        if (!clientStatement.trim() && !counselorObservation.trim()) return;

        // Queue requests to ensure both can save
        const promises = [];

        if (clientStatement.trim()) {
            promises.push(addObservation(domain, clientStatement, 'client'));
        }

        if (counselorObservation.trim()) {
            promises.push(addObservation(domain, counselorObservation, 'counselor'));
        }

        await Promise.all(promises);

        // Reset fields
        setClientStatement('');
        setCounselorObservation('');
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
                        {/* Domain Selector moved to top right or kept prominent */}
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
                                placeholder="What did the client say directly? (e.g. 'I cannot stand for more than 10 minutes')"
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
                                placeholder="What did you observe clinically? (e.g. Client shifted weight frequently while standing)"
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
                            <div key={obs.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-lg shadow-sm group hover:border-primary/30 transition-all">
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
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-md hover:shadow-lg transition-all"
                >
                    Mark Complete
                </button>
            </div>
        </div>
    );
};
