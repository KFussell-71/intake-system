'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';

const data = [
    { name: 'Initial', count: 5 },
    { name: 'Month 1', count: 4 },
    { name: 'Month 2', count: 2 },
    { name: 'Current', count: 1 },
];

export const BarriersRemovalChart = () => {
    return (
        <GlassCard className="p-6 border border-white/20">
            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Barriers to Employment</h4>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
};
