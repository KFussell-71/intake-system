
import React from 'react';
import { IntakeFormData } from '../intakeTypes';
import { AlertCircle, CheckCircle2, Info, Gavel, FileText, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EligibilityDecisionModal } from './EligibilityDecisionModal';
import { suggestRSA911Codes } from '@/app/actions/ai/rsa911Actions';
import { DORReportButton } from "@/features/reports/DORReportButton";
import { toast } from 'sonner';

interface Props {
    formData: any;
}

export const ComplianceSidebar: React.FC<Props> = ({ formData }) => {
    // Determine which requirements are met
    // This logic mimics the original file's validation rules
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
    const [isThinking, setIsThinking] = React.useState(false);

    const handleAIAssist = async () => {
        setIsThinking(true);
        toast.info("Analyzing clinical data for RSA-911 codes...");
        try {
            const result = await suggestRSA911Codes(formData);
            if (result.success && result.suggestions) {
                const raw = JSON.parse(result.suggestions);
                toast.success("AI Suggestion Ready", {
                    description: `Disability Priority: ${raw.priorityCategory}. Services: ${raw.suggestedServices?.join(', ')}`,
                    action: {
                        label: "Apply",
                        onClick: () => toast.success("Applied to form (Mock)")
                    }
                });
            } else {
                toast.error("AI could not determine codes. Please add more clinical notes.");
            }
        } catch (e) {
            toast.error("AI Service Error");
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="w-80 h-fit sticky top-32 space-y-6">
            {/* AI Assistant Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30">
                <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">RSA-911 Assistant</h3>
                        <p className="text-[10px] text-indigo-100 opacity-80">Auto-coding enabled</p>
                    </div>
                </div>
                <button
                    onClick={handleAIAssist}
                    disabled={isThinking}
                    className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                    {isThinking ? <Loader2 className="w-3 h-3 animate-spin" /> : "Suggest Codes"}
                </button>
            </div>

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

            <EligibilityDecisionModal
                isOpen={showEligibilityModal}
                onClose={() => setShowEligibilityModal(false)}
                intakeId="mock-intake-id-for-demo"
                onSuccess={(status) => alert(`Eligibility Finalized: ${status}`)}
            />

            {/* DOR Report Generator */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    DOR Report
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Auto-generate the "New Beginnings Outreach Report" based on current intake data.
                </p>
                <DORReportButton intakeId="current_session" clientName={formData.clientName || "Current Client"} />
            </div>
        </div>
    );
};
