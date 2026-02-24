'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ConsentWorkflow } from './ConsentWorkflow';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useConsent } from '../hooks/useConsent';

interface Props {
    intakeId: string;
}

export const ModernizedConsentSection: React.FC<Props> = ({ intakeId }) => {
    const router = useRouter();
    const { setSectionStatus } = useConsent(intakeId);

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

            <div className="flex justify-end pt-4 gap-4">
                <Button
                    variant="outline"
                    onClick={() => {
                        setSectionStatus('in_progress');
                        router.push('/dashboard');
                    }}
                >
                    Save as Draft & Exit
                </Button>
                <Button
                    onClick={() => {
                        setSectionStatus('complete');
                        router.push('/dashboard');
                    }}
                >
                    Mark Complete & Finish
                </Button>
            </div>
        </div>
    );
};
