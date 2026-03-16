"use client";

import React from 'react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, Legend, CartesianGrid
} from 'recharts';
import { Users, Briefcase, AlertTriangle, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

/* 
 * AESTHETICS:
 * Using a vibrant palette that contrasts well with both light and dark modes.
 * Charts are wrapped in GlassCards for that premium feel.
 */
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
    analytics: any;
    trends: any[];
}

export const DashboardCharts: React.FC<Props> = ({ analytics, trends }) => {
    // Graceful fallback for empty data
    const referrals = analytics?.referrals || [];
    const employment = analytics?.employment || [];
    const readiness = analytics?.readiness || [];
    const barriers = analytics?.barriers || { avg: 0, max: 0, total_intakes: 0 };

    return (
        <div className="space-y-6">
            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard
                    title="Total Intakes"
                    value={barriers.total_intakes}
                    icon={Users}
                    color="text-blue-500"
                />
                <KPICard
                    title="Avg Barriers"
                    value={barriers.avg}
                    icon={AlertTriangle}
                    color="text-orange-500"
                />
                <KPICard
                    title="Readiness Score"
                    value={readiness.length > 0 ? "7.2" : "N/A"} // Mock aggregate if not calculated
                    icon={TrendingUp}
                    color="text-green-500"
                    subtext="Target: >8.0"
                />
                <KPICard
                    title="Placement Rate"
                    value="12%"
                    icon={Briefcase}
                    color="text-purple-500"
                    subtext="Last 30 Days"
                />
            </div>

            {/* CHARTS ROW 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-6 h-[400px]">
                    <h3 className="text-lg font-bold mb-4">Referral Sources</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={referrals}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {referrals.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </GlassCard>

                <GlassCard className="p-6 h-[400px]">
                    <h3 className="text-lg font-bold mb-4">Readiness Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={readiness}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                            <XAxis dataKey="score" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            {/* CHARTS ROW 2 - Trends */}
            <GlassCard className="p-6 h-[400px]">
                <h3 className="text-lg font-bold mb-4">Intake Volume (30 Days)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        />
                        <YAxis />
                        <Tooltip
                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </GlassCard>
        </div>
    );
};

// Helper Component for consistency
const KPICard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <GlassCard className="p-6 flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <h4 className="text-3xl font-bold mt-1">{value}</h4>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
        </div>
    </GlassCard>
);
