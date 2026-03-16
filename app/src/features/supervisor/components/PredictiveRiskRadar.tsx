'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertCircle, TrendingUp, ShieldAlert } from 'lucide-react';

interface Props {
    data: {
        factor: string;
        value: number;
        fullMark: number;
    }[];
    aggregateScore: number;
}

export const PredictiveRiskRadar: React.FC<Props> = ({ data, aggregateScore }) => {
    const getPriorityColor = (score: number) => {
        if (score > 80) return 'text-red-600 dark:text-red-400';
        if (score > 50) return 'text-orange-500 dark:text-orange-400';
        return 'text-emerald-500 dark:text-emerald-400';
    };

    const getPriorityBg = (score: number) => {
        if (score > 80) return 'bg-red-500/10 border-red-500/20';
        if (score > 50) return 'bg-orange-500/10 border-orange-500/20';
        return 'bg-emerald-500/10 border-emerald-500/20';
    };

    return (
        <GlassCard className="p-6 border-white/20 h-full flex flex-col">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-primary" />
                        Clinical Risk Radar
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Predictive analysis of documentation gaps & complexity.</p>
                </div>
                <div className={`px-4 py-2 rounded-2xl border text-center ${getPriorityBg(aggregateScore)}`}>
                    <div className={`text-2xl font-black ${getPriorityColor(aggregateScore)}`}>{aggregateScore}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Priority Index</div>
                </div>
            </div>

            <div className="flex-1 min-h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="var(--color-slate-200)" opacity={0.5} />
                        <PolarAngleAxis
                            dataKey="factor"
                            tick={{ fill: 'var(--color-slate-500)', fontSize: 10, fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                        />
                        <Radar
                            name="Risk Factors"
                            dataKey="value"
                            stroke="var(--color-primary)"
                            fill="var(--color-primary)"
                            fillOpacity={0.3}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '12px',
                                border: '1px solid var(--color-slate-100)',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Velocity
                    </div>
                    <div className="text-sm font-bold">Stable</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase mb-1">
                        <AlertCircle className="w-3 h-3" />
                        Compliance
                    </div>
                    <div className="text-sm font-bold text-orange-500">Action Needed</div>
                </div>
            </div>
        </GlassCard>
    );
};
