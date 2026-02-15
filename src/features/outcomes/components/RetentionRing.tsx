'use client';

import { RadialBarChart, RadialBar, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RetentionRingProps {
    rates: {
        day_30: number;
        day_60: number;
        day_90: number;
    };
}

export function RetentionRing({ rates }: RetentionRingProps) {
    const data = [
        { name: '30 Days', uv: rates.day_30, fill: '#10b981' }, // green-500
        { name: '60 Days', uv: rates.day_60, fill: '#3b82f6' }, // blue-500
        { name: '90 Days', uv: rates.day_90, fill: '#8b5cf6' }  // violet-500
    ];

    const style = {
        top: '50%',
        right: 0,
        transform: 'translate(0, -50%)',
        lineHeight: '24px',
    };

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Retention Power</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={data}>
                            <RadialBar
                                label={{ position: 'insideStart', fill: '#fff' }}
                                background
                                dataKey="uv"
                            />
                            <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={style} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Percentage of clients still employed at key milestones.
                </div>
            </CardContent>
        </Card>
    );
}
