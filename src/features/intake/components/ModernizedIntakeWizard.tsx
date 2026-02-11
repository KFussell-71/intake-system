'use client';

import React, { useState } from 'react';
import { ModernizedIntakeStepIdentity } from './ModernizedIntakeStepIdentity';
import { ModernizedBarriersSection } from './ModernizedBarriersSection';
import { ModernizedObservationsSection } from './ModernizedObservationsSection';
import { ModernizedConsentSection } from './ModernizedConsentSection';
import { GlassCard } from '@/components/ui/GlassCard';
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Props {
    intakeId: string;
}

type Step = 'identity' | 'barriers' | 'observations' | 'consent';

export const ModernizedIntakeWizard: React.FC<Props> = ({ intakeId }) => {
    const router = useRouter();
    const [step, setStep] = useState<Step>('identity');

    const renderStep = () => {
        switch (step) {
            case 'identity':
                return <ModernizedIntakeStepIdentity intakeId={intakeId} onComplete={() => setStep('barriers')} />;
            case 'barriers':
                return <ModernizedBarriersSection intakeId={intakeId} />;
            case 'observations':
                return <ModernizedObservationsSection intakeId={intakeId} />;
            case 'consent':
                return <ModernizedConsentSection intakeId={intakeId} />;
            default:
                return null;
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 'identity': return 'Client Identity';
            case 'barriers': return 'Employment Barriers';
            case 'observations': return 'Clinical Observations';
            case 'consent': return 'Release of Information';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
                <div className="text-sm font-medium text-slate-500 flex items-center gap-4">
                    <span>Modernized Intake <span className="mx-2">/</span> <span className="text-primary">{getStepTitle()}</span></span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-400 hover:text-slate-600"
                        onClick={() => router.push(`/intake/${intakeId}`)}
                    >
                        Switch to Classic View
                    </Button>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex gap-2 mb-8">
                {(['identity', 'barriers', 'observations', 'consent'] as Step[]).map((s, idx) => (
                    <button
                        key={s}
                        onClick={() => setStep(s)}
                        className={`flex-1 h-1.5 rounded-full transition-all ${s === step ? 'bg-primary scale-100' :
                            (['identity', 'barriers', 'observations', 'consent'].indexOf(step) > idx) ? 'bg-primary/40' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                    />
                ))}
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px]">
                {renderStep()}
            </div>

            {/* Footer Navigation */}
            <GlassCard className="p-4 flex justify-between items-center sticky bottom-4 z-10 border-t border-white/20">
                <Button
                    variant="outline"
                    onClick={() => {
                        if (step === 'barriers') setStep('identity');
                        if (step === 'observations') setStep('barriers');
                        if (step === 'consent') setStep('observations');
                    }}
                    disabled={step === 'identity'}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>

                <div className="flex gap-2">
                    {/* Auto-save happens in components, but comprehensive save could go here */}
                    {step !== 'consent' && (
                        <Button
                            onClick={() => {
                                if (step === 'identity') setStep('barriers');
                                if (step === 'barriers') setStep('observations');
                                if (step === 'observations') setStep('consent');
                            }}
                        >
                            Next <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                    {step === 'consent' && (
                        <Button onClick={() => router.push(`/intake/${intakeId}`)}>
                            Finish & Review <Save className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </GlassCard>
        </div>
    );
};
