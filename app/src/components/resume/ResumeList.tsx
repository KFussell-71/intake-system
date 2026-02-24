'use client';

import { useEffect, useState } from 'react';
import { resumeRepository, ClientResume } from '@/repositories/ResumeRepository';
import { reactiveResumeService } from '@/services/ReactiveResumeService';
import { FileText, Download, ExternalLink, Calendar, Trash2, Eye, Edit } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { toast } from 'sonner';

interface Props {
    clientId: string;
    refreshTrigger?: number;
}

export function ResumeList({ clientId, refreshTrigger }: Props) {
    const [resumes, setResumes] = useState<ClientResume[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{ total: number; active: number; lastGenerated?: string } | null>(null);

    useEffect(() => {
        loadResumes();
    }, [clientId, refreshTrigger]);

    const loadResumes = async () => {
        try {
            const [resumeData, statsData] = await Promise.all([
                resumeRepository.getResumesByClient(clientId),
                resumeRepository.getResumeStats(clientId),
            ]);
            setResumes(resumeData);
            setStats(statsData);
        } catch (error) {
            console.error('[ResumeList] Error loading resumes:', error);
            toast.error('Failed to load resumes');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadJSON = (resume: ClientResume) => {
        // Download the JSON resume
        const link = document.createElement('a');
        link.href = resume.resume_url;
        link.download = `resume-v${resume.version}.json`;
        link.click();

        toast.success('Resume downloaded');
    };

    const handleViewResume = (resume: ClientResume) => {
        // For now, just show the JSON in a new tab
        window.open(resume.resume_url, '_blank');
    };

    const handleDelete = async (resumeId: string) => {
        if (!confirm('Are you sure you want to delete this resume?')) {
            return;
        }

        try {
            await resumeRepository.deleteResume(resumeId);
            toast.success('Resume deleted');
            loadResumes();
        } catch (error) {
            console.error('[ResumeList] Error deleting resume:', error);
            toast.error('Failed to delete resume');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Header */}
            {stats && stats.total > 0 && (
                <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div>
                        <span className="font-medium">{stats.total}</span> resume{stats.total !== 1 ? 's' : ''} generated
                    </div>
                    {stats.lastGenerated && (
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last: {new Date(stats.lastGenerated).toLocaleDateString()}
                        </div>
                    )}
                </div>
            )}

            {/* Resume List */}
            {resumes.length === 0 ? (
                <GlassCard className="p-8 text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 mb-2">No resumes generated yet</p>
                    <p className="text-sm text-slate-400">
                        Click "Generate Resume" to create a professional resume from intake data
                    </p>
                </GlassCard>
            ) : (
                <div className="grid gap-3">
                    {resumes.map((resume) => (
                        <GlassCard
                            key={resume.id}
                            className={`p-4 transition-all hover:shadow-md ${resume.is_active ? 'ring-2 ring-primary/20' : 'opacity-75'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                                        <FileText className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">Resume v{resume.version}</span>
                                            {resume.is_active && (
                                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(resume.created_at).toLocaleString()}
                                        </div>
                                        {resume.metadata?.client_name && (
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {resume.metadata.client_name}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Edit in Reactive Resume (if from reactive-resume) */}
                                    {resume.metadata?.source === 'reactive-resume' && (
                                        <button
                                            onClick={() => window.open(reactiveResumeService.getEditorUrl(resume.resume_id), '_blank')}
                                            className="p-2 hover:bg-purple-100 rounded-lg transition-colors"
                                            title="Edit in Reactive Resume"
                                        >
                                            <Edit className="w-4 h-4 text-purple-600" />
                                        </button>
                                    )}

                                    {/* View Resume */}
                                    <button
                                        onClick={() => handleViewResume(resume)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="View Resume"
                                    >
                                        <Eye className="w-4 h-4 text-slate-600" />
                                    </button>

                                    {/* Download PDF (if available) */}
                                    {resume.pdf_url && (
                                        <a
                                            href={resume.pdf_url}
                                            download
                                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                            title="Download PDF"
                                        >
                                            <FileText className="w-4 h-4 text-blue-600" />
                                        </a>
                                    )}

                                    {/* Download JSON */}
                                    <button
                                        onClick={() => handleDownloadJSON(resume)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                        title="Download JSON"
                                    >
                                        <Download className="w-4 h-4 text-slate-600" />
                                    </button>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(resume.id)}
                                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Delete Resume"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                </div>
                            </div>

                            {/* Resume Format Badge */}
                            <div className="mt-3 flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded ${resume.metadata?.format === 'pdf'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {resume.metadata?.format === 'pdf' ? 'PDF Resume' : 'JSON Resume Format'}
                                </span>
                                {resume.metadata?.source === 'reactive-resume' && (
                                    <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded flex items-center gap-1">
                                        <ExternalLink className="w-3 h-3" />
                                        Reactive Resume
                                    </span>
                                )}
                                {resume.metadata?.format === 'json' && (
                                    <span className="text-xs text-slate-400">
                                        Compatible with rxresu.me, JSON Resume, and other builders
                                    </span>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Help Text */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-medium text-blue-900 mb-2">📄 About JSON Resumes</h4>
                <p className="text-xs text-blue-700">
                    Generated resumes use the{' '}
                    <a
                        href="https://jsonresume.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-900"
                    >
                        JSON Resume
                    </a>{' '}
                    standard format. You can import these into:
                </p>
                <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc space-y-1">
                    <li>
                        <a
                            href="https://rxresu.me"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-900"
                        >
                            Reactive Resume
                        </a>{' '}
                        (recommended)
                    </li>
                    <li>
                        <a
                            href="https://registry.jsonresume.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-blue-900"
                        >
                            JSON Resume Registry
                        </a>
                    </li>
                    <li>Any resume builder that supports JSON Resume format</li>
                </ul>
            </div>
        </div>
    );
}
