'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { reportController } from '@/controllers/ReportController';
import { TrendingUp } from 'lucide-react';

export const PlacementOutcomeChart = () => {
    const [data, setData] = useState<{ name: string; value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const result = await reportController.getPlacementOutcomes();
            if (result.success && result.data) {
                setData(result.data);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <GlassCard className="p-6 h-[380px] flex items-center justify-center">
                <div className="animate-pulse text-slate-400 font-medium">Analyzing Outcomes...</div>
            </GlassCard>
        );
    }

    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Placement Outcomes by Job Title
            </h3>
            <div className="h-64 w-full">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.1} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                fontSize={10}
                                width={120}
                                tick={{ fill: '#94a3b8' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                                {data.map((_entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill="var(--color-success)"
                                        opacity={0.4 + (1 - index / data.length) * 0.6}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                        No placement data to display.
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
