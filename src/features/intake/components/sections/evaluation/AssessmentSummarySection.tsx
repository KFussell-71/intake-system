import React, { useState, useEffect, useRef } from 'react';
import { IntakeFormData } from '../../../types/intake';
import { GlassCard } from '@/components/ui/GlassCard';
import { ListChecks, Sparkles, Loader2 } from 'lucide-react';
import { ElegantTextarea } from '@/components/ui/ElegantInput';
import { usePredictiveAI } from '@/hooks/usePredictiveAI';
import { AIPredictiveOverlay } from '@/components/ui/AIPredictiveOverlay';
import { smartFormFill } from '@/app/actions/aiActions';
import { toast } from 'sonner';

interface Props {
    formData: IntakeFormData;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onPatch?: (patch: Partial<IntakeFormData>) => void;
}

export const AssessmentSummarySection: React.FC<Props> = ({ formData, onChange, onPatch }) => {
    const { suggestion, isLoading, getSuggestion } = usePredictiveAI('Clinical Assessment Summary');
    const [isDismissed, setIsDismissed] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
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

    const handleSmartExtract = async () => {
        if (!formData.assessmentSummary || formData.assessmentSummary.length < 20) {
            toast.error('Please enter more clinical detail before extracting.');
            return;
        }

        setIsExtracting(true);
        try {
            const result = await smartFormFill(formData.assessmentSummary);
            if (onPatch && Object.keys(result).length > 0) {
                onPatch(result);
                toast.success('Fields extracted successfully!', {
                    description: `Updated: ${Object.keys(result).join(', ')}`
                });
            } else {
                toast.info('No new info extracted from summary.');
            }
        } catch (error) {
            toast.error('AI Extraction failed.');
        } finally {
            setIsExtracting(false);
        }
    };

    return (
        <GlassCard className="p-6 bg-primary/5 dark:bg-primary/10 border-primary/20">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
                    <ListChecks className="w-5 h-5" />
                    Assessment Summary
                </h3>

                <button
                    onClick={handleSmartExtract}
                    disabled={isExtracting}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-full bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                    {isExtracting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Smart Extract to Form
                </button>
            </div>

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
