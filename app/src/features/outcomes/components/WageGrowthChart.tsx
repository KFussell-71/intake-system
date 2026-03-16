'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WageGrowthChartProps {
    avgWage: number;
    wageGrowth: number;
}

export function WageGrowthChart({ avgWage, wageGrowth }: WageGrowthChartProps) {
    // Calculate pre-program wage based on growth
    const preProgramWage = avgWage - wageGrowth;

    const data = [
        { name: 'Pre-Program', wage: preProgramWage, fill: '#94a3b8' }, // slate-400
        { name: 'Post-Placement', wage: avgWage, fill: '#10b981' }      // emerald-500
    ];

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Wage Growth (ROI)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                            <Tooltip
                                formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Hourly Wage']}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="wage" radius={[0, 4, 4, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Economic Uplift:</span>
                    <span className="font-bold text-green-600">+${wageGrowth.toFixed(2)} / hr</span>
                </div>
            </CardContent>
        </Card>
    );
}
