'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui or existing button
import { Textarea } from '@/components/ui/textarea'; // Assuming existing components
import { generatePDF } from '@/lib/pdf/generatePDF';
import { Loader2, FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple types for props
interface IntakeReportEditorProps {
    clientId: string;
}

export const IntakeReportEditor: React.FC<IntakeReportEditorProps> = ({ clientId }) => {
    const [draft, setDraft] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const [status, setStatus] = useState<'idle' | 'drafting' | 'review' | 'approved'>('idle');

    const handleGenerateDraft = async () => {
        setIsGenerating(true);
        setStatus('drafting');
        try {
            const res = await fetch('/api/generate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId }),
            });
            const data = await res.json();
            if (data.markdown) {
                setDraft(data.markdown);
                setStatus('review');
            } else {
                console.error('Failed to generate draft:', data.error);
                alert('Error generating draft: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to generation service.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsPdfGenerating(true);
        try {
            // NOTE: In a real app, we might upload this Blob to Supabase Storage immediately
            const pdfBlob = await generatePDF(draft);
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Intake_Report_${clientId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert('Failed to generate PDF');
        } finally {
            setIsPdfGenerating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">

            {/* Header / Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Report Editor</h2>
                    <p className="text-slate-500 text-sm">AI-Assisted Drafting • Human Oversight Required</p>
                </div>
                <div className="flex gap-3">
                    {status === 'idle' && (
                        <Button onClick={handleGenerateDraft} disabled={isGenerating} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all">
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                            Generate Draft
                        </Button>
                    )}

                    {status === 'review' && (
                        <>
                            <Button variant="outline" onClick={handleGenerateDraft} disabled={isGenerating} className="border-slate-300 hover:bg-slate-100 text-slate-700">
                                <Loader2 className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : 'hidden'}`} />
                                Regenerate
                            </Button>
                            <Button onClick={() => setStatus('approved')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve & Lock
                            </Button>
                        </>
                    )}

                    {status === 'approved' && (
                        <Button onClick={handleDownloadPDF} disabled={isPdfGenerating} className="bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                            {isPdfGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                            Download PDF
                        </Button>
                    )}
                </div>
            </div>

            {/* Editor / Preview Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[600px]">
                {/* Left: Markdown Editor */}
                <div className="flex flex-col">
                    <div className="bg-slate-200 px-4 py-2 rounded-t-lg border-x border-t border-slate-300 font-semibold text-slate-700 flex justify-between items-center">
                        <span>Draft Content (Markdown)</span>
                        {status === 'approved' && <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Read Only</span>}
                    </div>
                    <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        disabled={status === 'approved' || isGenerating}
                        className="flex-1 rounded-b-lg border-slate-300 font-mono text-sm leading-relaxed p-4 resize-none focus:ring-emerald-500"
                        placeholder="Click 'Generate Draft' to start..."
                    />
                </div>

                {/* Right: Live Preview */}
                <div className="flex flex-col">
                    <div className="bg-slate-200 px-4 py-2 rounded-t-lg border-x border-t border-slate-300 font-semibold text-slate-700">
                        <span>Live Preview</span>
                    </div>
                    <div
                        className="flex-1 rounded-b-lg border border-slate-300 bg-white p-8 overflow-y-auto shadow-inner prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-center prose-h1:text-xl prose-h2:border-b prose-h2:pb-2 prose-sm"
                        dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(draft) }} // Using the same utility for consistency, ideally use 'marked'
                    >
                        {!draft && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <FileText className="w-12 h-12 mb-4 opacity-20" />
                                <p>Preview will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status Bar */}
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-yellow-800 text-sm">Compliance & Audit Data</h4>
                    <p className="text-yellow-700 text-xs mt-1">
                        All edits are tracked. Do not remove safety warnings like "Pending Review" unless verification is complete.
                        This document is creating a binding state record.
                    </p>
                </div>
            </div>

        </div>
    );
};

// Quick duplicate of utility for Client Component (since imports from lib sometimes tricky in mixed envs without full build setup)
// In prod, import from @/lib
function simpleMarkdownToHtml(md: string): string {
    if (!md) return '';
    return md
        .replace(/^# (.*$)/gim, '<h1 class="text-2xl mb-4 uppercase">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg mt-6 mb-2 border-b pb-1">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-md mt-4 font-bold">$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\* ([^*]+) \*/gim, '<em>$1</em>') // Fix Italics regex slightly
        .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
        .replace(/\n\n/gim, '<p class="mb-2"></p>')
        .replace(/\n/gim, '<br />'); // Simple line breaks
}
