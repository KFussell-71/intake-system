import React from 'react';
import { FileCheck, AlertCircle, Download, Upload } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';
import { AISuccessSuggestions } from './AISuccessSuggestions';
import { CounselorRationaleField } from './CounselorRationaleField';
import { GlassCard } from '@/components/ui/GlassCard';
import { AINarrativeComposer } from './AINarrativeComposer';
import { AIIntegrityReview } from './AIIntegrityReview';
import { ReferralPlanWidget } from './ReferralPlanWidget';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    setFormData: (data: IntakeFormData | ((prev: IntakeFormData) => IntakeFormData)) => void;
    errors?: Record<string, string>;
    onFileSelect?: (file: File | null) => void;
    intakeId?: string | null;
}

export const IntakeStepReview: React.FC<Props> = ({
    formData,
    onChange,
    setFormData,
    errors = {},
    onFileSelect,
    intakeId
}) => {
    const handleAIDraftGenerated = (field: 'clinicalRationale' | 'notes', text: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: text
        }));
    };
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-primary" />
                Review & Finalize
            </h2>

            {/* SME Fix: Agentic Integrity Shadow Audit */}
            {intakeId && (
                <AIIntegrityReview
                    intakeId={intakeId}
                    data={formData}
                    status={formData.status || 'draft'}
                />
            )}

            {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold">Please review preceding steps. {Object.keys(errors).length} validation errors found.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Referral Source"
                    name="referralSource"
                    value={formData.referralSource}
                    onChange={onChange}
                    placeholder="e.g. Agency name"
                    enableDictation
                />
                <ElegantInput
                    label="Referral Contact"
                    name="referralContact"
                    value={formData.referralContact}
                    onChange={onChange}
                    placeholder="Contact name or phone"
                    enableDictation
                />
            </div>
            <div className="space-y-4">
                <AINarrativeComposer
                    formData={formData}
                    onDraftGenerated={handleAIDraftGenerated}
                    targetField="notes"
                    label="Staff Observations & Additional Notes"
                />
                <ElegantTextarea
                    label="" // Hidden as label is in Composer
                    name="notes"
                    value={formData.notes}
                    onChange={onChange}
                    placeholder="Any other relevant details or next steps..."
                    rows={6}
                    enableDictation
                />
            </div>

            <hr className="border-slate-100 dark:border-white/5" />

            <div className="space-y-4">
                <AINarrativeComposer
                    formData={formData}
                    onDraftGenerated={handleAIDraftGenerated}
                    targetField="clinicalRationale"
                    label="Final Clinical Rationale & Disposition"
                />
                <CounselorRationaleField
                    label="" // Hidden as label is in Composer
                    name="clinicalRationale"
                    value={formData.clinicalRationale || ''}
                    onChange={onChange as any}
                    placeholder="Final summary of the client's strengths, barriers, and the reasoning behind their program placement and eligibility..."
                />
            </div>


            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <FileCheck className="w-5 h-5 text-indigo-500" />
                    Signature & Finalization
                </h3>
                <p className="text-sm text-slate-500">
                    Please download the compiled report, obtain the client&apos;s signature, and upload the signed packet before finalizing.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const { ReportGenerator } = await import('@/lib/pdf/ReportGenerator');
                                ReportGenerator.generateDORIntakeReport(formData);
                            } catch (err) {
                                console.error('Failed to generate PDF:', err);
                                alert('Failed to generate report. Please try again.');
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-indigo-600 dark:text-indigo-400"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF Packet
                    </button>

                    <div className="flex-1 w-full relative">
                        <input
                            type="file"
                            aria-label="Upload Signed Packet"
                            accept="application/pdf,image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (onFileSelect) onFileSelect(file);
                            }}
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-sm file:font-semibold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100
                                cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            {intakeId && (
                <ReferralPlanWidget intakeId={intakeId} />
            )}

            <AISuccessSuggestions formData={formData} />
        </div>
    );
};
