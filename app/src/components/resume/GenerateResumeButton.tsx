'use client';

import { useState } from 'react';
import { FileText, Loader2, Download, CheckCircle, ExternalLink } from 'lucide-react';
import { resumeMapperService } from '@/services/ResumeMapperService';
import { resumeRepository } from '@/repositories/ResumeRepository';
import { reactiveResumeService } from '@/services/ReactiveResumeService';
import { toast } from 'sonner';

interface Props {
    intakeId: string;
    clientId: string;
    clientName: string;
    onResumeGenerated?: () => void;
}

export function GenerateResumeButton({ intakeId, clientId, clientName, onResumeGenerated }: Props) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setSuccess(false);

        try {
            // 1. Generate JSON Resume from intake data
            console.log('[GenerateResume] Generating resume for intake:', intakeId);
            const jsonResume = await resumeMapperService.generateResumeFromIntake(intakeId);

            // 2. Validate the resume
            const validation = resumeMapperService.validateResume(jsonResume);
            if (!validation.valid) {
                console.error('[GenerateResume] Validation errors:', validation.errors);
                toast.error(`Resume validation failed: ${validation.errors.join(', ')}`);
                setLoading(false);
                return;
            }

            // 3. Check if Reactive Resume is available
            const isReactiveResumeAvailable = await reactiveResumeService.isAvailable();

            let resumeId: string;
            let resumeUrl: string;
            let pdfUrl: string | undefined;

            if (isReactiveResumeAvailable) {
                // Use Reactive Resume API
                console.log('[GenerateResume] Creating resume in Reactive Resume');
                const reactiveResume = await reactiveResumeService.createResume(
                    jsonResume,
                    clientId,
                    `${clientName} - Resume`
                );

                resumeId = reactiveResume.id;
                resumeUrl = reactiveResume.url;

                // Export to PDF
                console.log('[GenerateResume] Exporting to PDF');
                const pdfBlob = await reactiveResumeService.exportToPDF(reactiveResume.id);

                // Create download URL for PDF
                pdfUrl = URL.createObjectURL(pdfBlob);

                // Download the PDF
                const downloadLink = document.createElement('a');
                downloadLink.href = pdfUrl;
                downloadLink.download = `${clientName.replace(/\s+/g, '_')}_Resume.pdf`;
                downloadLink.click();

                toast.success('Resume created successfully!', {
                    description: 'PDF downloaded. Click "View in Editor" to customize.',
                    action: {
                        label: 'View in Editor',
                        onClick: () => window.open(reactiveResumeService.getEditorUrl(reactiveResume.id), '_blank'),
                    },
                });
            } else {
                // Fallback to JSON download
                console.log('[GenerateResume] Reactive Resume not available, using JSON fallback');
                const resumeJson = resumeMapperService.exportToJSON(jsonResume);
                resumeId = `resume-${clientId}-${Date.now()}`;

                // Create a data URL for the JSON resume
                const blob = new Blob([resumeJson], { type: 'application/json' });
                resumeUrl = URL.createObjectURL(blob);

                // Download the JSON resume
                const downloadLink = document.createElement('a');
                downloadLink.href = resumeUrl;
                downloadLink.download = `${clientName.replace(/\s+/g, '_')}_Resume.json`;
                downloadLink.click();

                toast.success('Resume generated successfully!', {
                    description: 'JSON resume downloaded. Import into rxresu.me for PDF export.',
                });
            }

            // 4. Save to database
            console.log('[GenerateResume] Saving resume to database');
            await resumeRepository.createResume({
                client_id: clientId,
                intake_id: intakeId,
                resume_id: resumeId,
                resume_url: resumeUrl,
                pdf_url: pdfUrl,
                metadata: {
                    generated_at: new Date().toISOString(),
                    client_name: clientName,
                    format: isReactiveResumeAvailable ? 'pdf' : 'json',
                    source: isReactiveResumeAvailable ? 'reactive-resume' : 'json-export',
                },
            });

            setSuccess(true);

            // Callback to refresh resume list
            if (onResumeGenerated) {
                onResumeGenerated();
            }

            // Reset success state after 3 seconds
            setTimeout(() => setSuccess(false), 3000);

        } catch (error) {
            console.error('[GenerateResume] Error:', error);
            toast.error('Failed to generate resume', {
                description: error instanceof Error ? error.message : 'Unknown error occurred',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${success
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl text-white disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Resume...
                </>
            ) : success ? (
                <>
                    <CheckCircle className="w-4 h-4" />
                    Resume Generated!
                </>
            ) : (
                <>
                    <FileText className="w-4 h-4" />
                    Generate Resume
                </>
            )}
        </button>
    );
}
