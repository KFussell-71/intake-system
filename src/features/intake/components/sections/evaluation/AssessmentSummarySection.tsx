import React, { useState, useEffect, useRef } from 'react';
import { IntakeFormData } from '../../../types/intake';
import { GlassCard } from '@/components/ui/GlassCard';
import { ListChecks } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { usePredictiveAI } from '@/hooks/usePredictiveAI';
import { AIPredictiveOverlay } from '@/components/ui/AIPredictiveOverlay';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const AssessmentSummarySection: React.FC<Props> = ({ formData, onChange }) => {
    const { suggestion, isLoading, getSuggestion } = usePredictiveAI('Clinical Assessment Summary');
    const [isDismissed, setIsDismissed] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // SME: Reset dismissal when user keeps typing new thoughts
    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e);
        setIsDismissed(false);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            getSuggestion(e.target.value);
        }, 3000); // 3-second debounce for "thought completion"
    };

    const handleAccept = (text: string) => {
        const newValue = formData.assessmentSummary
            ? `${formData.assessmentSummary.trim()} ${text}`
            : text;

        onChange({
            target: { name: 'assessmentSummary', value: newValue }
        } as any);
        setIsDismissed(true);
    };

    return (
        <GlassCard className="p-6 bg-primary/5 dark:bg-primary/10 border-primary/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                <ListChecks className="w-5 h-5" />
                Assessment Summary
            </h3>
            <ElegantTextarea
                label="Summary of Findings"
                name="assessmentSummary"
                value={formData.assessmentSummary || ''}
                onChange={handleTextChange as any}
                placeholder="Summarize the individual's problems, strengths, limitations, opportunities, etc."
                rows={6}
                enableDictation
            />

            <AIPredictiveOverlay
                suggestion={!isDismissed ? (suggestion?.text || null) : null}
                isLoading={isLoading}
                onAccept={handleAccept}
                onDismiss={() => setIsDismissed(true)}
            />
        </GlassCard>
    );
};
