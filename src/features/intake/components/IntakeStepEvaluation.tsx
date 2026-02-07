import React from 'react';
import { Stethoscope } from 'lucide-react';
import { IntakeFormData } from '../types/intake';
import { FormCheckbox } from './FormCheckbox';
import { useEffect } from 'react';

// New Modular Sections
import { AppearanceSection } from './sections/evaluation/AppearanceSection';
import { PresentationSection } from './sections/evaluation/PresentationSection';
import { MentalHealthHistorySection } from './sections/evaluation/MentalHealthHistorySection';
import { MedicalHistorySection } from './sections/evaluation/MedicalHistorySection';
import { SubstanceUseSection } from './sections/evaluation/SubstanceUseSection';
import { FamilySocialHistorySection } from './sections/evaluation/FamilySocialHistorySection';
import { AssessmentSummarySection } from './sections/evaluation/AssessmentSummarySection';
import { CounselorRationaleField } from './CounselorRationaleField';
import { StructuredObservation } from './StructuredObservation'; // SME Fix

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    errors?: Record<string, string>;
    isReadOnly?: boolean;
}

export const IntakeStepEvaluation: React.FC<Props> = ({ formData, onChange, errors = {}, isReadOnly = false }) => {

    // SME Fix #4: Logic to flag evaluation needs
    // (Preserved legacy logic but mapped to new fields can be added here if needed)

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-primary" />
                Clinical & Psychosocial Assessment
            </h2>

            {/* SME Fix: Structured Clinical Logic */}
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                <StructuredObservation
                    observations={formData.clinical_observations}
                    onChange={(newObs) => onChange({
                        target: { name: 'clinical_observations', value: newObs }
                    } as any)}
                />
            </div>

            {/* 1. Appearance & Mood (Clinician Observed) */}
            <AppearanceSection formData={formData} onChange={onChange} />

            {/* 2. Presentation & Supports */}
            <PresentationSection formData={formData} onChange={onChange} />

            {/* 3. Mental Health History */}
            <MentalHealthHistorySection formData={formData} onChange={onChange} />

            {/* 4. Substance Use */}
            <SubstanceUseSection formData={formData} onChange={onChange} />

            {/* 5. Medical History */}
            <MedicalHistorySection formData={formData} onChange={onChange} isReadOnly={isReadOnly} />

            {/* 6. Family/Social/Legal */}
            <FamilySocialHistorySection formData={formData} onChange={onChange} />

            {/* 7. Summary */}
            <AssessmentSummarySection formData={formData} onChange={onChange} />

            <div className="p-6 bg-accent/5 border border-accent/20 rounded-3xl mt-8">
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
