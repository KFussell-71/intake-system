import { SupervisorService, SupervisorMetrics } from '@/services/SupervisorService';
import { RiskRadar } from './RiskRadar';
import { ComplianceHeatmap } from './ComplianceHeatmap';
import { ExecutiveBrief } from './ExecutiveBrief';
import { AgencyOnboarding } from '@/features/onboarding/components/AgencyOnboarding';
import { TrainingProvider } from '@/context/TrainingContext';
import { TrainingModeToggle } from '@/features/training/components/TrainingModeToggle';

import { CaseloadDistribution } from './CaseloadDistribution';
import { OutcomeDashboard } from '../../outcomes/components/OutcomeDashboard';

import { GoalDrift } from './GoalDrift';
import { UpcomingExits } from './UpcomingExits';
import { PipelineVelocity } from './PipelineVelocity';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ShieldAlert, Activity, FileWarning, Users, Target, LogOut, LayoutDashboard, TrendingUp } from 'lucide-react';

export async function SupervisorDashboard() {
    let metrics: SupervisorMetrics | null = null;
    let error: string | null = null;

    try {
        metrics = await SupervisorService.getMetrics();
    } catch (err: any) {
        console.error("Dashboard Error:", err);
        error = err.message || "Failed to load supervisor metrics";
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!metrics) return <div>Loading...</div>;

    // Calculate totals for KPI cards
    const totalStalled = metrics.stalled_cases.length;
    const totalComplianceIssues = metrics.compliance_gaps.unsigned_intakes + metrics.compliance_gaps.overdue_reviews + metrics.compliance_gaps.missing_docs;
    const totalGoalDrift = metrics.goal_drift.length;

    return (
        <TrainingProvider>
            <div className="space-y-6">
                <AgencyOnboarding />
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Supervisor Command Center</h1>
                        <p className="text-muted-foreground">Operational oversight and management control.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <TrainingModeToggle />
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            <Activity className="w-4 h-4 text-green-500" />
                            <span>Live Metrics</span>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="operations" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                        <TabsTrigger value="operations">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Command Center
                        </TabsTrigger>
                        <TabsTrigger value="outcomes">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Economic Impact
                        </TabsTrigger>
                    </TabsList>

                    {/* 1. OPERATIONS TAB (Original Content) */}
                    <TabsContent value="operations" className="space-y-6 mt-6">
                        {/* Executive Brief (AI) */}
                        <ExecutiveBrief />

                        {/* KPI Overview Row */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* 1. Ghost Clients */}
                            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm border-l-4 border-l-red-500">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <span className="text-sm font-medium">Ghost Clients</span>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold text-red-600">{totalStalled}</div>
                                <p className="text-xs text-muted-foreground">No contact {'>'} 14 days</p>
                            </div>

                            {/* 2. Paperwork Debt */}
                            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm border-l-4 border-l-amber-500">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <span className="text-sm font-medium">Paperwork Debt</span>
                                    <FileWarning className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold text-amber-600">{totalComplianceIssues}</div>
                                <p className="text-xs text-muted-foreground">Missing items requiring action</p>
                            </div>

                            {/* 3. Goal Drift */}
                            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm border-l-4 border-l-orange-500">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <span className="text-sm font-medium">Goal Drift</span>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold text-orange-600">{totalGoalDrift}</div>
                                <p className="text-xs text-muted-foreground">Goals past target date</p>
                            </div>

                            {/* 4. Upcoming Exits */}
                            <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm border-l-4 border-l-blue-500">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <span className="text-sm font-medium">Upcoming Exits</span>
                                    <LogOut className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold text-blue-600">{metrics.upcoming_exits.length}</div>
                                <p className="text-xs text-muted-foreground">Closing within 30 days</p>
                            </div>
                        </div>

                        {/* Main Content Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Column 1: Risks & Stalls */}
                            <div className="space-y-6">
                                <RiskRadar clients={metrics.stalled_cases} />
                            </div>

                            {/* Column 2: Compliance & Velocity */}
                            <div className="space-y-6">
                                <ComplianceHeatmap data={metrics.compliance_gaps} />
                                <CaseloadDistribution data={metrics.caseload_stats} />
                                <PipelineVelocity data={metrics.pipeline_velocity} />
                            </div>


                            {/* Column 3: Outcomes & Exits */}
                            <div className="space-y-6">
                                <GoalDrift goals={metrics.goal_drift} />
                                <UpcomingExits exits={metrics.upcoming_exits} />
                            </div>
                        </div>
                    </TabsContent>

                    {/* 2. OUTCOMES TAB (New Content) */}
                    <TabsContent value="outcomes" className="mt-6">
                        <OutcomeDashboard />
                    </TabsContent>
                </Tabs>
            </div>
        </TrainingProvider>
    );
}
