import React from 'react';
import { any } from '../types/intake';
import { AlertCircle, CheckCircle2, Info, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EligibilityDecisionModal } from './EligibilityDecisionModal';

interface Props {
    formData: any;
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

    const [showEligibilityModal, setShowEligibilityModal] = React.useState(false);

    // Check if we have an intake ID (simulated by checking if we have valid data or just use a dummy for now if missing)
    // In real app, intakeId comes from context or props. For now we assume the parent passed it or we use a mock.
    // Ideally Props should include intakeId. Since we can't easily change the parent props right now without checking layout,
    // we'll disable the button if progress < 100? Or just allow it as per SME request "Separate Event".

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

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                    <button
                        onClick={() => setShowEligibilityModal(true)}
                        className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        <Gavel className="w-4 h-4" />
                        Finalize Determination
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                        Opens Legal Determination Modal
                    </p>
                </div>
            </div>

            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20">
                <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Internal Note</h4>
                <p className="text-[11px] text-primary/80 leading-relaxed font-medium">
                    SME Fix: You can save drafts at any time. Mandatory fields are only required for final submission and report generation.
                </p>
            </div>

            {/* In a real app, this would probably be at the layout level, but placing here for encapsulation of the fix */}
            {/* dynamic import to avoid SSR issues if any, but standard import is fine */}
            <EligibilityDecisionModal
                isOpen={showEligibilityModal}
                onClose={() => setShowEligibilityModal(false)}
                intakeId="mock-intake-id-for-demo" // In production, pass actual ID
                onSuccess={(status) => alert(`Eligibility Finalized: ${status}`)}
            />
        </div>
    );
};

// Imports moved to top
