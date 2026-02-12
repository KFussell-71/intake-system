'use client';

import { useState } from 'react';
import { FileText, Loader2, Download, Copy, Trash } from 'lucide-react';
import { coverLetterService } from '@/services/CoverLetterService';
import { JSONResume } from '@/services/ResumeMapperService';
import { GlassCard } from '@/components/ui/GlassCard';
import { toast } from 'sonner';

interface Props {
    resume: JSONResume;
    clientId: string;
}

export function CoverLetterGenerator({ resume, clientId }: Props) {
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [position, setPosition] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('professional');

    const templates = coverLetterService.getTemplates();

    const handleGenerate = async () => {
        if (!companyName || !position) {
            toast.error('Please enter company name and position');
            return;
        }

        setLoading(true);
        try {
            const letter = await coverLetterService.generateCoverLetter(
                resume,
                companyName,
                position,
                jobDescription || undefined
            );
            setGeneratedLetter(letter);
            toast.success('Cover letter generated!');
        } catch (error) {
            console.error('[CoverLetter] Error:', error);
            toast.error('Failed to generate cover letter', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadText = () => {
        if (!generatedLetter) return;

        const blob = new Blob([generatedLetter], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${companyName.replace(/\s+/g, '_')}_CoverLetter.txt`;
        a.click();
        toast.success('Cover letter downloaded');
    };

    const handleCopyToClipboard = () => {
        if (!generatedLetter) return;

        navigator.clipboard.writeText(generatedLetter);
        toast.success('Copied to clipboard');
    };

    return (
        <GlassCard className="p-6">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Cover Letter Generator
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Generate professional cover letters tailored to specific jobs
                    </p>
                </div>

                {/* Template Selection */}
                <div>
                    <label className="block text-sm font-medium mb-2">Template</label>
                    <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.name} - {template.description}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Company Name */}
                <div>
                    <label className="block text-sm font-medium mb-2">Company Name *</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g., Google, Microsoft"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Position */}
                <div>
                    <label className="block text-sm font-medium mb-2">Position *</label>
                    <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g., Software Engineer, Marketing Manager"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Job Description */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Job Description (Optional)
                    </label>
                    <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here for a more tailored cover letter..."
                        rows={4}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !companyName || !position}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Generating Cover Letter...
                        </>
                    ) : (
                        <>
                            <FileText className="w-5 h-5" />
                            Generate Cover Letter
                        </>
                    )}
                </button>

                {/* Generated Letter Preview */}
                {generatedLetter && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Generated Cover Letter</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleCopyToClipboard}
                                    className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm"
                                    title="Copy to clipboard"
                                >
                                    <Copy className="w-4 h-4" />
                                    Copy
                                </button>
                                <button
                                    onClick={handleDownloadText}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-white border border-slate-200 rounded-lg">
                            <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                                {generatedLetter}
                            </pre>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setGeneratedLetter('')}
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm flex items-center justify-center gap-2"
                            >
                                <Trash className="w-4 h-4" />
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Help Text */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="text-xs font-medium text-blue-900 mb-1">💡 Cover Letter Tips</h4>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                        <li>Provide a job description for better tailoring</li>
                        <li>Review and customize the generated letter</li>
                        <li>Highlight specific achievements from your resume</li>
                        <li>Keep it concise (under 400 words)</li>
                    </ul>
                </div>
            </div>
        </GlassCard>
    );
}
