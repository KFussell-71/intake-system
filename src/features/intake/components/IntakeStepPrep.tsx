import React from 'react';
import { GraduationCap } from 'lucide-react';
import { ElegantInput } from '@/components/ui/ElegantInput';
import { FormCheckbox } from './FormCheckbox';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const IntakeStepPrep: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-primary" />
                Employment Preparation Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ElegantInput
                    label="Class 1: Fair Chance Hiring"
                    name="class1Date"
                    value={formData.class1Date}
                    onChange={onChange}
                    type="date"
                />
                <ElegantInput
                    label="Class 2: Interview Techniques"
                    name="class2Date"
                    value={formData.class2Date}
                    onChange={onChange}
                    type="date"
                />
                <ElegantInput
                    label="Class 3: Work Behaviors"
                    name="class3Date"
                    value={formData.class3Date}
                    onChange={onChange}
                    type="date"
                />
                <ElegantInput
                    label="Class 4: Hygiene & Grooming"
                    name="class4Date"
                    value={formData.class4Date}
                    onChange={onChange}
                    type="date"
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormCheckbox
                    label="Master Application Complete"
                    name="masterAppComplete"
                    checked={formData.masterAppComplete}
                    onChange={onChange}
                />
                <FormCheckbox
                    label="Resume Complete"
                    name="resumeComplete"
                    checked={formData.resumeComplete}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};
