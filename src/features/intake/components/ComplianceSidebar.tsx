import React from 'react';
import { IntakeFormData } from '../types/intake';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    formData: IntakeFormData;
}

export const ComplianceSidebar: React.FC<Props> = ({ formData }) => {
    const requirements = [
        { label: 'Client Name', value: formData.clientName, step: 0 },
        { label: 'Last 4 SSN', value: formData.ssnLastFour, step: 0 },
        { label: 'Intake Date', value: formData.reportDate, step: 0 },
        { label: 'Consent Obtained', value: formData.consentToRelease, step: 1 },
        { label: 'Employment Goals', value: formData.employmentGoals, step: 2 },
        { label: 'Counselor Observations', value: formData.counselorObservations, step: 0 },
        { label: 'Clinical Rationale', value: formData.clinicalRationale, step: 1 },
    ];

    const missing = requirements.filter(r => !r.value);
    const completedCount = requirements.length - missing.length;
    const progress = Math.round((completedCount / requirements.length) * 100);

    return (
        <div className="w-80 h-fit sticky top-32 space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Compliance Status</h3>
                    <div className="text-xs font-black px-2 py-1 bg-primary/10 text-primary rounded-lg">
                        {progress}%
                    </div>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full mb-8 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="space-y-4">
                    {requirements.map((req, idx) => (
                        <div key={idx} className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                {req.value ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : (
                                    <AlertCircle className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                                )}
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    req.value ? "text-slate-500" : "text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                                )}>
                                    {req.label}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {missing.length === 0 ? (
                    <div className="mt-8 p-4 bg-green-500/10 rounded-2xl border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Ready for Submission
                    </div>
                ) : (
                    <div className="mt-8 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {missing.length} Item{missing.length > 1 ? 's' : ''} Remaining
                    </div>
                )}
            </div>

            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Internal Note</h4>
                <p className="text-[11px] text-primary/80 leading-relaxed font-medium">
                    SME Fix: You can save drafts at any time. Mandatory fields are only required for final submission and report generation.
                </p>
            </div>
        </div>
    );
};
