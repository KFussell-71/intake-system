import React, { useState } from 'react';
import { BrainCircuit, MessageSquare, Plus, Trash2, User } from 'lucide-react';
import { useObservations } from '../hooks/useObservations';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
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
    const { observations, loading, adding, addObservation, removeObservation } = useObservations(intakeId);

    // Form State
    const [domain, setDomain] = useState('appearance');
    const [value, setValue] = useState('');
    const [source, setSource] = useState<'client' | 'counselor'>('counselor');

    const handleAdd = async () => {
        if (!value.trim()) return;

        await addObservation(domain, value, source);
        setValue(''); // Reset text but keep domain/source for rapid entry
    };

    if (loading) return <div className="p-4 text-center">Loading observations...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Input Panel */}
                <GlassCard className="p-5 space-y-4">
                    <h3 className="font-bold flex items-center gap-2">
                        <Plus className="w-5 h-5 text-primary" />
                        Add Observation
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Domain</label>
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

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Source</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
                                <button
                                    onClick={() => setSource('counselor')}
                                    className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-all ${source === 'counselor' ? 'bg-white dark:bg-slate-700 shadow text-primary font-bold' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <BrainCircuit className="w-3 h-3" />
                                    Clinical
                                </button>
                                <button
                                    onClick={() => setSource('client')}
                                    className={`flex-1 text-xs py-1.5 rounded flex items-center justify-center gap-1 transition-all ${source === 'client' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    <User className="w-3 h-3" />
                                    Client
                                </button>
                            </div>
                        </div>
                    </div>

                    <ElegantTextarea
                        label="Observation Note"
                        name="observation"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={source === 'counselor' ? "Client appeared disheveled..." : "Client stated 'I fail at everything'..."}
                        rows={3}
                        enableDictation
                    />

                    <div className="flex justify-end">
                        <Button onClick={handleAdd} disabled={!value.trim() || adding}>
                            {adding ? 'Adding...' : 'Log Observation'}
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
        </div>
    );
};
