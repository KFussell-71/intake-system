'use client';

import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, AlertCircle, Wand2 } from 'lucide-react';
import { generateSummaryAction, optimizeForATSAction } from '@/app/actions/aiEmploymentActions';
import { OptimizationSuggestion } from '@/services/AIResumeOptimizerService';
import { JSONResume } from '@/services/ResumeMapperService';
import { GlassCard } from '@/components/ui/GlassCard';
import { toast } from 'sonner';

interface Props {
    resume: JSONResume;
    onApplySuggestion: (field: string, value: string) => void;
}

export function AIOptimizationPanel({ resume, onApplySuggestion }: Props) {
    const [loading, setLoading] = useState(false);
    const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
    const [generatedSummary, setGeneratedSummary] = useState('');
    const [targetJob, setTargetJob] = useState('');
    const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);

    const checkAIAvailability = async () => {
        // Simplified for client side - actual availability will be handled by server actions
        return true;
    };

    const handleGenerateSummary = async () => {
        setLoading(true);
        try {
            const result = await generateSummaryAction(
                resume,
                targetJob || undefined
            );

            if (result.success && result.summary) {
                setGeneratedSummary(result.summary);
                toast.success('Professional summary generated!');
            } else {
                throw new Error(result.error || 'Failed to generate summary');
            }
        } catch (error) {
            console.error('[AIOptimization] Error:', error);
            toast.error('Failed to generate summary', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApplySummary = () => {
        if (generatedSummary) {
            onApplySuggestion('basics.summary', generatedSummary);
            toast.success('Summary applied to resume');
        }
    };

    const handleOptimizeForATS = async () => {
        setLoading(true);
        try {
            const result = await optimizeForATSAction(resume);

            if (result.success && result.suggestions) {
                setSuggestions(result.suggestions);
                toast.success(`Found ${result.suggestions.length} ATS optimization suggestions`);
            } else {
                throw new Error(result.error || 'Failed to optimize for ATS');
            }
        } catch (error) {
            console.error('[AIOptimization] Error:', error);
            toast.error('Failed to optimize for ATS');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GlassCard className="p-6">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Resume Optimization
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Use AI to improve resume content and optimize for ATS systems
                    </p>
                </div>

                {/* AI Status */}
                {aiAvailable === false && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-yellow-900">AI Service Not Available</p>
                            <p className="text-yellow-700 mt-1">
                                Install Ollama and run: <code className="bg-yellow-100 px-1 rounded">ollama run llama3</code>
                            </p>
                        </div>
                    </div>
                )}

                {/* Target Job Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Target Job Title (Optional)
                    </label>
                    <input
                        type="text"
                        value={targetJob}
                        onChange={(e) => setTargetJob(e.target.value)}
                        placeholder="e.g., Software Engineer, Marketing Manager"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        Providing a target job helps tailor the optimization
                    </p>
                </div>

                {/* Generate Summary */}
                <div className="space-y-3">
                    <button
                        onClick={handleGenerateSummary}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                Generate Professional Summary
                            </>
                        )}
                    </button>

                    {generatedSummary && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium text-purple-900">Generated Summary</span>
                                <button
                                    onClick={handleApplySummary}
                                    className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Apply to Resume
                                </button>
                            </div>
                            <p className="text-sm text-purple-900 leading-relaxed">
                                {generatedSummary}
                            </p>
                        </div>
                    )}
                </div>

                {/* ATS Optimization */}
                <div className="space-y-3">
                    <button
                        onClick={handleOptimizeForATS}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Optimize for ATS
                            </>
                        )}
                    </button>

                    {/* Suggestions List */}
                    {suggestions.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">ATS Suggestions ({suggestions.length})</h4>
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-blue-600 uppercase">
                                                {suggestion.section}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {Math.round(suggestion.confidence * 100)}% confidence
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => onApplySuggestion(suggestion.field, suggestion.suggested)}
                                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    <div className="space-y-2 text-xs">
                                        <div>
                                            <span className="font-medium text-red-600">Original:</span>
                                            <p className="text-slate-600 mt-0.5">{suggestion.original}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-green-600">Suggested:</span>
                                            <p className="text-slate-900 mt-0.5">{suggestion.suggested}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-500">Reason:</span>
                                            <p className="text-slate-600 mt-0.5">{suggestion.reason}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Help Text */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <h4 className="text-xs font-medium text-blue-900 mb-1">💡 AI Optimization Tips</h4>
                    <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                        <li>Generate a professional summary tailored to your target role</li>
                        <li>Optimize for Applicant Tracking Systems (ATS)</li>
                        <li>Get keyword suggestions based on job descriptions</li>
                        <li>Improve job descriptions with action verbs and metrics</li>
                    </ul>
                </div>
            </div>
        </GlassCard>
    );
}
