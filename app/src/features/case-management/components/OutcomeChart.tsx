'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { OutcomeRecord, OutcomeMeasure } from '@/services/OutcomeService';
import { GlassCard } from '@/components/ui/GlassCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    history: OutcomeRecord[];
    measures: OutcomeMeasure[];
}

export function OutcomeChart({ history, measures }: Props) {
    const [selectedMeasureId, setSelectedMeasureId] = useState<string>('');

    useEffect(() => {
        if (measures.length > 0 && !selectedMeasureId) {
            setSelectedMeasureId(measures[0].id);
        }
    }, [measures]);

    const selectedMeasure = measures.find(m => m.id === selectedMeasureId);

    // Filter and format data for chart
    const chartData = history
        .filter(r => r.measure_id === selectedMeasureId)
        .map(r => ({
            date: format(new Date(r.recorded_at), 'MMM d'),
            fullDate: format(new Date(r.recorded_at), 'MMM d, yyyy'),
            value: Number(r.value),
            notes: r.notes
        }));

    if (measures.length === 0) return null;

    return (
        <GlassCard className="p-6 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Outcome Trends</h3>
                    <p className="text-sm text-slate-500">Visualize client progress over time</p>
                </div>
                <Select value={selectedMeasureId} onValueChange={setSelectedMeasureId}>
                    <SelectTrigger className="w-[240px] bg-white">
                        <SelectValue placeholder="Select Metric" />
                    </SelectTrigger>
                    <SelectContent>
                        {measures.map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex-1 w-full min-h-0">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12, fill: '#64748B' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                domain={[selectedMeasure?.min_value || 0, selectedMeasure?.max_value || 'auto']}
                                tick={{ fontSize: 12, fill: '#64748B' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#64748B', marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#8884d8"
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        No data points recorded for this metric yet.
                    </div>
                )}
            </div>
        </GlassCard>
    );
}
