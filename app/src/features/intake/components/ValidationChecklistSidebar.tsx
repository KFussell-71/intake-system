import React from 'react';
import { CheckCircle2, Circle, AlertCircle, ShieldCheck, FileCheck } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Progress } from '@/components/ui/progress';

interface Props {
    formData: any;
}

/**
 * UI: Validation Checklist Sidebar
 * 
 * Provides real-time feedback on RSA-911 compliance and clinical completeness.
 */
export const ValidationChecklistSidebar: React.FC<Props> = ({ formData }) => {

    const rules = [
        { id: 'ssn', label: 'Last 4 SSN', check: () => !!formData.ssnLastFour },
        { id: 'dob', label: 'Date of Birth', check: () => !!formData.clientDob },
        { id: 'diagnosis', label: 'Primary Diagnosis', check: () => !!formData.primaryDiagnosisCode },
        { id: 'barrier', label: 'Minimum 1 Barrier', check: () => (formData.client_barriers?.length || 0) > 0 },
        { id: 'rationale', label: 'Clinical Rationale', check: () => !!formData.diagnosis_rationale_id },
        { id: 'consent', label: 'Release Consent', check: () => !!formData.consentToRelease }
    ];

    const completedCount = rules.filter(r => r.check()).length;
    const progress = (completedCount / rules.length) * 100;
    const isCompliant = completedCount === rules.length;

    return (
        <GlassCard className="p-5 space-y-6 w-72 h-fit sticky top-24 border-indigo-100/50 dark:border-indigo-500/20 shadow-xl shadow-indigo-500/5">
            <div className="space-y-1">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                        Compliance Audit
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400">{completedCount}/{rules.length}</span>
                </div>
                <Progress value={progress} className="h-1 bg-slate-100 dark:bg-slate-800" />
            </div>

            <div className="space-y-4">
                {rules.map(rule => {
                    const ok = rule.check();
                    return (
                        <div key={rule.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                {ok ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <Circle className="w-4 h-4 text-slate-200 dark:text-slate-800" />
                                )}
                                <span className={`text-sm ${ok ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'} font-medium`}>
                                    {rule.label}
                                </span>
                            </div>
                            {!ok && <AlertCircle className="w-3 h-3 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </div>
                    );
                })}
            </div>

            {isCompliant ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                        <div className="text-[10px] font-bold text-emerald-700 uppercase">Ready for Submission</div>
                        <div className="text-xs text-emerald-600/80">Audit baseline met.</div>
                    </div>
                </div>
            ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Status: Draft</div>
                    <div className="text-xs text-slate-500">Awaiting clinical details.</div>
                </div>
            )}
        </GlassCard>
    );
};
