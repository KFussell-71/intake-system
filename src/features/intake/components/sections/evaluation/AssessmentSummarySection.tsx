import React from 'react';
import { IntakeFormData } from '../../../types/intake';
import { GlassCard } from '@/components/ui/GlassCard';
import { ListChecks } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const AssessmentSummarySection: React.FC<Props> = ({ formData, onChange }) => {
    return (
        <GlassCard className="p-6 bg-primary/5 dark:bg-primary/10 border-primary/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                <ListChecks className="w-5 h-5" />
                Assessment Summary
            </h3>
            <ElegantTextarea
                label="Summary of Findings"
                name="assessmentSummary"
                value={formData.assessmentSummary}
                onChange={onChange}
                placeholder="Summarize the individual's problems, strengths, limitations, opportunities, etc."
                rows={6}
                enableDictation
            />
        </GlassCard>
    );
};
