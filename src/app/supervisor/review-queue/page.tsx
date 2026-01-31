'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import {
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    ShieldCheck,
    ExternalLink,
    Search,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface PendingReport {
    id: string;
    client_id: string;
    client_name: string;
    status: string;
    created_at: string;
    content_markdown?: string;
    report_version_id?: string;
}

export default function ReviewQueuePage() {
    const [reports, setReports] = useState<PendingReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        // Joining intakes with clients to get names
        const { data, error } = await supabase
            .from('intakes')
            .select(`
                id,
                client_id,
                status,
                created_at,
                clients (name)
            `)
            .eq('status', 'awaiting_review')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            const formatted = data.map((d: any) => ({
                id: d.id,
                client_id: d.client_id,
                client_name: d.clients?.name || 'Unknown',
                status: d.status,
                created_at: d.created_at
            }));
            setReports(formatted);
        }
        setLoading(false);
    };

    const handleApprove = async (reportId: string) => {
        const { error } = await supabase
            .from('intakes')
            .update({ status: 'approved' })
            .eq('id', reportId);

        if (!error) fetchReports();
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 pt-24 font-body selection:bg-primary/20">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Review Queue</h1>
                        </div>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs pl-1">Supervisory Oversight • State Compliance Queue</p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter by Client Name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm outline-none"
                        />
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-200 dark:bg-white/5 rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {reports.filter(r => r.client_name.toLowerCase().includes(searchTerm.toLowerCase())).map((report) => (
                                <motion.div
                                    key={report.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <GlassCard className="group relative overflow-hidden h-full flex flex-col p-8 border-slate-200 hover:border-primary transition-colors duration-500">
                                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="flex gap-1.5 leading-none">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Pending Review</span>
                                            </div>
                                        </div>

                                        <div className="mb-8 flex-1">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{report.client_name}</h3>
                                            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                <Clock className="w-3 h-3" />
                                                Submitted {new Date(report.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-100 dark:border-white/5">
                                            <Link href={`/reports/${report.client_id}`} className="contents">
                                                <ActionButton variant="secondary" size="sm" fullWidth icon={<ExternalLink className="w-4 h-4" />}>
                                                    Audit Draft
                                                </ActionButton>
                                            </Link>
                                            <ActionButton
                                                onClick={() => handleApprove(report.id)}
                                                size="sm"
                                                fullWidth
                                                className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white"
                                                icon={<CheckCircle className="w-4 h-4" />}
                                            >
                                                Finalize
                                            </ActionButton>
                                        </div>
                                    </GlassCard>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {reports.length === 0 && !loading && (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-30 italic">
                                <History className="w-16 h-16 mb-4" />
                                <p className="font-bold uppercase tracking-[0.2em] text-sm">Queue Clear • No Reports Awaiting Review</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
