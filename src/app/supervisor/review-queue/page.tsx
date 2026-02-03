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
    History,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ReturnForRevisionDialog } from '@/features/supervisor/components/ReturnForRevisionDialog';
import { BulkActionsToolbar } from '@/features/supervisor/components/BulkActionsToolbar';
import { approveReport } from '@/lib/supervisor/supervisorActions';

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
    const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);

    // Return for Revision Dialog State
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [selectedReportForReturn, setSelectedReportForReturn] = useState<PendingReport | null>(null);

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
        const result = await approveReport(reportId, 'Report approved from review queue');
        if (result.success) {
            fetchReports();
        }
    };

    const handleReturnClick = (report: PendingReport) => {
        setSelectedReportForReturn(report);
        setReturnDialogOpen(true);
    };

    const handleReturnComplete = () => {
        fetchReports();
        setSelectedReports(new Set());
    };

    // Bulk Actions
    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            const allIds = filteredReports.map(r => r.id);
            setSelectedReports(new Set(allIds));
        } else {
            setSelectedReports(new Set());
        }
    };

    const handleSelectReport = (reportId: string, selected: boolean) => {
        const newSelected = new Set(selectedReports);
        if (selected) {
            newSelected.add(reportId);
        } else {
            newSelected.delete(reportId);
        }
        setSelectedReports(newSelected);
    };

    const handleBulkApprove = async () => {
        if (selectedReports.size === 0) return;

        setBulkProcessing(true);
        try {
            const response = await fetch('/api/supervisor/bulk-approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intakeIds: Array.from(selectedReports)
                })
            });

            if (response.ok) {
                await fetchReports();
                setSelectedReports(new Set());
            }
        } catch (error) {
            console.error('Bulk approve error:', error);
        } finally {
            setBulkProcessing(false);
        }
    };

    const handleBulkExport = () => {
        // Create CSV export of selected reports
        const selectedData = reports.filter(r => selectedReports.has(r.id));
        const csv = [
            ['Client Name', 'Status', 'Submitted Date', 'Report ID'].join(','),
            ...selectedData.map(r => [
                r.client_name,
                r.status,
                new Date(r.created_at).toLocaleDateString(),
                r.id
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `review-queue-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const filteredReports = reports.filter(r =>
        r.client_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const allSelected = filteredReports.length > 0 &&
        filteredReports.every(r => selectedReports.has(r.id));

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-body selection:bg-primary/20">
            {/* Bulk Actions Toolbar */}
            {reports.length > 0 && (
                <BulkActionsToolbar
                    selectedCount={selectedReports.size}
                    totalCount={filteredReports.length}
                    allSelected={allSelected}
                    onSelectAll={handleSelectAll}
                    onBulkApprove={handleBulkApprove}
                    onBulkExport={handleBulkExport}
                    isProcessing={bulkProcessing}
                />
            )}

            <div className="p-8 pt-24">
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
                                {filteredReports.map((report) => (
                                    <motion.div
                                        key={report.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                    >
                                        <GlassCard className="group relative overflow-hidden h-full flex flex-col p-8 border-slate-200 hover:border-primary transition-colors duration-500">
                                            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

                                            {/* Selection Checkbox */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReports.has(report.id)}
                                                    onChange={(e) => handleSelectReport(report.id, e.target.checked)}
                                                    className="w-5 h-5 text-primary focus:ring-primary rounded border-slate-300 cursor-pointer"
                                                />
                                            </div>

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
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    icon={<CheckCircle className="w-4 h-4" />}
                                                >
                                                    Approve
                                                </ActionButton>
                                            </div>

                                            {/* Return Button */}
                                            <div className="mt-3">
                                                <ActionButton
                                                    onClick={() => handleReturnClick(report)}
                                                    size="sm"
                                                    fullWidth
                                                    className="border-orange-300 text-orange-600 hover:bg-orange-50"
                                                    icon={<XCircle className="w-4 h-4" />}
                                                >
                                                    Return for Revision
                                                </ActionButton>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {filteredReports.length === 0 && !loading && (
                                <div className="col-span-full py-24 flex flex-col items-center justify-center opacity-30 italic">
                                    <History className="w-16 h-16 mb-4" />
                                    <p className="font-bold uppercase tracking-[0.2em] text-sm">
                                        {searchTerm ? 'No Matching Reports' : 'Queue Clear • No Reports Awaiting Review'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Return for Revision Dialog */}
            {selectedReportForReturn && (
                <ReturnForRevisionDialog
                    open={returnDialogOpen}
                    onClose={() => {
                        setReturnDialogOpen(false);
                        setSelectedReportForReturn(null);
                    }}
                    intakeId={selectedReportForReturn.id}
                    clientName={selectedReportForReturn.client_name}
                    onReturnComplete={handleReturnComplete}
                />
            )}
        </div>
    );
}
