'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/ActionButton';
import { supabase } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ReadinessTrendChart } from '@/features/reports/components/ReadinessTrendChart';
import { BarriersRemovalChart } from '@/features/reports/components/BarriersRemovalChart';
import { OutcomesDashboard } from '@/features/reporting/components/OutcomesDashboard';
import { SupervisorPulse } from './SupervisorPulse';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { TrainingCenterDialog } from '@/features/training/components/TrainingCenterDialog';
import { DemoControls } from '@/features/admin/components/DemoControls';
import { GettingStartedWidget } from '@/features/onboarding/components/GettingStartedWidget';
import { SystemDeadlinesWidget } from './SystemDeadlinesWidget';
import { generateGmailLink } from '@/lib/googleUtils';
import { Mail } from 'lucide-react';
import { TeamChatWidget } from './TeamChatWidget';
import { TeamManagementWidget } from './TeamManagementWidget';
import { PredictiveRiskRadar } from './PredictiveRiskRadar';
import { IntelligenceService } from '@/services/IntelligenceService';
import { ReviewQueueTable } from './ReviewQueueTable';
import { DashboardCalendar } from './DashboardCalendar';
import { DemographicsChart } from '@/features/reports/components/DemographicsChart';
import { WorkerAssignmentDialog } from './WorkerAssignmentDialog';
import { reportRepository } from '@/repositories/ReportRepository';
import { dashboardRepository } from '@/repositories/DashboardRepository';

import InviteToPortalButton from '@/features/clients/components/InviteToPortalButton';
import { useRouter } from 'next/navigation';

export const SupervisorDashboard: React.FC = () => {
    const router = useRouter();
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

    const [radarData, setRadarData] = React.useState([
        { factor: 'Clinical Complexity', value: 0, fullMark: 100 },
        { factor: 'Audit Risk', value: 0, fullMark: 100 },
        { factor: 'Velocity Risk', value: 0, fullMark: 100 },
        { factor: 'Doc Quality', value: 0, fullMark: 100 },
        { factor: 'Follow-ups', value: 0, fullMark: 100 },
    ]);
    const [priorityIndex, setPriorityIndex] = React.useState(0);
    const [demographics, setDemographics] = React.useState({ employed: 0, unemployed: 0 });

    // Assignment Dialog State
    const [assignmentOpen, setAssignmentOpen] = React.useState(false);
    const [activeAssignment, setActiveAssignment] = React.useState<{ id: string; name: string } | null>(null);

    const fetchDashboardData = async () => {
        // 0. Get Current User for Conflict Check
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id || null);

        // 1. Fetch Pending Reviews
        const { data: pendingData, error } = await supabase
            .from('intakes')
            .select(`
                id,
                client_id,
                status,
                created_at,
                submitted_at,
                user_id,
                clients ( name, email ),
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
                    clientId: r.client_id,
                    client: r.clients?.name || 'Unknown',
                    email: r.clients?.email,
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

            // Fetch Real Stats from Repository
            const [avgTime, demoData] = await Promise.all([
                reportRepository.getAverageApprovalTime(),
                reportRepository.getDemographics()
            ]);

            setDemographics(demoData);
            setPulseStats(prev => ({
                ...prev,
                avgApprovalTime: avgTime,
                criticalMismatches: riskCount,
                slaBreaches: slaCount
            }));

            // Phase 37 Intelligence Integration
            const aggregateRadar = [
                { factor: 'Clinical Complexity', value: Math.min(100, riskCount * 25), fullMark: 100 },
                { factor: 'Audit Risk', value: Math.min(100, formattedReviews.filter(r => r.isHighRisk && !r.riskScore).length * 40), fullMark: 100 },
                { factor: 'Velocity Risk', value: Math.min(100, slaCount * 20), fullMark: 100 },
                { factor: 'Doc Quality', value: 85, fullMark: 100 },
                { factor: 'Follow-ups', value: 60, fullMark: 100 },
            ];
            setRadarData(aggregateRadar);

            const avgScore = Math.round(aggregateRadar.reduce((acc, curr) => acc + curr.value, 0) / aggregateRadar.length);
            setPriorityIndex(avgScore);
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

    const handleOpenAssignment = (id: string, name: string) => {
        setActiveAssignment({ id, name });
        setAssignmentOpen(true);
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
                    <TrainingCenterDialog />
                    <Button variant="outline" size="sm">Filter by Specialist</Button>
                </div>
            </div>

            {/* Phase 13: Onboarding Widget */}
            <GettingStartedWidget />

            {/* Phase 36: Pulse Header */}
            <SupervisorPulse stats={pulseStats} />

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Command Center</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics & Reporting</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Phase 37 Strategic Intelligence Alert */}
                    {priorityIndex > 60 && (
                        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-orange-800 uppercase tracking-tight">Clinical Priority Alert</h4>
                                    <p className="text-xs text-orange-700 font-medium">
                                        High clinical pressure detected. {pulseStats.criticalMismatches} cases flagged with clinical complexity require rationale verification.
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-orange-700 hover:bg-orange-500/10 font-bold" onClick={() => router.push('/reports')}>
                                Strategic Breakdown
                            </Button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ReadinessTrendChart />
                                <BarriersRemovalChart />
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <PredictiveRiskRadar data={radarData} aggregateScore={priorityIndex} />
                        </div>
                    </div>

                    {/* Google Action Hub - Fix #2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
                        {/* System Deadlines Feed (Push-to-Google) */}
                        <div className="lg:col-span-1 h-full">
                            <SystemDeadlinesWidget />
                        </div>

                        {/* Shared Dashboard Calendar - REPLACED Google Iframe */}
                        <div className="lg:col-span-2 h-full">
                            <DashboardCalendar />
                        </div>

                        <div className="grid grid-cols-12 gap-6">
                            <TeamManagementWidget />
                        </div>
                    </div>

                    <ReviewQueueTable
                        reviews={reviews}
                        selectedIds={selectedIds}
                        currentUserId={currentUserId}
                        onToggleSelection={toggleSelection}
                        onToggleSelectAll={toggleSelectAll}
                        onAssign={handleOpenAssignment}
                    />

                    {/* Secure Ephemeral Chat - Fix #3 */}
                    <TeamChatWidget />

                    {/* Secure Ephemeral Chat - Fix #3 */}
                    <TeamChatWidget />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DemographicsChart data={demographics} />
                        <div className="md:col-span-2">
                            <OutcomesDashboard />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Float assignment dialog */}
            {activeAssignment && (
                <WorkerAssignmentDialog
                    open={assignmentOpen}
                    onClose={() => setAssignmentOpen(false)}
                    clientId={activeAssignment.id}
                    clientName={activeAssignment.name}
                    onAssignmentComplete={fetchDashboardData}
                />
            )}
        </div >
    );
};
