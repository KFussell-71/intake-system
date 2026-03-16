'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';
import {
    ShieldCheck,
    FileText,
    Download,
    History,
    Search,
    ExternalLink,
    Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ApprovedReport {
    id: string;
    client_id: string;
    client_name: string;
    report_date: string;
    status: string;
    version_count: number;
}

export default function AuditorPortal() {
    const [reports, setReports] = useState<ApprovedReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAuditReports();
    }, []);

    const fetchAuditReports = async () => {
        setLoading(true);
        // In a real auditor portal, we would enforce the 'auditor' role check here or via Middleware
        const { data, error } = await supabase
            .from('intakes')
            .select(`
                id,
                client_id,
                report_date,
                status,
                clients (name)
            `)
            .eq('status', 'approved')
            .order('report_date', { ascending: false });

        if (!error) {
            const formatted = data.map((d: any) => ({
                id: d.id,
                client_id: d.client_id,
                client_name: d.clients?.name || 'Unknown',
                report_date: d.report_date,
                status: d.status,
                version_count: 1 // Simplified for now
            }));
            setReports(formatted);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0a0c10] p-8 pt-24 font-body selection:bg-slate-900/10">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 border-b-2 border-slate-900/5 dark:border-white/5 pb-12 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl">
                                <Lock className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">Auditor Portal</h1>
                                <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs mt-2">Independent Certification • Read-Only Artifacts</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-96">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Federal/State Artifacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-6 pr-12 py-5 bg-white dark:bg-white/5 border-2 border-slate-900/5 dark:border-white/5 rounded-3xl font-bold placeholder:text-slate-400 focus:border-slate-900 transition-all outline-none"
                            />
                            <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 gap-4">
                    {reports.filter(r => r.client_name.toLowerCase().includes(searchTerm.toLowerCase())).map((report) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between group hover:shadow-2xl hover:shadow-slate-900/5 transition-all duration-700">
                                <div className="flex items-center gap-6 mb-4 md:mb-0">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 flex items-center justify-center border-2 border-transparent group-hover:border-slate-900 group-hover:bg-white transition-all duration-700">
                                        <ShieldCheck className="w-8 h-8 text-slate-300 group-hover:text-slate-900 transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{report.client_name}</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full">State Certified</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                                <History className="w-3 h-3" />
                                                Finalized {new Date(report.report_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <ActionButton
                                        variant="secondary"
                                        size="lg"
                                        icon={<Download className="w-5 h-5" />}
                                        className="rounded-[2rem] border-slate-200"
                                    >
                                        Extract PDF
                                    </ActionButton>
                                    <Link href={`/reports/${report.client_id}`} className="contents">
                                        <ActionButton
                                            size="lg"
                                            icon={<ExternalLink className="w-5 h-5" />}
                                            className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-[2rem]"
                                        >
                                            View Audit Trail
                                        </ActionButton>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {reports.length === 0 && !loading && (
                        <div className="py-32 flex flex-col items-center justify-center text-slate-400">
                            <Lock className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-bold uppercase tracking-widest text-sm italic">No certified artifacts available for current audit cycle.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
