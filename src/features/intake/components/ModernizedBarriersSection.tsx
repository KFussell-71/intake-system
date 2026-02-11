import React, { useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { useBarriers } from '../hooks/useBarriers';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
    intakeId: string;
}

export const ModernizedBarriersSection: React.FC<Props> = ({ intakeId }) => {
    const {
        barriersByCategory,
        selectedBarriers,
        loading,
        error,
        updating,
        toggleBarrier
    } = useBarriers(intakeId);

    const [filter, setFilter] = useState('');

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
            </div>
        );
    }

    // Helper to check selection
    const isSelected = (id: number) => selectedBarriers.some(b => b.barrier_id === id);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Barriers to Employment</h3>
                    <p className="text-sm text-slate-500">Select all factors that may impact job placement.</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300">
                    {selectedBarriers.length} Selected
                </div>
            </div>

            <div className="grid gap-6">
                {Object.entries(barriersByCategory).map(([category, barriers]) => (
                    <GlassCard key={category} className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-primary/20 pb-1 mb-3">
                            {category.replace('_', ' ')}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {barriers.map(barrier => {
                                const selected = isSelected(barrier.id);
                                const isUpdating = updating === barrier.id;

                                return (
                                    <button
                                        key={barrier.id}
                                        onClick={() => toggleBarrier(barrier.id, !selected)}
                                        disabled={isUpdating}
                                        className={cn(
                                            "relative text-left px-3 py-2 rounded-md text-sm transition-all border",
                                            selected
                                                ? "bg-primary/10 border-primary text-primary-700 dark:text-primary-300 shadow-sm"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300 dark:hover:border-slate-700",
                                            isUpdating && "opacity-70 cursor-wait"
                                        )}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{barrier.display}</span>
                                            {selected && !isUpdating && <Check className="w-3.5 h-3.5" />}
                                            {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </GlassCard>
                ))}
            </div>

            {selectedBarriers.length === 0 && (
                <div className="text-center p-4 text-sm text-slate-400 italic">
                    No barriers identified yet.
                </div>
            )}
        </div>
    );
};
