'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button'; // Assuming shadcn/ui or existing button
import { Textarea } from '@/components/ui/textarea'; // Assuming existing components
import { generatePDF } from '@/lib/pdf/generatePDF';
import { Loader2, FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'isomorphic-dompurify';

/**
 * SECURITY: HTML Sanitization Configuration
 * 
 * This configuration allows safe HTML elements for report rendering
 * while blocking dangerous elements like <script>, <iframe>, event handlers, etc.
 */
const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'strong', 'em', 'u', 's', 'code', 'pre',
        'blockquote', 'div', 'span'
    ],
    ALLOWED_ATTR: ['class', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
};

// Simple types for props
interface IntakeReportEditorProps {
    clientId: string;
}

export const IntakeReportEditor: React.FC<IntakeReportEditorProps> = ({ clientId }) => {
    const [draft, setDraft] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const [status, setStatus] = useState<'idle' | 'drafting' | 'review' | 'approved'>('idle');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    const handleGenerateDraft = async () => {
        setIsGenerating(true);
        setStatus('drafting');
        try {
            // Import the server action dynamically
            const { generateEmploymentReport } = await import('@/app/actions/generateEmploymentReport');
            const result = await generateEmploymentReport(clientId);

            if (result.status === 'blocked') {
                const missing = result.issues?.join(', ') || 'Unknown fields';
                alert(`Compliance Gate Failure: The record is not state-auditable. Missing: ${missing}`);
                setStatus('idle');
                return;
            }

            if (result.status === 'generated' && result.markdown) {
                setDraft(result.markdown);
                setPdfUrl(result.pdfUrl || null);
                setStatus('review');
            } else {
                alert('An unexpected error occurred during generation.');
                setStatus('idle');
            }
        } catch (err) {
            console.error(err);
            alert('Service error: Ensure all required fields are populated in the client record.');
            setStatus('idle');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (pdfUrl) {
            window.open(pdfUrl, '_blank');
            return;
        }
        setIsPdfGenerating(true);
        try {
            // NOTE: Fallback to client-side generation for drafts without stored artifacts
            const pdfBlob = await generatePDF(draft);
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Draft_Report_${clientId}.pdf`;
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
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden font-body animate-in fade-in zoom-in duration-500">
            {/* Background Decorative Elements */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Toolbar */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">DOR State Report Engine</h2>
                    </div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest pl-4">Precision Drafting • Fidelity Compliant</p>
                </div>

                <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 mr-4 overflow-hidden">
                        <div className="flex flex-col">
                            <span className="text-[8px] uppercase font-bold text-slate-400">Current Phase</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{status}</span>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {status === 'idle' && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <Button onClick={handleGenerateDraft} disabled={isGenerating} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 rounded-2xl px-6 py-6 h-auto">
                                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FileText className="w-5 h-5 mr-2" />}
                                    <span className="font-bold">Initialize AI Draft</span>
                                </Button>
                            </motion.div>
                        )}

                        {status === 'review' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex gap-2">
                                <Button variant="ghost" onClick={handleGenerateDraft} disabled={isGenerating} className="rounded-2xl h-auto py-3">
                                    <Loader2 className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : 'hidden'}`} />
                                    Regenerate
                                </Button>
                                <Button onClick={() => setStatus('approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200/50 rounded-2xl px-6 items-center flex h-auto py-3">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    <span className="font-bold">Final Approval</span>
                                </Button>
                            </motion.div>
                        )}

                        {status === 'approved' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                                <Button onClick={handleDownloadPDF} disabled={isPdfGenerating} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white shadow-2xl rounded-2xl px-8 h-auto py-4">
                                    {isPdfGenerating ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                                    <span className="font-bold tracking-tight">Generate Official PDF</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Editor / Preview Area */}
            <div className="relative z-10 flex flex-1 overflow-hidden">
                {/* Left: Glass Sidebar Editor */}
                <div className={`transition-all duration-500 ease-in-out ${status === 'approved' ? 'w-0 opacity-0' : 'w-1/2 border-r border-slate-100 dark:border-white/5'} flex flex-col bg-slate-50/30 dark:bg-slate-900/10 backdrop-blur-sm`}>
                    <div className="px-6 py-4 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/40 dark:border-white/5">
                        <span>Markdown Source</span>
                        <div className="flex gap-1.5 leading-none">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                        </div>
                    </div>
                    <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        disabled={status === 'approved' || isGenerating}
                        className="flex-1 bg-transparent border-none font-mono text-sm leading-relaxed p-8 resize-none focus:ring-0 text-slate-700 dark:text-slate-300"
                        placeholder="Waiting for AI kernel to initialize..."
                    />
                </div>

                {/* Right: Live Preview */}
                <div className={`flex flex-col flex-1 bg-slate-100/50 dark:bg-black/20 ${status === 'approved' ? 'p-12' : 'p-0'}`}>
                    <div className={`px-6 py-4 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md ${status === 'approved' ? 'hidden' : ''}`}>
                        <span>State Document Preview</span>
                        {isGenerating && <span className="text-primary animate-pulse italic">Thinking...</span>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-12 flex justify-center scrollbar-hide">
                        <div className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-2xl p-16 relative overflow-hidden animate-in zoom-in-95 duration-700 selection:bg-primary/20 selection:text-primary">
                            {/* Paper Texture Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

                            {draft ? (
                                <div
                                    className="relative z-10 dor-paper-preview prose prose-slate max-w-none text-slate-900"
                                    style={{ fontFamily: "'EB Garamond', serif" }}
                                    // SECURITY: Sanitize HTML to prevent XSS from AI-generated or user-injected content
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(
                                            simpleMarkdownToHtml(draft),
                                            SANITIZE_CONFIG
                                        )
                                    }}
                                />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center mb-6">
                                        <FileText className="w-10 h-10" />
                                    </div>
                                    <p className="font-bold uppercase tracking-widest text-[10px]">Awaiting Data Stream</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Compliance Message Bubble */}
            <div className="absolute bottom-6 right-6 z-50">
                <motion.div
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-200 flex items-center gap-4 max-w-md"
                >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center overflow-hidden">
                        <div className="w-4 h-4 bg-primary rounded-full animate-ping" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">System Notification</p>
                        <p className="text-xs font-medium">Drafting requires 100% human verification for DOR compliance.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

// Quick duplicate of utility for Client Component (since imports from lib sometimes tricky in mixed envs without full build setup)
// In prod, import from @/lib
function simpleMarkdownToHtml(md: string): string {
    if (!md) return '';
    return md
        .replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-center uppercase mb-6 tracking-tight border-b-2 border-slate-900 pb-2">$1</h1>')
        .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold border-b border-slate-900 pb-1 mt-10 mb-6 uppercase tracking-wide bg-slate-50 px-2">$1</h2>')
        .replace(/^### (.*$)/gim, '<h3 class="text-md font-bold mt-6 px-2">$1</h3>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\* ([^*]+) \*/gim, '<em>$1</em>')
        .replace(/^- (.*$)/gim, '<li class="ml-6 list-disc mb-2">$1</li>')
        .replace(/<li.*\/li>/gim, (match) => `<ul class="my-6 border-l-2 border-slate-100 ml-4 pb-1">${match}</ul>`)
        .replace(/<\/ul><ul class="my-6 border-l-2 border-slate-100 ml-4 pb-1">/gim, '')
        .replace(/\n\n/gim, '<p class="mb-6 px-2 leading-relaxed"></p>')
        .replace(/\n/gim, '<br />')
        .replace(/---/gim, '<hr class="my-10 border-slate-200" />')
        .concat(`
            <div class="mt-24 pt-12 border-t border-slate-900 grid grid-cols-2 gap-12 px-2">
                <div>
                    <div class="h-px bg-slate-900 w-full mb-3"></div>
                    <p class="text-[9pt] font-bold uppercase tracking-tight">Participant Signature</p>
                </div>
                <div>
                    <div class="h-px bg-slate-900 w-full mb-3"></div>
                    <p class="text-[9pt] font-bold uppercase tracking-tight">Date</p>
                </div>
                <div class="mt-12">
                    <div class="h-px bg-slate-900 w-full mb-3"></div>
                    <p class="text-[9pt] font-bold uppercase tracking-tight">Employment Specialist Signature</p>
                </div>
                <div class="mt-12">
                    <div class="h-px bg-slate-900 w-full mb-3"></div>
                    <p class="text-[9pt] font-bold uppercase tracking-tight">Date</p>
                </div>
            </div>
        `);
}
