'use client';

import React from 'react';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { ActionButton } from '@/components/ui/ActionButton';

interface IntakeStepNavigationProps {
    currentStep: number;
    totalSteps: number;
    isSaving: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onSubmit: () => void;
}

export const IntakeStepNavigation: React.FC<IntakeStepNavigationProps> = ({
    currentStep,
    totalSteps,
    isSaving,
    onPrevious,
    onNext,
    onSubmit
}) => {
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    return (
        <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-100 max-w-3xl mx-auto lg:mx-0">
            <ActionButton
                variant="secondary"
                onClick={onPrevious}
                disabled={isFirstStep || isSaving}
                icon={<ChevronLeft className="w-4 h-4" />}
            >
                Previous
            </ActionButton>

            <ActionButton
                variant="primary"
                onClick={isLastStep ? onSubmit : onNext}
                isLoading={isSaving}
                disabled={isSaving}
                icon={isLastStep ? <CheckCircle className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            >
                {isLastStep ? 'Complete & Submit' : 'Continue'}
            </ActionButton>
        </div>
    );
};
