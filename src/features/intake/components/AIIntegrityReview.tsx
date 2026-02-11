import React, { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { checkIntakeIntegrity } from '@/app/actions/aiActions';
import { IntegrityIssue } from '@/domain/services/AIIntegrityAgent';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    intakeId: string;
    data: any;
    status: string;
}

export const AIIntegrityReview: React.FC<Props> = ({ intakeId, data, status }) => {
    const [issues, setIssues] = useState<IntegrityIssue[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const runCheck = async () => {
        setIsChecking(true);
        try {
            const results = await checkIntakeIntegrity(intakeId, data, status);
            setIssues(results);
            setHasChecked(true);
        } catch (error) {
            console.error('Integrity check failed:', error);
        } finally {
            setIsChecking(false);
        }
    };

    useEffect(() => {
        if (intakeId && !hasChecked) {
            runCheck();
        }
    }, [intakeId]);

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high': return <ShieldAlert className="w-5 h-5 text-red-500" />;
            case 'medium': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default: return <AlertTriangle className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <GlassCard className="p-6 border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-900/10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                    <ShieldCheck className="w-6 h-6" />
                    AI Clinical Integrity Audit
                </h3>
                <button
                    onClick={runCheck}
                    disabled={isChecking}
                    className="p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    title="Refresh Audit"
                >
                    <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <AnimatePresence mode="wait">
                {!hasChecked && isChecking ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-8 text-slate-500"
                    >
                        <RefreshCw className="w-8 h-8 animate-spin mb-2" />
                        <p className="text-sm font-medium">Analyzing documentation consistency...</p>
                    </motion.div>
                ) : issues.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-4 p-4 bg-green-500/10 rounded-2xl border border-green-500/20"
                    >
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                        <div>
                            <p className="font-bold text-green-700">Audit Passed</p>
                            <p className="text-sm text-green-600">No clinical inconsistencies or compliance risks detected.</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                    >
                        {issues.map((issue, idx) => (
                            <div
                                key={idx}
                                className={`flex gap-4 p-4 rounded-2xl border ${issue.severity === 'high'
                                        ? 'bg-red-50 border-red-100 text-red-700 dark:bg-red-900/10 dark:border-red-900/20'
                                        : 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/10 dark:border-amber-900/20'
                                    }`}
                            >
                                {getSeverityIcon(issue.severity)}
                                <div>
                                    <p className="font-bold text-sm uppercase tracking-wider">{issue.type.replace('_', ' ')}</p>
                                    <p className="text-sm opacity-90">{issue.description}</p>
                                    {issue.field && (
                                        <p className="text-xs mt-1 font-mono opacity-60">Source: {issue.field}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="mt-4 text-[10px] text-slate-400 font-medium italic text-center">
                AI Agentic Shadow Audit: Independent verification of documentation quality.
            </p>
        </GlassCard>
    );
};
