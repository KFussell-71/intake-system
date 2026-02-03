import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/ActionButton';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';

import { ReadinessTrendChart } from '@/features/reports/components/ReadinessTrendChart';
import { BarriersRemovalChart } from '@/features/reports/components/BarriersRemovalChart';
import { SupervisorPulse } from './SupervisorPulse';

export const SupervisorDashboard: React.FC = () => {
    const [reviews, setReviews] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [pulseStats, setPulseStats] = React.useState({
        avgApprovalTime: '4.2 Hours',
        criticalMismatches: 0,
        slaBreaches: 0
    });

    React.useEffect(() => {
        const fetchDashboardData = async () => {
            // 1. Fetch Pending Reviews with joined Assessment data for AI Risks
            const { data: pendingData, error } = await supabase
                .from('intakes')
                .select(`
                    id,
                    status,
                    created_at,
                    submitted_at,
                    clients ( name ),
                    profiles!intakes_user_id_fkey ( username ),
                    intake_assessments ( ai_risk_score, ai_discrepancy_notes )
                `)
                .eq('status', 'awaiting_review');

            if (pendingData) {
                const now = new Date();
                let slaCount = 0;
                let riskCount = 0;

                const formattedReviews = pendingData.map((r: any) => {
                    // SLA Calc
                    const submittedAt = r.submitted_at ? new Date(r.submitted_at) : new Date(r.created_at);
                    const hoursPending = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
                    const isSlaBreach = hoursPending > 24;
                    if (isSlaBreach) slaCount++;

                    // Risk Calc
                    const assessment = r.intake_assessments?.[0]; // Access joined array
                    const isHighRisk = assessment?.ai_risk_score > 75; // Threshold
                    if (isHighRisk) riskCount++;

                    return {
                        id: r.id,
                        client: r.clients?.name || 'Unknown',
                        type: 'Intake Report',
                        date: new Date(r.created_at).toLocaleDateString(),
                        specialist: r.profiles?.username || 'Staff',
                        hoursPending: Math.round(hoursPending),
                        isSlaBreach,
                        isHighRisk,
                        riskScore: assessment?.ai_risk_score
                    };
                });

                setReviews(formattedReviews);
                setPulseStats(prev => ({
                    ...prev,
                    criticalMismatches: riskCount,
                    slaBreaches: slaCount
                }));
            }
            setLoading(false);
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-12 text-center animate-pulse">Loading Command Center...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Supervisor Command Center</h2>
                <div className="flex space-x-2">
                    <Button variant="outline" size="sm">Filter by Specialist</Button>
                </div>
            </div>

            {/* Phase 36: Pulse Header */}
            <SupervisorPulse stats={pulseStats} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReadinessTrendChart />
                <BarriersRemovalChart />
            </div>

            <div className="bg-white rounded-md border shadow-sm">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">Review Queue</h3>
                    <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">{reviews.length} Pending</span>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
                        <tr>
                            <th className="px-6 py-3">Client</th>
                            <th className="px-6 py-3">Time in State</th>
                            <th className="px-6 py-3">Risk Level</th>
                            <th className="px-6 py-3">Submitted By</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400 italic">No pending reviews. Good job!</td>
                            </tr>
                        ) : reviews.map((r) => (
                            <tr key={r.id} className={`hover:bg-gray-50 text-slate-800 ${r.isSlaBreach ? 'bg-orange-50/50' : ''}`}>
                                <td className="px-6 py-4 font-bold">{r.client}</td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded ${r.isSlaBreach ? 'bg-red-100 text-red-700 font-bold' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        <Clock className="w-3 h-3" />
                                        {r.hoursPending}h
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {r.isHighRisk ? (
                                        <div className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                            <AlertTriangle className="w-3 h-3" />
                                            HIGH RISK ({r.riskScore})
                                        </div>
                                    ) : (
                                        <div className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                                            <CheckCircle className="w-3 h-3" />
                                            Low Risk
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">{r.specialist}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
