"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { dashboardRepository } from '@/repositories/DashboardRepository';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { DataExportCard } from './DataExportCard';

export function OutcomesDashboard() {
    const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
    const [riskProfile, setRiskProfile] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const [trends, risks] = await Promise.all([
                dashboardRepository.getMonthlyIntakes(),
                dashboardRepository.getRiskProfiling()
            ]);
            setMonthlyTrends(trends);
            setRiskProfile(risks);
            setLoading(false);
        };
        loadData();
    }, []);

    const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Low (Green), Med (Orange), High (Red)

    if (loading) return <div className="p-12 text-center animate-pulse">Loading Analytics...</div>;

    const totalIntakes = monthlyTrends.reduce((acc, curr) => acc + curr.intakes, 0);
    const avgMonthly = Math.round(totalIntakes / (monthlyTrends.length || 1));

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Total Intakes</p>
                            <h3 className="text-3xl font-bold mt-1">{totalIntakes}</h3>
                        </div>
                        <Users className="w-6 h-6 text-indigo-200" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Monthly Avg</p>
                            <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">{avgMonthly}</h3>
                        </div>
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">High Risk Cases</p>
                            <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">
                                {riskProfile.find(r => r.name === 'High Risk')?.value || 0}
                            </h3>
                        </div>
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Placement Rate</p>
                            <h3 className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">82%</h3>
                        </div>
                        <Target className="w-6 h-6 text-blue-500" />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Trend Chart */}
                <Card className="lg:col-span-2 p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle>Intake Volume Trends</CardTitle>
                    </CardHeader>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="intakes" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Risk Profile Pie */}
                <Card className="lg:col-span-1 p-6">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle>Risk Profile Distribution</CardTitle>
                    </CardHeader>
                    <div className="h-[300px] w-full flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskProfile}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskProfile.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 text-xs text-slate-500 mt-4">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Low</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Med</div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> High</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Export Section */}
            <DataExportCard />
        </div>
    );
}
