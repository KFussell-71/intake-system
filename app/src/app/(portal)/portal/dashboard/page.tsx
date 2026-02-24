'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import {
    CheckCircle2,
    Target,
    Calendar,
    FileText,
    Upload,
    ArrowRight,
    LogOut,
    User as UserIcon,
    AlertCircle,
    Trophy
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ClientTimeline } from '@/features/portal/components/ClientTimeline';

export default function PortalDashboard() {
    const router = useRouter();
    const [client, setClient] = useState<any>(null);
    const [goals, setGoals] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const clientId = sessionStorage.getItem('portal_client_id');
        if (!clientId) {
            router.push('/portal/login');
            return;
        }

        const fetchData = async () => {
            const [clientRes, goalsRes, milestoneRes] = await Promise.all([
                supabase.from('clients').select('*').eq('id', clientId).single(),
                supabase.from('intakes').select('data').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1),
                supabase.from('tracking_milestones').select('*').eq('client_id', clientId)
            ]);

            if (clientRes.data) setClient(clientRes.data);
            if (goalsRes.data?.[0]) {
                const data = goalsRes.data[0].data as any;
                setGoals([
                    { title: 'Employment Goal', value: data.employmentGoals },
                    { title: 'Education Goal', value: data.educationGoals }
                ].filter(g => g.value));
            }
            if (milestoneRes.data) setMilestones(milestoneRes.data);

            setLoading(false);
        };

        fetchData();
    }, [router]);

    const handleLogout = () => {
        sessionStorage.clear();
        router.push('/portal/login');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !client) return;

        setUploading(true);
        try {
            const fileName = `${client.id}-${Date.now()}-${file.name}`;
            const filePath = `portal-uploads/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('client-documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Create Document Record
            const { error: docError } = await supabase.from('documents').insert({
                client_id: client.id,
                name: file.name,
                url: filePath,
                type: file.type,
                size: file.size
            });

            if (docError) throw docError;

            // 3. Create Notification for Staff
            await supabase.from('notifications').insert({
                client_id: client.id,
                staff_id: client.assigned_to,
                type: 'DOCUMENT_UPLOAD',
                message: `${client.name} uploaded a new document: ${file.name}`
            });

            alert('Document uploaded successfully! Your counselor has been notified.');
        } catch (error: any) {
            console.error('Upload Error:', error);
            alert('Failed to upload document: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
                <div className="animate-pulse text-primary font-bold text-xl">Loading your progress...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark py-12 px-6">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Welcome, {client?.name.split(' ')[0]}!</h1>
                        <p className="text-slate-500 font-medium">Your career readiness journey is in progress.</p>
                    </div>
                    <ActionButton variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut className="w-4 h-4" />}>
                        Logout
                    </ActionButton>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <GlassCard className="p-6 border-l-4 border-primary">
                        <div className="flex items-center gap-3 mb-2 text-primary">
                            <Target className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Current Goal</span>
                        </div>
                        <p className="text-lg font-bold truncate">{goals[0]?.value || 'Assessment Phase'}</p>
                    </GlassCard>

                    <GlassCard className="p-6 border-l-4 border-accent">
                        <div className="flex items-center gap-3 mb-2 text-accent">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Milestones Met</span>
                        </div>
                        <p className="text-3xl font-black">{milestones.length}</p>
                    </GlassCard>

                    <GlassCard className="p-6 border-l-4 border-success">
                        <div className="flex items-center gap-3 mb-2 text-success">
                            <Calendar className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">Start Date</span>
                        </div>
                        <p className="text-lg font-bold">{new Date(client?.created_at).toLocaleDateString()}</p>
                    </GlassCard>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Progress Section */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Planned Goals
                        </h3>
                        {goals.length > 0 ? (
                            goals.map((goal, i) => (
                                <GlassCard key={i} className="p-5 flex justify-between items-center group">
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">{goal.title}</p>
                                        <p className="font-bold">{goal.value}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                </GlassCard>
                            ))
                        ) : (
                            <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                                <p className="text-slate-400 text-sm">Goals will appear here once your service plan is finalized.</p>
                            </div>
                        )}

                        <h3 className="text-xl font-bold flex items-center gap-2 mt-8">
                            <Trophy className="w-5 h-5 text-accent" />
                            Success Journey
                        </h3>
                        <div className="py-6">
                            <ClientTimeline milestones={milestones} />
                        </div>
                    </div>

                    {/* Action Center */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-accent" />
                            Document Center
                        </h3>
                        <GlassCard className="p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-accent">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-lg mb-2">Upload Required Docs</h4>
                                <p className="text-xs text-slate-500 mb-6 px-4 leading-relaxed">
                                    Need to provide your ID, Resume, or Medical Consent? Upload them here to send them directly to your Case Manager.
                                </p>
                                <ActionButton
                                    variant="secondary"
                                    className="w-full border-accent text-accent"
                                    icon={<Upload className="w-4 h-4" />}
                                    isLoading={uploading}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    Select File to Upload
                                </ActionButton>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <p className="mt-4 text-[10px] text-slate-300 font-medium uppercase tracking-widest">Supports PDF, JPG, PNG</p>
                            </div>
                        </GlassCard>

                        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 mt-8">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-primary mb-1">Upcoming Follow-up</h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                        Your next check-in with the agency is scheduled for the week of <span className="font-bold">Monday, Feb 2nd</span>. Have your documents ready!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
