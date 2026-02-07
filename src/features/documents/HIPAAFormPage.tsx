'use client';

import React from 'react';
import { HIPAAAuthorizationForm } from './forms/HIPAAAuthorizationForm';
import { HIPAAAuthorizationData } from './types/hipaaRelease';
import { GlassCard } from '@/components/ui/GlassCard';
import { FileSignature } from 'lucide-react';

interface Props {
    clientData?: {
        firstName?: string;
        lastName?: string;
        dateOfBirth?: string;
        address?: string;
    };
}

export const HIPAAFormPage: React.FC<Props> = ({ clientData }) => {
    const handleSubmit = (data: HIPAAAuthorizationData) => {
        console.log('HIPAA Form Submitted:', data);
        // TODO: Save to database / generate PDF
        alert('Authorization form submitted successfully!');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 py-8">
            <HIPAAAuthorizationForm
                clientData={clientData}
                onSubmit={handleSubmit}
            />
        </div>
    );
};

export default HIPAAFormPage;
