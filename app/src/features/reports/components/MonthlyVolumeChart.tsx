'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GlassCard } from '@/components/ui/GlassCard';
import { BarChart3 } from 'lucide-react';

interface MonthlyVolumeChartProps {
    data: number[];
}

export const MonthlyVolumeChart: React.FC<MonthlyVolumeChartProps> = ({ data }) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    // Map data to Recharts format
    const chartData = data.map((count, i) => {
        const monthIndex = (currentMonth - 5 + i + 12) % 12;
        return {
            name: months[monthIndex],
            count: count
        };
    });

    return (
        <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Monthly Intake Volume
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            fontSize={12}
                            tick={{ fill: '#94a3b8' }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            fontSize={12}
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
                            itemStyle={{ color: 'var(--color-primary)' }}
                        />
                        <Bar
                            dataKey="count"
                            radius={[6, 6, 0, 0]}
                            barSize={40}
                        >
                            {chartData.map((_entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={index === chartData.length - 1 ? 'var(--color-primary)' : 'var(--color-primary)'}
                                    opacity={0.3 + (index / chartData.length) * 0.7}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    );
};
