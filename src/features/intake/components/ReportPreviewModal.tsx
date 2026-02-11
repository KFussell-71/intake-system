'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, AlertTriangle, Loader2, Edit3, ArrowRight, Printer, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// Removed static import to prevent SSR issues with jsdom/html2canvas
// import { generatePDF } from '@/lib/pdf/generatePDF';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { any } from '../types/intake';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: any;
    onSubmit: () => void;
    onJumpToStep?: (stepIndex: number) => void;
}

// Map Markdown headers to Intake Form Steps
const SECTION_MAP: Record<string, number> = {
    'profile': 0, 'identity': 0, 'demographics': 0,
    'medical': 1, 'health': 1, 'psychiatric': 1, 'diagnosis': 1, 'medications': 1,
    'goals': 2, 'employment plan': 2, 'vocational': 2,
    'preparation': 3, 'readiness': 3, 'barriers': 3, 'education': 3,
    'placement': 4, 'job search': 4,
    'review': 5, 'summary': 5, 'assessment': 5
};

export function ReportPreviewModal({ open, onOpenChange, formData, onSubmit, onJumpToStep }: Props) {
    const [loading, setLoading] = useState(false);
    const [reportHtml, setReportHtml] = useState<string>('');
    const [reportMarkdown, setReportMarkdown] = useState<string>(''); // Store markdown for PDF generation
    const [error, setError] = useState<string | null>(null);
    const [detectedSections, setDetectedSections] = useState<{ title: string, step: number }[]>([]);

    useEffect(() => {
        if (open) {
            generatePreview();
        } else {
            // Reset state on close
            setReportHtml('');
            setReportMarkdown('');
            setError(null);
            setDetectedSections([]);
        }
    }, [open]);

    const generatePreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    previewData: formData
                })
            });

            const data = await response.json();

            if (!data.success) throw new Error(data.error || 'Failed to generate preview');

            const rawHtml = await marked.parse(data.markdown);
            const cleanHtml = DOMPurify.sanitize(rawHtml as string);
            setReportHtml(cleanHtml);
            setReportMarkdown(data.markdown); // Save for PDF generation

            // Extract Sections for Quick Nav
            extractSections(data.markdown);

        } catch (err: any) {
            console.error('Preview Error:', err);
            setError(err.message || 'Failed to generate report preview.');
        } finally {
            setLoading(false);
        }
    };

    const extractSections = (markdown: string) => {
        // Find headers roughly matching our map
        const headerRegex = /^#{1,3}\s+(.+)$/gm;
        let match;
        const found: { title: string, step: number }[] = [];
        const seenSteps = new Set<number>();

        while ((match = headerRegex.exec(markdown)) !== null) {
            const headerText = match[1].toLowerCase();

            // Checks keywords
            for (const [key, step] of Object.entries(SECTION_MAP)) {
                if (headerText.includes(key) && !seenSteps.has(step)) {
                    found.push({ title: match[1], step });
                    seenSteps.add(step);
                    break;
                }
            }
        }
        // Sort by step order
        found.sort((a, b) => a.step - b.step);
        setDetectedSections(found);
    };

    const handleJump = (step: number) => {
        if (onJumpToStep) {
            onJumpToStep(step);
        }
    };

    const handleDownloadPDF = async () => {
        if (!reportMarkdown) return;
        try {
            const { generatePDF } = await import('@/lib/pdf/generatePDF');
            const pdfBlob = await generatePDF(reportMarkdown);
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Draft_Report_${formData.clientName || 'Client'}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('PDF Error:', err);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const handlePrint = () => {
        // Create a hidden iframe to print just the report content
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups to print.');
            return;
        }
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Report</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        h1 { text-align: center; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 10px; }
                        h2 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; }
                        p { line-height: 1.6; margin-bottom: 15px; }
                        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(0,0,0,0.05); font-weight: bold; z-index: -1; }
                    </style>
                </head>
                <body>
                    <div class="watermark">DRAFT</div>
                    ${reportHtml}
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-6xl h-[90vh] flex flex-col p-0 gap-0 bg-surface dark:bg-surface-dark border-slate-200 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 bg-surface dark:bg-surface-dark z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                                Draft Report Preview
                            </DialogTitle>
                            <p className="text-xs text-slate-500 font-medium">
                                Review the AI-generated report before final submission. This is a draft.
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onOpenChange(false)}
                        className="text-slate-400 hover:text-primary"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex flex-1 overflow-hidden">

                    {/* Quick Nav Sidebar - Clinical SME Requirement (Fix #1) */}
                    <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hidden md:flex flex-col">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Quick Edit</h4>
                            <p className="text-[10px] text-slate-400 mt-1">Jump to section to make changes</p>
                        </div>
                        <div className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin">
                            {loading ? (
                                Array(4).fill(0).map((_, i) => (
                                    <div key={i} className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse my-2" />
                                ))
                            ) : detectedSections.length > 0 ? (
                                detectedSections.map((section, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleJump(section.step)}
                                        className="flex items-center w-full p-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-primary hover:shadow-sm rounded-md transition-all group"
                                    >
                                        <Edit3 className="w-3 h-3 mr-2 opacity-50 group-hover:opacity-100" />
                                        <span className="truncate flex-1">{section.title}</span>
                                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center p-4 text-xs text-slate-400 italic">
                                    No editable sections detected.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 relative overflow-y-auto p-8 scrollbar-thin">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                <p>Generating draft report...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-red-500">
                                <AlertTriangle className="w-12 h-12" />
                                <p className="font-bold">Error Generating Preview</p>
                                <p className="text-sm opacity-80">{error}</p>
                                <Button onClick={generatePreview} variant="outline">Try Again</Button>
                            </div>
                        ) : (
                            <div className="w-full prose prose-slate dark:prose-invert max-w-4xl mx-auto bg-white dark:bg-slate-900 p-12 rounded-xl shadow-sm border border-slate-200 dark:border-white/5 relative">
                                {/* Watermark */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] overflow-hidden select-none">
                                    <div className="transform -rotate-45 text-9xl font-black text-slate-900 dark:text-white whitespace-nowrap">
                                        DRAFT PREVIEW
                                    </div>
                                </div>

                                <div dangerouslySetInnerHTML={{ __html: reportHtml }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-white/10 bg-surface dark:bg-surface-dark z-10">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        <X className="w-4 h-4 mr-2" /> Close Preview
                    </Button>
                    <div className="flex gap-4">
                        <Button
                            onClick={onSubmit}
                            disabled={loading || !!error}
                            className="bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Submit & Finalize
                        </Button>
                    </div>
                </div>

                {/* Print/Download Toolbar - added in footer left side */}
                <div className="absolute bottom-4 left-6 z-20 flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrint} disabled={!reportHtml}>
                        <Printer className="w-4 h-4 mr-2" /> Print
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} disabled={!reportMarkdown}>
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
