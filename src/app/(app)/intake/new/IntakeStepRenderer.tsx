'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { IdentityModule } from '@/features/identity/components/IdentityModule';
import { MedicalModule } from '@/features/medical/components/MedicalModule';
import { EmploymentModule } from '@/features/employment/components/EmploymentModule';
import { ConsentModule } from '@/features/consent/components/ConsentModule';
import { ObservationFeed } from '@/features/intake/components/ObservationFeed';
import { IntakeStepReview } from '@/features/intake/components/IntakeStepReview';

interface IntakeStepRendererProps {
    currentStep: number;
    activeIntakeId: string;
    formData: any;
    handleInputChange: (e: any) => void;
    setFormData: (data: any) => void;
    isReadOnly: boolean;
    setSignedPdf: (file: File | null) => void;
}

export const IntakeStepRenderer: React.FC<IntakeStepRendererProps> = ({
    currentStep,
    activeIntakeId,
    formData,
    handleInputChange,
    setFormData,
    isReadOnly,
    setSignedPdf
}) => {
    if (!activeIntakeId && currentStep > 0) {
        return (
            <div className="p-12 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-orange-500 mx-auto" />
                <h3 className="text-xl font-bold">Identity Required</h3>
                <p className="text-white/50">Please complete the Identity section first to initialize the intake.</p>
            </div>
        );
    }

    switch (currentStep) {
        case 0:
            return (
                <div className="space-y-8">
                    <IdentityModule
                        intakeId={activeIntakeId}
                        onStatusChange={(s) => console.log('Identity status:', s)}
                    />
                    <ObservationFeed intakeId={activeIntakeId} domain="identity" />
                </div>
            );
        case 1:
            return (
                <div className="space-y-8">
                    <MedicalModule
                        intakeId={activeIntakeId}
                    />
                    <ObservationFeed intakeId={activeIntakeId} domain="medical" />
                </div>
            );
        case 2:
        case 3:
        case 4:
            return (
                <div className="space-y-8">
                    <EmploymentModule
                        intakeId={activeIntakeId}
                    />
                    <ObservationFeed intakeId={activeIntakeId} domain="employment" />
                </div>
            );
        case 5:
            return (
                <div className="space-y-12">
                    <ConsentModule intakeId={activeIntakeId} />
                    <IntakeStepReview
                        formData={formData}
                        onChange={handleInputChange}
                        setFormData={setFormData}
                        isReadOnly={isReadOnly}
                        onFileSelect={setSignedPdf}
                        intakeId={activeIntakeId}
                    />
                </div>
            );
        default: return null;
    }
};
