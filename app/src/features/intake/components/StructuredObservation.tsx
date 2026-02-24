import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';

interface Observation {
    id: string;
    category: string;
    observation: string;
    functional_limitation: string;
    accommodation: string;
}

interface Props {
    observations?: Observation[];
    onChange: (observations: Observation[]) => void;
}

export const StructuredObservation: React.FC<Props> = ({ observations = [], onChange }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newObs, setNewObs] = useState<Partial<Observation>>({
        category: 'Medical',
        observation: '',
        functional_limitation: '',
        accommodation: ''
    });

    const categories = ['Medical', 'Psychological', 'Vocational', 'Social', 'Educational', 'Legal'];

    const handleAdd = () => {
        if (!newObs.observation || !newObs.functional_limitation) return;

        const observation: Observation = {
            id: Math.random().toString(36).substr(2, 9),
            category: newObs.category || 'Medical',
            observation: newObs.observation,
            functional_limitation: newObs.functional_limitation,
            accommodation: newObs.accommodation || 'None'
        };

        onChange([...observations, observation]);
        setNewObs({ category: 'Medical', observation: '', functional_limitation: '', accommodation: '' });
        setIsAdding(false);
    };

    const handleRemove = (id: string) => {
        onChange(observations.filter(o => o.id !== id));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Structured Clinical Logic (Barrier → Limitation → Accommodation)
                </label>
                {/* <span className="text-xs text-slate-400">Audit Defense Ready</span> */}
            </div>

            {/* List of Observations */}
            <div className="space-y-3">
                {observations.map((obs) => (
                    <div key={obs.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                        <button
                            onClick={() => handleRemove(obs.id)}
                            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <div className="md:col-span-1">
                                <span className="inline-block px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    {obs.category}
                                </span>
                            </div>

                            <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">Observation</div>
                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{obs.observation}</div>
                                </div>
                                <div className="space-y-1 relative">
                                    <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                    <div className="text-xs text-red-500/80 font-medium uppercase tracking-wide flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Limitation
                                    </div>
                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{obs.functional_limitation}</div>
                                </div>
                                <div className="space-y-1 relative">
                                    <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 text-slate-300">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                    <div className="text-xs text-green-600/80 font-medium uppercase tracking-wide flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Accommodation
                                    </div>
                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{obs.accommodation}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {observations.length === 0 && !isAdding && (
                    <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <p className="text-slate-500 text-sm mb-4">No structured observations recorded.</p>
                        <ActionButton
                            onClick={() => setIsAdding(true)}
                            icon={<Plus className="w-4 h-4" />}
                            variant="secondary"
                        >
                            Add Clinical Logic
                        </ActionButton>
                    </div>
                )}
            </div>

            {/* Add New Form */}
            {isAdding && (
                <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl space-y-4 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                            <select
                                className="w-full rounded-lg border-slate-300 text-sm"
                                value={newObs.category}
                                onChange={e => setNewObs({ ...newObs, category: e.target.value })}
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Observation (Fact)</label>
                            <input
                                className="w-full rounded-lg border-slate-300 text-sm"
                                placeholder="e.g. Client diagnosed with sciatica"
                                value={newObs.observation}
                                onChange={e => setNewObs({ ...newObs, observation: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-red-500/80 mb-1">Functional Limitation (Effect)</label>
                            <input
                                className="w-full rounded-lg border-slate-300 text-sm"
                                placeholder="e.g. Cannot sit for > 30 mins"
                                value={newObs.functional_limitation}
                                onChange={e => setNewObs({ ...newObs, functional_limitation: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-green-600/80 mb-1">Vocational Accommodation (Fix)</label>
                            <input
                                className="w-full rounded-lg border-slate-300 text-sm"
                                placeholder="e.g. Sit/Stand workstation"
                                value={newObs.accommodation}
                                onChange={e => setNewObs({ ...newObs, accommodation: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <ActionButton
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsAdding(false)}
                        >
                            Cancel
                        </ActionButton>
                        <ActionButton
                            size="sm"
                            onClick={handleAdd}
                            disabled={!newObs.observation || !newObs.functional_limitation}
                            className="bg-indigo-600 text-white"
                        >
                            Add Logic
                        </ActionButton>
                    </div>
                </div>
            )}

            {observations.length > 0 && !isAdding && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                        <Plus className="w-3 h-3" /> Add Another
                    </button>
                </div>
            )}
        </div>
    );
};
