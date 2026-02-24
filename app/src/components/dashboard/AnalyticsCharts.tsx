import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { IntakeTrend, StaffWorkload } from '@/types/dashboard';
import { HelpCircle } from 'lucide-react';

export function IntakeTrendChart({ data }: { data: IntakeTrend[] }) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400">No trend data available</div>;
    }

    return (
        <div className="relative h-64 w-full">
            <div className="absolute top-0 right-0 z-10">
                <div
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 cursor-help"
                    title="Shows total intakes started per day over the last 30 days. Useful for tracking seasonal volume."
                >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickMargin={10}
                        stroke="#888888"
                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    />
                    <YAxis fontSize={12} stroke="#888888" allowDecimals={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelStyle={{ color: '#666' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#3b82f6' }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1000}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export function WorkloadBarChart({ data }: { data: StaffWorkload[] }) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-slate-400">No workload data available</div>;
    }

    return (
        <div className="relative h-64 w-full">
            <div className="absolute top-0 right-0 z-10">
                <div
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 cursor-help"
                    title="Top active staff members. 'Active Clients' = assigned participants. 'In Progress' = intakes not yet completed."
                >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                    <XAxis type="number" fontSize={12} stroke="#888888" />
                    <YAxis
                        dataKey="staff_name"
                        type="category"
                        fontSize={12}
                        stroke="#888888"
                        width={100}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend iconType="circle" />
                    <Bar
                        dataKey="active_clients"
                        name="Active Clients"
                        fill="#f59e0b"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        animationDuration={1000}
                    />
                    <Bar
                        dataKey="intakes_in_progress"
                        name="In Progress"
                        fill="#ef4444"
                        radius={[0, 4, 4, 0]}
                        barSize={20}
                        animationDuration={1000}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
