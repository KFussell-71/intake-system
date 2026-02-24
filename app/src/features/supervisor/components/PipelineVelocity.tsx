"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Timer } from 'lucide-react';

interface Metric {
    stage: string;
    avg_days: number;
    case_count: number;
}

export function PipelineVelocity({ data }: { data: Metric[] }) {
    if (!data?.length) return null;

    // Sort stages logically if possible, otherwise rely on DB order
    const stageOrder = ['intake', 'assessment', 'planning', 'service_delivery', 'review'];
    const sortedData = [...data].sort((a, b) => {
        return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
    });

    return (
        <Card className="col-span-1 md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pipeline Velocity (Avg Days in Stage)</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="stage"
                                type="category"
                                width={100}
                                tickFormatter={(val) => (val && typeof val === 'string') ? (val.charAt(0).toUpperCase() + val.slice(1).replace('_', ' ')) : 'Unknown'}
                                tick={{ fontSize: 12 }}
                            />

                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px' }}
                                formatter={(value: number | undefined) => [`${value || 0} days`, 'Avg Duration']}
                            />
                            <Bar dataKey="avg_days" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs text-muted-foreground">
                    {sortedData.map((d, i) => (
                        <div key={i} className="flex flex-col border rounded p-1 shadow-sm">
                            <span className="font-semibold">{d.avg_days || 0}d</span>
                            <span className="capitalize">{(d.stage || 'unknown').replace('_', ' ')}</span>
                        </div>
                    ))}

                </div>
            </CardContent>
        </Card>
    );
}
