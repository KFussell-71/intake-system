'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Globe, ArrowRight, Layers } from 'lucide-react';
import { getComparabilityAction } from '@/app/actions/comparabilityActions';
import { NormalizationResult } from '@/repositories/ComparabilityRepository';

export const ComparabilityWidget = () => {
    const [metrics, setMetrics] = useState<NormalizationResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMetrics = async () => {
            const res = await getComparabilityAction('BARRIERS');
            if (res.success && res.data) {
                setMetrics(res.data);
            }
            setLoading(false);
        };
        loadMetrics();
    }, []);

    if (loading) return <div className="text-sm text-slate-500 animate-pulse">Translating Local Data...</div>;

    return (
        <GlassCard className="h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                    <Globe className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Cross-State Comparability</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Rosetta Stone Layer</p>
                </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {metrics.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No mapped data found per federal standards.
                    </div>
                ) : (
                    metrics.map((metric) => (
                        <div key={metric.canonical_key} className="bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 p-4">
                            {/* Canonical Header */}
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 dark:border-white/10">
                                <div>
                                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">{metric.canonical_name}</h4>
                                    <p className="text-[10px] text-slate-400 font-mono">{metric.canonical_key}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">{metric.total_count}</span>
                                    <span className="text-[10px] uppercase text-slate-400">Total Cases</span>
                                </div>
                            </div>

                            {/* Local Breakdown */}
                            <div className="space-y-2">
                                <p className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                                    <Layers className="w-3 h-3" /> Local Term Mappings
                                </p>
                                {Object.entries(metric.local_breakdown || {}).map(([term, count]) => (
                                    <div key={term} className="flex justify-between items-center text-xs pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-600 dark:text-slate-400 capitalize">{term.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ArrowRight className="w-3 h-3 text-slate-300" />
                                            <span className="font-mono font-bold text-slate-500">{count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 text-center">
                <p className="text-xs text-slate-400 italic">
                    Data normalized to Federal Standard 2026.1
                </p>
            </div>
        </GlassCard>
    );
};
