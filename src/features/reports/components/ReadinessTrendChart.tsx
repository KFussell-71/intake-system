'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { reportController } from '@/controllers/ReportController';

interface ReadinessScore {
    date: string;
    score: number;
}

export const ReadinessTrendChart = () => {
    const [data, setData] = useState<ReadinessScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrend = async () => {
            const result = await reportController.getReadinessTrend();
            if (result.success && result.data) {
                setData(result.data);
            }
            setLoading(false);
        };
        fetchTrend();
    }, []);

    if (loading) {
        return (
            <GlassCard className="p-6 border border-white/20 h-[380px] flex items-center justify-center">
                <div className="animate-pulse text-slate-400 font-medium">Calculating Trend...</div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6 border border-white/20">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Readiness Progression</h4>
            <div className="h-[300px] w-full">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                        No intake data available for trending yet.
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
