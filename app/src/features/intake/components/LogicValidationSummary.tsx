'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface LogicIssue {
    severity: 'critical' | 'warning';
    message: string;
    fields: string[];
}

interface LogicValidationSummaryProps {
    result: {
        valid: boolean;
        score: number;
        issues: LogicIssue[];
    } | null;
    isChecking: boolean;
}

export const LogicValidationSummary: React.FC<LogicValidationSummaryProps> = ({ result, isChecking }) => {
    if (isChecking) {
        return (
            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 animate-pulse text-center">
                <div className="flex justify-center mb-4">
                    <ShieldAlert className="w-8 h-8 text-primary animate-bounce" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white">AI Logic Guard is Scanning...</h4>
                <p className="text-sm text-slate-500">Analyzing form for internal contradictions and red flags.</p>
            </div>
        );
    }

    if (!result) return null;

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-green-500';
        if (score >= 70) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl border ${result.valid ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/30' : 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30'}`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                    {result.valid ? (
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <ShieldCheck className="w-6 h-6 text-white" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                    )}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">AI Logic Guard Result</h4>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Comprehensive Scan</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-black ${getScoreColor(result.score)}`}>{result.score}%</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Consistency Score</div>
                </div>
            </div>

            {result.issues.length > 0 ? (
                <div className="space-y-4">
                    {result.issues.map((issue, idx) => (
                        <div key={idx} className={`p-4 rounded-2xl flex gap-4 ${issue.severity === 'critical' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${issue.severity === 'critical' ? 'text-red-500' : 'text-amber-500'}`} />
                            <div>
                                <p className={`text-sm font-bold ${issue.severity === 'critical' ? 'text-red-700 dark:text-red-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                    {issue.severity.toUpperCase()}: {issue.message}
                                </p>
                                {issue.fields.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {issue.fields.map(field => (
                                            <span key={field} className="px-2 py-0.5 bg-white/20 dark:bg-black/20 rounded text-[10px] font-mono text-slate-500 uppercase">
                                                {field}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    No logical contradictions found. Data appears highly consistent.
                </div>
            )}
        </motion.div>
    );
};
