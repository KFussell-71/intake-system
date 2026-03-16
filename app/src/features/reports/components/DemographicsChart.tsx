'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { PieChart as PieIcon } from 'lucide-react';

interface DemographicsChartProps {
    data: {
        employed: number;
        unemployed: number;
    };
}

export const DemographicsChart: React.FC<DemographicsChartProps> = ({ data }) => {
    const chartData = [
        { name: 'Employed', value: data.employed },
        { name: 'Unemployed', value: data.unemployed },
    ];

    const COLORS = ['var(--color-accent)', 'oklch(0.65 0.25 350 / 0.2)'];

    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-accent" />
                Demographics Overview
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            formatter={(value) => <span className="text-xs font-medium text-slate-500">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
};
