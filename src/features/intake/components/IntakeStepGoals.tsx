import React from 'react';
import { Target } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { IntakeFormData } from '../types/intake';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const IntakeStepGoals: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Individual Service Plan (ISP)
            </h2>
            <ElegantTextarea
                label="Primary Employment Goals"
                name="employmentGoals"
                value={formData.employmentGoals}
                onChange={onChange}
                placeholder="What kind of work does the client want to pursue?"
            />
            <ElegantTextarea
                label="Education & Training Goals"
                name="educationGoals"
                value={formData.educationGoals}
                onChange={onChange}
                placeholder="Degrees, certifications, or vocational training required?"
            />
            <ElegantTextarea
                label="Housing Stability Needs"
                name="housingNeeds"
                value={formData.housingNeeds}
                onChange={onChange}
                placeholder="Status of current housing and any immediate needs..."
            />
        </div>
    );
};
