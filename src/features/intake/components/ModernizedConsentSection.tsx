'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ConsentWorkflow } from './ConsentWorkflow';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Props {
    intakeId: string;
}

export const ModernizedConsentSection: React.FC<Props> = ({ intakeId }) => {
    const router = useRouter();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                Release of Information (Modernized)
            </h2>

            <p className="text-slate-500">
                This intake collects sensitive information. Federal law requires explicit,
                revocable consent before we can coordinate care with other agencies.
            </p>

            <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-xl border border-slate-200 dark:border-white/10">
                <ConsentWorkflow intakeId={intakeId} />
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={() => router.push('/dashboard')}>
                    Finish Intake
                </Button>
            </div>
        </div>
    );
};
