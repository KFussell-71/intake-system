'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { caseService } from '@/services/CaseService';
import { outcomeService, OutcomeMeasure, OutcomeRecord } from '@/services/OutcomeService';
import { Case } from '@/types/case';
import { CaseHeader } from '@/features/case-management/components/CaseHeader';
import { CarePlanBuilder } from '@/features/case-management/components/CarePlanBuilder';
import { CaseTimeline } from '@/features/case-management/components/CaseTimeline';
import { CaseNotesFeed } from '@/features/clients/components/CaseNotesFeed';
import { ServiceLogger } from '@/features/case-management/components/ServiceLogger';
import { FollowUpScheduler } from '@/features/case-management/components/FollowUpScheduler';
import { OutcomeChart } from '@/features/case-management/components/OutcomeChart';
import { OutcomeLog } from '@/features/case-management/components/OutcomeLog';
import { MessageCenter } from '@/features/case-management/components/MessageCenter';
import { ProviderDirectory } from '@/features/case-management/components/ProviderDirectory'; // New Import
import { ReferralTracker } from '@/features/case-management/components/ReferralTracker'; // New Import
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { toast } from 'sonner';
import { FileText, ClipboardList, Activity, LayoutDashboard, Stethoscope, TrendingUp, MessageCircle, Users, Briefcase } from 'lucide-react';
import { ResumeList } from '@/components/resume/ResumeList';
import { GenerateResumeButton } from '@/components/resume/GenerateResumeButton';
import { AIOptimizationPanel } from '@/components/resume/AIOptimizationPanel';
import { CoverLetterGenerator } from '@/components/resume/CoverLetterGenerator';

export default function CaseDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [caseData, setCaseData] = useState<Case | null>(null);
    const [notes, setNotes] = useState<any[]>([]);
    const [outcomeMeasures, setOutcomeMeasures] = useState<OutcomeMeasure[]>([]);
    const [outcomeHistory, setOutcomeHistory] = useState<OutcomeRecord[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        loadData();
    }, [id, refreshTrigger]);

    const loadData = async () => {
        try {
            // 1. Get User
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);

            // 2. Get Case
            const c = await caseService.getCaseById(id);
            if (c) {
                setCaseData(c);

                // 3. Parallel Fetch: Notes & Outcomes
                const [notesRes, measuresRes, historyRes] = await Promise.all([
                    supabase
                        .from('case_notes')
                        .select('*, author:profiles(username)')
                        .eq('client_id', c.client_id)
                        .order('created_at', { ascending: false }),
                    outcomeService.getMeasures(),
                    outcomeService.getOutcomeHistory(id)
                ]);

                if (notesRes.error) throw notesRes.error;

                setNotes(notesRes.data || []);
                setOutcomeMeasures(measuresRes);
                setOutcomeHistory(historyRes);
            }
        } catch (error) {
            console.error('Failed to load case data:', error);
            toast.error('Failed to load case data');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    }

    if (loading) {
        return (
            <div className="container mx-auto px-6 py-8 space-y-6">
                <div className="h-48 bg-slate-100 animate-pulse rounded-xl" />
                <div className="h-96 bg-slate-100 animate-pulse rounded-xl" />
            </div>
        );
    }

    if (!caseData) return <div className="p-8 text-center">Case not found</div>;

    return (
        <div className="container mx-auto px-6 py-8 pb-32">
            <div className="mb-6">
                {/* Breadcrumb or Back Button could go here */}
            </div>

            <CaseHeader
                caseData={caseData}
                onCaseUpdated={(updated) => setCaseData(updated)}
            />

            <Tabs defaultValue="overview" className="mt-8">
                <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1 mb-6 flex flex-wrap h-auto gap-2">
                    <TabsTrigger value="overview" className="gap-2 px-4">
                        <LayoutDashboard className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="plan" className="gap-2 px-4">
                        <ClipboardList className="w-4 h-4" />
                        Care Plan
                    </TabsTrigger>
                    <TabsTrigger value="outcome" className="gap-2 px-4">
                        <TrendingUp className="w-4 h-4" />
                        Outcomes
                    </TabsTrigger>
                    <TabsTrigger value="services" className="gap-2 px-4">
                        <Stethoscope className="w-4 h-4" />
                        Services
                    </TabsTrigger>
                    <TabsTrigger value="network" className="gap-2 px-4">
                        <Users className="w-4 h-4" />
                        Network
                    </TabsTrigger>
                    <TabsTrigger value="communication" className="gap-2 px-4">
                        <MessageCircle className="w-4 h-4" />
                        Communication
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="gap-2 px-4">
                        <FileText className="w-4 h-4" />
                        Notes
                    </TabsTrigger>
                    <TabsTrigger value="employment" className="gap-2 px-4">
                        <Briefcase className="w-4 h-4" />
                        Employment
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Recent Activity
                                </h3>
                                {/* Force re-render of timeline on refresh to show new service logs */}
                                <CaseTimeline key={refreshTrigger} caseId={id} />
                            </div>
                        </div>
                        <div className="space-y-6">
                            {/* Sidebar widgets */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6">
                                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Quick Stats</h4>
                                <div className="text-sm text-blue-700 dark:text-blue-300">
                                    <p>Days Active: {Math.floor((Date.now() - new Date(caseData.start_date).getTime()) / (1000 * 60 * 60 * 24))}</p>
                                    <p>Stage: <span className="capitalize">{caseData.stage.replace('_', ' ')}</span></p>
                                </div>
                            </div>

                            {/* Mini Outcome Chart Widget */}
                            {outcomeHistory.length > 0 && (
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Latest Progress</h4>
                                    <p className="text-sm text-slate-500 mb-4">
                                        Last recorded: {new Date(outcomeHistory[outcomeHistory.length - 1].recorded_at).toLocaleDateString()}
                                    </p>
                                    {/* Simple visualization could go here */}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="plan">
                    <CarePlanBuilder caseId={id} />
                </TabsContent>

                <TabsContent value="outcome" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <OutcomeChart history={outcomeHistory} measures={outcomeMeasures} />
                        </div>
                        <div>
                            <OutcomeLog
                                measures={outcomeMeasures}
                                caseId={id}
                                onOutcomeLogged={handleRefresh}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ServiceLogger caseId={id} onServiceLogged={handleRefresh} />
                        <FollowUpScheduler caseId={id} onFollowUpScheduled={handleRefresh} />
                    </div>
                </TabsContent>

                <TabsContent value="network" className="space-y-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Active Referrals</h3>
                            <ReferralTracker key={refreshTrigger} caseId={id} />
                        </div>
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold mb-3">Provider Directory</h3>
                            <ProviderDirectory
                                caseId={id}
                                onRefer={handleRefresh}
                            />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="communication">
                    <MessageCenter
                        caseId={id}
                        clientId={caseData.client_id}
                        recipientContact={caseData.client?.email || undefined}
                    />
                </TabsContent>

                <TabsContent value="notes">
                    {userId && (
                        <CaseNotesFeed
                            notes={notes}
                            clientId={caseData.client_id}
                            currentUserId={userId}
                        />
                    )}
                </TabsContent>

                <TabsContent value="employment" className="space-y-6">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Briefcase className="w-6 h-6 text-blue-600" />
                                    Job Readiness & Resumes
                                </h3>
                                <GenerateResumeButton
                                    intakeId={caseData.intake_id}
                                    clientId={caseData.client_id}
                                    clientName={caseData.client?.full_name || 'Client'}
                                    onResumeGenerated={handleRefresh}
                                />
                            </div>

                            <ResumeList
                                clientId={caseData.client_id}
                                refreshTrigger={refreshTrigger}
                            />

                            <CoverLetterGenerator
                                clientId={caseData.client_id}
                                resume={{
                                    basics: {
                                        name: caseData.client?.full_name || caseData.client?.name || 'Client',
                                        email: caseData.client?.email || '',
                                        phone: caseData.client?.phone || '',
                                        summary: '', // AI will fill this or we can map from bio
                                    }
                                } as any}
                            />
                        </div>

                        <div className="space-y-6">
                            <AIOptimizationPanel
                                resume={{
                                    basics: {
                                        name: caseData.client?.full_name || caseData.client?.name || 'Client',
                                        summary: '',
                                    }
                                } as any}
                                onApplySuggestion={(field: string, value: string) => {
                                    toast.info(`AI Suggestion for ${field}: ${value.substring(0, 50)}...`, {
                                        description: "Auto-apply logic is being finalized."
                                    });
                                }}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
