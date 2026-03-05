'use client';

import React from 'react';
import { HIPAAAuthorizationForm } from './forms/HIPAAAuthorizationForm';
import { saveHIPAAAuthorizationAction } from '@/app/(app)/actions/hipaaActions';
import { toast } from 'sonner';

interface Props {
    intakeId: string; // Required for persistence
    clientData?: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        address?: string;
    };
}

export const HIPAAFormPage: React.FC<Props> = ({ intakeId, clientData }) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (data: HIPAAAuthorizationData) => {
        setIsSubmitting(true);
        try {
            const result = await saveHIPAAAuthorizationAction(intakeId, data);
            if (result.success) {
                toast.success('HIPAA Authorization submitted successfully!');
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (err: any) {
            toast.error('Failed to submit form.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 py-8">
            <HIPAAAuthorizationForm
                clientData={clientData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};

export default HIPAAFormPage;
