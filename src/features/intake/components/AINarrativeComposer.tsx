'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IdentityData, VocationalData, MedicalData, ClinicalData, IntakeMetadata } from '../intakeTypes';
import { generateNarrativeDraft } from '@/app/actions/generateNarrativeDraft';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    formData: IdentityData & VocationalData & MedicalData & ClinicalData & IntakeMetadata;
    onDraftGenerated: (field: 'clinicalRationale' | 'notes', text: string) => void;
    targetField: 'clinicalRationale' | 'notes';
    label: string;
}

export const AINarrativeComposer: React.FC<Props> = ({ formData, onDraftGenerated, targetField, label }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            // Map the internal field name to the AI synthesis type
            const synthesisType = targetField === 'clinicalRationale' ? 'rationale' : 'notes';
            const result = await generateNarrativeDraft(formData, synthesisType);
            if (result) {
                onDraftGenerated(targetField, result);
            }
        } catch (error) {
            console.error("Narrative Draft Error:", error);
            alert("AI Composer encountered an error. Please ensure your internet connection is stable.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-4 mb-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">{label}</h4>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="group relative overflow-hidden bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-3 h-8 rounded-xl transition-all"
            >
                <div className="flex items-center gap-1.5 relative z-10">
                    {isGenerating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Wand2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-tight">
                        {isGenerating ? 'Synthesizing...' : 'AI Auto-Compose'}
                    </span>
                </div>
                {/* Subtle Glow Effect */}
                {!isGenerating && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                )}
            </Button>
        </div>
    );
};
