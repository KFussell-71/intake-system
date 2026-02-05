import React from 'react';
import { FileCheck, AlertCircle } from 'lucide-react';
import { ElegantInput, ElegantTextarea } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';
import { AISuccessSuggestions } from './AISuccessSuggestions';
import { CounselorRationaleField } from './CounselorRationaleField';
import { GlassCard } from '@/components/ui/GlassCard';
import { AINarrativeComposer } from './AINarrativeComposer';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    setFormData: (data: IntakeFormData | ((prev: IntakeFormData) => IntakeFormData)) => void;
    errors?: Record<string, string>;
}

export const IntakeStepReview: React.FC<Props> = ({ formData, onChange, setFormData, errors = {} }) => {
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

            {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold">Please review preceding steps. {Object.keys(errors).length} validation errors found.</p>
                </div>
            )}

            <GlassCard className="p-6 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-1">Final Eligibility Determination</h4>
                        <p className="text-xs text-slate-500 font-medium italic">
                            {formData.eligibilityDetermination === 'eligible'
                                ? 'Client has been flagged as clinically eligible for the program.'
                                : formData.eligibilityDetermination === 'ineligible'
                                    ? 'Client has been flagged as ineligible. Review rationale below.'
                                    : 'Pending final professional determination.'}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border-2 ${formData.eligibilityDetermination === 'eligible' ? 'bg-green-500 text-white border-green-600' :
                        formData.eligibilityDetermination === 'ineligible' ? 'bg-red-500 text-white border-red-600' :
                            'bg-slate-200 text-slate-600 border-slate-300'
                        }`}>
                        {formData.eligibilityDetermination || 'Pending'}
                    </div>
                </div>
            </GlassCard>

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

            <AISuccessSuggestions formData={formData} />
        </div>
    );
};
