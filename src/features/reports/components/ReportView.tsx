'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { IntakeReportEditor } from './IntakeReportEditor';
import { DocumentList } from '@/components/documents/DocumentList';
import { FileUploadZone } from '@/components/documents/FileUploadZone';
import { FileText, FolderOpen, Mail, FileUser } from 'lucide-react';
import InviteToPortalButton from '@/features/clients/components/InviteToPortalButton';
import { GenerateResumeButton } from '@/components/resume/GenerateResumeButton';
import { ResumeList } from '@/components/resume/ResumeList';

interface ReportViewProps {
    clientId: string;
}

export function ReportView({ clientId }: ReportViewProps) {
    const [userId, setUserId] = useState<string | null>(null);
    const [clientData, setClientData] = useState<any>(null);
    const [portalAccess, setPortalAccess] = useState<any>(null);
    const [refreshDocs, setRefreshDocs] = useState(0);
    const [refreshResumes, setRefreshResumes] = useState(0);
    const [latestIntakeId, setLatestIntakeId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch User and Client Data
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
            }

            // Fetch client details
            const { data: client } = await supabase
                .from('clients')
                .select('name, email')
                .eq('id', clientId)
                .single();
            setClientData(client);

            // Fetch portal access status
            const { data: access } = await supabase
                .from('client_users')
                .select('is_active, expires_at')
                .eq('client_id', clientId)
                .single();
            setPortalAccess(access);

            // Fetch latest intake ID for resume generation
            const { data: latestIntake } = await supabase
                .from('intakes')
                .select('id')
                .eq('client_id', clientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            setLatestIntakeId(latestIntake?.id || null);
        };

        fetchData();
    }, [clientId]);

    // Function to force refresh document list after upload
    const handleUploadComplete = () => {
        setRefreshDocs(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            <Tabs defaultValue="report" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight mb-1 dark:text-white">
                            {clientData?.name || 'Client'} - Case File
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage intake reporting and supporting documentation</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {clientData && (
                            <InviteToPortalButton
                                clientId={clientId}
                                clientName={clientData.name}
                                clientEmail={clientData.email}
                                hasActiveAccess={portalAccess?.is_active}
                                expiresAt={portalAccess?.expires_at}
                            />
                        )}
                        <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1">
                            <TabsTrigger value="report" className="gap-2 px-4">
                                <FileText className="w-4 h-4" />
                                Intake Report
                            </TabsTrigger>
                            <TabsTrigger value="documents" className="gap-2 px-4">
                                <FolderOpen className="w-4 h-4" />
                                Documents
                            </TabsTrigger>
                            <TabsTrigger value="resume" className="gap-2 px-4">
                                <FileUser className="w-4 h-4" />
                                Resume
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="report" className="mt-0">
                    <IntakeReportEditor clientId={clientId} />
                </TabsContent>

                <TabsContent value="documents" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Upload */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                                <h3 className="font-semibold text-lg mb-4 dark:text-white">Upload Document</h3>
                                {userId ? (
                                    <FileUploadZone
                                        clientId={clientId}
                                        userId={userId}
                                        onUploadComplete={handleUploadComplete}
                                    />
                                ) : (
                                    <div className="text-sm text-slate-500">Loading user context...</div>
                                )}
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900/20">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Documentation Guidelines</h4>
                                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-2 list-disc list-inside">
                                    <li>Upload signed ISP agreements</li>
                                    <li>Include state identification copies</li>
                                    <li>Attach resumes and certifications</li>
                                    <li>Ensure all files are PDF, PNG, or JPG</li>
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: List */}
                        <div className="lg:col-span-2">
                            <DocumentList clientId={clientId} refreshTrigger={refreshDocs} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="resume" className="mt-0 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-semibold text-lg dark:text-white">Client Resume</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Generate professional resumes from intake data
                                </p>
                            </div>
                            {latestIntakeId && clientData && (
                                <GenerateResumeButton
                                    intakeId={latestIntakeId}
                                    clientId={clientId}
                                    clientName={clientData.name}
                                    onResumeGenerated={() => setRefreshResumes(prev => prev + 1)}
                                />
                            )}
                        </div>
                        <ResumeList clientId={clientId} refreshTrigger={refreshResumes} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
