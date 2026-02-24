'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Wand2, X } from 'lucide-react';
import { analyzeError, attemptAutoFix, HealingSuggestion } from '@/lib/agents/selfHealingAgent';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    healingSuggestion: HealingSuggestion | null;
    isAnalyzing: boolean;
    isFixing: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            healingSuggestion: null,
            isAnalyzing: false,
            isFixing: false
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({ errorInfo, isAnalyzing: true });

        // Trigger AI analysis
        analyzeError(error, errorInfo.componentStack || undefined)
            .then(suggestion => {
                this.setState({
                    healingSuggestion: suggestion,
                    isAnalyzing: false
                });
            })
            .catch(() => {
                this.setState({
                    isAnalyzing: false,
                    healingSuggestion: {
                        canAutoFix: true,
                        suggestion: 'An error occurred. Refreshing might help.',
                        fixAction: 'refresh',
                        severity: 'medium'
                    }
                });
            });
    }

    handleAutoFix = async () => {
        const { healingSuggestion } = this.state;
        if (!healingSuggestion?.fixAction) return;

        this.setState({ isFixing: true });
        await attemptAutoFix(healingSuggestion.fixAction);
    };

    handleDismiss = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            healingSuggestion: null
        });
    };

    render() {
        const { hasError, error, healingSuggestion, isAnalyzing, isFixing } = this.state;
        const { children, fallback } = this.props;

        if (hasError) {
            if (fallback) return fallback;

            const severityColors = {
                low: 'border-blue-500 bg-blue-500/10',
                medium: 'border-yellow-500 bg-yellow-500/10',
                high: 'border-orange-500 bg-orange-500/10',
                critical: 'border-red-500 bg-red-500/10'
            };

            const severity = healingSuggestion?.severity || 'medium';

            return (
                <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark p-6">
                    <div className={`max-w-lg w-full p-8 rounded-3xl border-2 ${severityColors[severity]} backdrop-blur-xl`}>
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Something Went Wrong
                                    </h2>
                                    <p className="text-sm text-slate-500 capitalize">
                                        {severity} Severity
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={this.handleDismiss}
                                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex items-center gap-3 py-4">
                                <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                                <span className="text-slate-600 dark:text-slate-300">
                                    AI is analyzing the issue...
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-slate-700 dark:text-slate-200">
                                    {healingSuggestion?.suggestion || error?.message}
                                </p>

                                <div className="flex gap-3">
                                    {healingSuggestion?.canAutoFix && (
                                        <button
                                            onClick={this.handleAutoFix}
                                            disabled={isFixing}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {isFixing ? (
                                                <>
                                                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                                    Fixing...
                                                </>
                                            ) : (
                                                <>
                                                    <Wand2 className="w-4 h-4" />
                                                    Auto-Fix
                                                </>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        <RefreshCcw className="w-4 h-4" />
                                        Refresh Page
                                    </button>
                                </div>
                            </div>
                        )}

                        {process.env.NODE_ENV === 'development' && error && (
                            <details className="mt-6 text-xs text-slate-500">
                                <summary className="cursor-pointer hover:text-slate-700">
                                    Technical Details
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-auto max-h-32">
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return children;
    }
}
