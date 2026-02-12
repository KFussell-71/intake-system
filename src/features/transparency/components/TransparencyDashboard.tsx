'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import { Eye, RefreshCw, Lock } from 'lucide-react';
import { getPublicDashboardDataAction, publishPublicMetricsAction } from '@/app/actions/transparencyActions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const TransparencyDashboard = () => {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [publishing, setPublishing] = useState(false);

    const loadData = async () => {
        const res = await getPublicDashboardDataAction();
        if (res.success) setMetrics(res.data || []);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handlePublish = async () => {
        setPublishing(true);
        await publishPublicMetricsAction();
        await loadData();
        setPublishing(false);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-6">
            <GlassCard className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-full">
                            <Eye className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Public Trust Dashboard</h2>
                            <div className="flex items-center gap-2 text-xs text-white/50">
                                <Lock className="w-3 h-3" />
                                <span>Air-Gapped Data (No PII)</span>
                            </div>
                        </div>
                    </div>
                    <ActionButton
                        size="md"
                        onClick={handlePublish}
                        isLoading={publishing}
                        icon={<RefreshCw className="w-4 h-4" />}
                        className="bg-cyan-500 hover:bg-cyan-400 text-white border-none"
                    >
                        Publish New Snapshots
                    </ActionButton>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map((metric) => (
                    <GlassCard key={metric.code} className="h-full flex flex-col">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">{metric.name}</h3>

                        {metric.value ? (
                            <div className="flex-1 flex flex-col justify-center items-center">
                                {/* STAT VIEW */}
                                {metric.display_type === 'stat' && (
                                    <>
                                        <div className="text-5xl font-mono font-bold text-cyan-600 dark:text-cyan-400">
                                            {metric.value.count !== undefined ? metric.value.count : metric.value.days}
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2">
                                            {metric.last_updated ? `Updated: ${new Date(metric.last_updated).toLocaleDateString()}` : 'Never updated'}
                                        </div>
                                    </>
                                )}

                                {/* BAR CHART VIEW */}
                                {metric.display_type === 'bar' && metric.value.distribution && (
                                    <div className="w-full h-[200px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={Object.entries(metric.value.distribution).map(([k, v]) => ({ name: k, value: v }))}>
                                                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                                    cursor={{ fill: 'transparent' }}
                                                />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                    {Object.entries(metric.value.distribution).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
                                No data published yet.
                            </div>
                        )}
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};
