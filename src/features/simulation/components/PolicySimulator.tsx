'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { PlayCircle, AlertTriangle, ArrowRight, BarChart3 } from 'lucide-react';
import { getPoliciesAction, runPolicySimulationAction } from '@/app/actions/simulationActions';
import { PolicyDefinition, SimulationResult } from '@/repositories/SimulationRepository';

export const PolicySimulator = () => {
    const [policies, setPolicies] = useState<PolicyDefinition[]>([]);
    const [selectedPolicy, setSelectedPolicy] = useState<string>('');
    const [result, setResult] = useState<SimulationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);

    useEffect(() => {
        const loadPolicies = async () => {
            setLoading(true);
            const res = await getPoliciesAction();
            if (res.success && res.data) {
                setPolicies(res.data);
                if (res.data.length > 0) setSelectedPolicy(res.data[0].id);
            }
            setLoading(false);
        };
        loadPolicies();
    }, []);

    const handleRunSimulation = async () => {
        if (!selectedPolicy) return;
        setSimulating(true);
        setResult(null);

        const res = await runPolicySimulationAction(selectedPolicy);
        if (res.success && res.data) {
            setResult(res.data);
        }
        setSimulating(false);
    };

    if (loading) return <div className="text-sm text-slate-500 animate-pulse">Loading Policy Engine...</div>;

    return (
        <GlassCard className="h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Policy Simulator</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">Institutional Intelligence</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Controls */}
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Proposed Policy</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-md text-sm px-3 py-2"
                            value={selectedPolicy}
                            onChange={(e) => setSelectedPolicy(e.target.value)}
                        >
                            {policies.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <ActionButton
                            onClick={handleRunSimulation}
                            isLoading={simulating}
                            icon={<PlayCircle className="w-4 h-4" />}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none"
                        >
                            Run Sim
                        </ActionButton>
                    </div>
                    {/* Active Rule Description */}
                    {selectedPolicy && (
                        <p className="text-xs text-slate-400 mt-2 italic">
                            {policies.find(p => p.id === selectedPolicy)?.description}
                        </p>
                    )}
                </div>

                {/* Results Visualizer */}
                {result && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-sm text-slate-600 dark:text-slate-300">Simulation Outcome</h4>
                            <span className="text-xs text-slate-500">Based on {result.cases_analyzed} historical cases</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                            {/* Baseline */}
                            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Baseline Fail Rate</p>
                                <div className="text-xl font-bold font-mono text-slate-600 dark:text-slate-300">
                                    {result.baseline_failure_rate}%
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center justify-center">
                                <ArrowRight className="w-6 h-6 text-slate-300" />
                            </div>

                            {/* Simulated */}
                            <div className={`p-3 rounded-lg text-center border ${result.impact_summary.delta > 0
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-emerald-500/10 border-emerald-500/20'
                                }`}>
                                <p className={`text-[10px] uppercase font-bold mb-1 ${result.impact_summary.delta > 0 ? 'text-red-500' : 'text-emerald-500'
                                    }`}>Simulated Rate</p>
                                <div className={`text-xl font-bold font-mono ${result.impact_summary.delta > 0 ? 'text-red-600' : 'text-emerald-500'
                                    }`}>
                                    {result.simulated_failure_rate}%
                                </div>
                            </div>
                        </div>

                        {/* Impact Statement */}
                        <div className={`p-3 rounded-md text-sm flex gap-3 items-start ${result.impact_summary.delta > 0
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            }`}>
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <strong className="block mb-1">Executive Summary</strong>
                                {result.impact_summary.delta > 0
                                    ? `Implementing "${result.policy_name}" would likely increase compliance failures by ${result.impact_summary.delta} cases (+${(result.simulated_failure_rate - result.baseline_failure_rate).toFixed(1)}%). Consider mitigating bottlenecks first.`
                                    : `Implementing "${result.policy_name}" is projected to reduce compliance failures.`
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
