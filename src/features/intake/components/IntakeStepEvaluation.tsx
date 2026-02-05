import React from 'react';
import { Stethoscope } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';
import { FormCheckbox } from './FormCheckbox';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    errors?: Record<string, string>;
}

import { CounselorRationaleField } from './CounselorRationaleField';
import { useEffect } from 'react';

export const IntakeStepEvaluation: React.FC<Props> = ({ formData, onChange, errors = {} }) => {
    // SME Fix #4: Smart Defaults & Logic Flags
    useEffect(() => {
        const notes = formData.medicalPsychNotes?.toLowerCase() || '';
        const medicalKeywords = ['opioid', 'addiction', 'sud', 'injury', 'chronic', 'pain', 'diabetes'];
        const psychKeywords = ['depression', 'anxiety', 'ptsd', 'trauma', 'bipolar', 'psychosis'];

        let updates: any = {};

        if (medicalKeywords.some(kw => notes.includes(kw)) && !formData.medicalEvalNeeded) {
            updates.medicalEvalNeeded = true;
        }

        if (psychKeywords.some(kw => notes.includes(kw)) && !formData.psychEvalNeeded) {
            updates.psychEvalNeeded = true;
        }

        if (Object.keys(updates).length > 0) {
            // Batch update via a single onChange call if possible, or individual ones
            Object.entries(updates).forEach(([name, value]) => {
                onChange({ target: { name, value, type: 'checkbox', checked: value } } as any);
            });

            // Auto-fill rationale if it's empty
            if (!formData.clinicalRationale) {
                const autoRationale = "System detected clinical markers in notes. Medical/Psych evaluation flagged to determine functional limitations and employability factors.";
                onChange({ target: { name: 'clinicalRationale', value: autoRationale } } as any);
            }
        }
    }, [formData.medicalPsychNotes]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-primary" />
                Health & Legal Evaluations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormCheckbox
                    label="Medical Evaluation Required"
                    name="medicalEvalNeeded"
                    checked={formData.medicalEvalNeeded}
                    onChange={onChange}
                    error={errors.medicalEvalNeeded}
                />
                <FormCheckbox
                    label="Psychological Eval Required"
                    name="psychEvalNeeded"
                    checked={formData.psychEvalNeeded}
                    onChange={onChange}
                    error={errors.psychEvalNeeded}
                />
            </div>
            <ElegantTextarea
                label="Evaluation Notes (Client Reported)"
                name="medicalPsychNotes"
                value={formData.medicalPsychNotes}
                onChange={onChange}
                placeholder="State any health barriers as reported by the client..."
                rows={4}
                enableDictation
                error={errors.medicalPsychNotes}
            />

            <CounselorRationaleField
                label="Clinical Assessment"
                name="clinicalRationale"
                value={formData.clinicalRationale || ''}
                onChange={onChange as any}
                placeholder="Explain the clinical rationale for the medical/psych flags set above..."
            />

            <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl">
                <FormCheckbox
                    label="Official Consent to Release Information Obtained"
                    name="consentToRelease"
                    checked={formData.consentToRelease}
                    onChange={onChange}
                    error={errors.consentToRelease}
                />
                <p className="mt-2 ml-10 text-xs text-slate-500 font-medium">
                    Checking this confirms HIPAA compliance by securing client signature on release forms.
                </p>
            </div>
        </div>
    );
};
