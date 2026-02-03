import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/ActionButton';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';

import { ReadinessTrendChart } from '@/features/reports/components/ReadinessTrendChart';
import { BarriersRemovalChart } from '@/features/reports/components/BarriersRemovalChart';
import { SupervisorPulse } from './SupervisorPulse';
import { BulkActionsToolbar } from './BulkActionsToolbar';

export const SupervisorDashboard: React.FC = () => {
    const [reviews, setReviews] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = React.useState(false);

    const [pulseStats, setPulseStats] = React.useState({
        avgApprovalTime: '4.2 Hours',
        criticalMismatches: 0,
        slaBreaches: 0
    });

    const fetchDashboardData = async () => {
        // 0. Get Current User for Conflict Check
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // 1. Fetch Pending Reviews
        const { data: pendingData, error } = await supabase
            .from('intakes')
            .select(`
                id,
                status,
                created_at,
                submitted_at,
                user_id,
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
                const assessment = r.intake_assessments?.[0];
                const isHighRisk = assessment?.ai_risk_score > 75;
                if (isHighRisk) riskCount++;

                return {
                    id: r.id,
                    client: r.clients?.name || 'Unknown',
                    type: 'Intake Report',
                    date: new Date(r.created_at).toLocaleDateString(),
                    specialist: r.profiles?.username || 'Staff',
                    counselorId: r.user_id,
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

    React.useEffect(() => {
        fetchDashboardData();
    }, []);

    // Selection Handlers
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            // Only select items where current user is NOT the counselor (avoid selecting conflicts)
            const safeIds = reviews
                .filter(r => r.counselorId !== currentUserId)
                .map(r => r.id);
            setSelectedIds(new Set(safeIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    // Bulk Approve Handler
    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);

        try {
            const response = await fetch('/api/supervisor/bulk-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ intakeIds: Array.from(selectedIds) })
            });

            const result = await response.json();

            if (!result.success) {
                alert(`Bulk action failed: ${result.error}`);
            } else {
                // Optimistic UI update or Refetch
                setSelectedIds(new Set());
                await fetchDashboardData();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to server');
        } finally {
            setIsBulkProcessing(false);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse">Loading Command Center...</div>;

    return (
        <div className="space-y-6 relative">
            {/* Toolbar appears when items are selected */}
            {selectedIds.size > 0 && (
                <div className="animate-in slide-in-from-top-2 duration-200 sticky top-0 z-20 -mx-6 -mt-6 mb-6">
                    <BulkActionsToolbar
                        selectedCount={selectedIds.size}
                        totalCount={reviews.length}
                        allSelected={selectedIds.size === reviews.length && reviews.length > 0}
                        onSelectAll={toggleSelectAll}
                        onBulkApprove={handleBulkApprove}
                        onBulkExport={() => alert("Exporting feature coming in Phase 37")}
                        isProcessing={isBulkProcessing}
                    />
                </div>
            )}

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

            <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm">Review Queue</h3>
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">{reviews.length} Pending</span>
                    </div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b">
                        <tr>
                            <th className="w-12 px-6 py-3 text-center">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={reviews.length > 0 && selectedIds.size === reviews.filter(r => r.counselorId !== currentUserId).length}
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                />
                            </th>
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
                                <td colSpan={6} className="p-8 text-center text-slate-400 italic">No pending reviews. Good job!</td>
                            </tr>
                        ) : reviews.map((r) => {
                            const isSelfApproval = currentUserId === r.counselorId;
                            return (
                                <tr key={r.id} className={`hover:bg-gray-50 text-slate-800 ${r.isSlaBreach ? 'bg-orange-50/50' : ''}`}>
                                    <td className="px-6 py-4 text-center">
                                        {!isSelfApproval && (
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={selectedIds.has(r.id)}
                                                onChange={() => toggleSelection(r.id)}
                                            />
                                        )}
                                    </td>
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
                                        {isSelfApproval ? (
                                            <span className="text-xs text-slate-400 italic mr-2" title="Cannot approve own work">Conflict of Interest</span>
                                        ) : (
                                            <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                            </Button>
                                        )}
                                        View
                                    </Button>
                                </td>
                                </tr>
                    );
                        })}
                </tbody>
            </table>
        </div>
        </div >
    );
};
