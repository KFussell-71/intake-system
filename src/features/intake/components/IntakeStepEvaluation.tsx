import React from 'react';
import { Stethoscope } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';
import { FormCheckbox } from './FormCheckbox';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const IntakeStepEvaluation: React.FC<Props> = ({ formData, onChange }) => {
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
                />
                <FormCheckbox
                    label="Psychological Eval Required"
                    name="psychEvalNeeded"
                    checked={formData.psychEvalNeeded}
                    onChange={onChange}
                />
            </div>
            <ElegantTextarea
                label="Evaluation Notes & Potential Barriers"
                name="medicalPsychNotes"
                value={formData.medicalPsychNotes}
                onChange={onChange}
                placeholder="Briefly state any medical or psychological barriers identified..."
                rows={4}
            />
            <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl">
                <FormCheckbox
                    label="Official Consent to Release Information Obtained"
                    name="consentToRelease"
                    checked={formData.consentToRelease}
                    onChange={onChange}
                />
                <p className="mt-2 ml-10 text-xs text-slate-500 font-medium">
                    Checking this confirms HIPAA compliance by securing client signature on release forms.
                </p>
            </div>
        </div>
    );
};
