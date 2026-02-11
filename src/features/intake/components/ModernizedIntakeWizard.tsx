'use client';

import React, { useState, useEffect } from 'react';
import { ModernizedIntakeStepIdentity } from './ModernizedIntakeStepIdentity';
import { ModernizedMedicalSection } from './ModernizedMedicalSection';
import { ModernizedEmploymentSection } from './ModernizedEmploymentSection';
import { ModernizedBarriersSection } from './ModernizedBarriersSection';
import { ModernizedObservationsSection } from './ModernizedObservationsSection';
import { ModernizedConsentSection } from './ModernizedConsentSection';
import { IntakeTaskSidebar } from './IntakeTaskSidebar';
import { AuditHistoryModal } from './AuditHistoryModal';
import { GlassCard } from '@/components/ui/GlassCard';
import { ArrowLeft, ArrowRight, Save, Sidebar, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useIntake } from '../hooks/useIntake';
import { useIntakeRules } from '../hooks/useIntakeRules';

interface Props {
    intakeId: string;
}

type Step = 'identity' | 'medical' | 'employment' | 'barriers' | 'observations' | 'consent';

const ALL_STEPS: Step[] = ['identity', 'medical', 'employment', 'barriers', 'observations', 'consent'];

export const ModernizedIntakeWizard: React.FC<Props> = ({ intakeId }) => {
    const router = useRouter();
    const [step, setStep] = useState<Step>('identity');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuditOpen, setIsAuditOpen] = useState(false);

    // Global State for Rules
    const { intake, loading } = useIntake(intakeId);
    const { hiddenSteps } = useIntakeRules(intake?.data || null);

    // Compute Visible Steps
    const visibleSteps = ALL_STEPS.filter(s => !hiddenSteps.has(s));

    // Effect: If current step becomes hidden, move to next visible
    useEffect(() => {
        if (hiddenSteps.has(step)) {
            const currentIndex = ALL_STEPS.indexOf(step);
            // Find next visible
            const nextVisible = ALL_STEPS.slice(currentIndex).find(s => !hiddenSteps.has(s));
            if (nextVisible) setStep(nextVisible);
            else {
                // Fallback to previous
                const prevVisible = ALL_STEPS.slice(0, currentIndex).reverse().find(s => !hiddenSteps.has(s));
                if (prevVisible) setStep(prevVisible);
            }
        }
    }, [hiddenSteps, step]);


    const renderStep = () => {
        if (loading) return <div className="p-8 text-center">Loading Intake Context...</div>;

        switch (step) {
            case 'identity':
                return <ModernizedIntakeStepIdentity intakeId={intakeId} onComplete={() => handleNext()} />;
            case 'medical':
                return <ModernizedMedicalSection intakeId={intakeId} />;
            case 'employment':
                return <ModernizedEmploymentSection intakeId={intakeId} />;
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
            case 'medical': return 'Medical & Psychosocial';
            case 'employment': return 'Employment & Vocational';
            case 'barriers': return 'Barriers to Employment';
            case 'observations': return 'Clinical Observations';
            case 'consent': return 'Release of Information';
        }
    };

    const handleNext = () => {
        const currentIndex = visibleSteps.indexOf(step);
        if (currentIndex < visibleSteps.length - 1) {
            setStep(visibleSteps[currentIndex + 1]);
        }
    };

    const handleBack = () => {
        const currentIndex = visibleSteps.indexOf(step);
        if (currentIndex > 0) {
            setStep(visibleSteps[currentIndex - 1]);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 relative">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                        variant={isSidebarOpen ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden md:flex"
                    >
                        <Sidebar className="w-4 h-4 mr-2" /> Tasks
                    </Button>
                    <Button
                        variant={isAuditOpen ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setIsAuditOpen(true)}
                        className="hidden md:flex"
                        title="View Audit History"
                    >
                        <History className="w-4 h-4 mr-2" /> Log
                    </Button>
                </div>

                <div className="text-sm font-medium text-slate-500 flex items-center gap-4">
                    <span>Modernized Intake <span className="mx-2">/</span> <span className="text-primary">{getStepTitle()}</span></span>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex gap-2 mb-8">
                {visibleSteps.map((s, idx) => (
                    <button
                        key={s}
                        onClick={() => setStep(s)}
                        className={`flex-1 h-1.5 rounded-full transition-all ${s === step ? 'bg-primary scale-100' :
                            (visibleSteps.indexOf(step) > idx) ? 'bg-primary/40' : 'bg-slate-200 dark:bg-slate-800'
                            }`}
                        title={s}
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
                    onClick={handleBack}
                    disabled={step === visibleSteps[0]}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                </Button>

                <div className="flex gap-2">
                    {step !== 'consent' ? (
                        <Button onClick={handleNext}>
                            Next <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button onClick={() => router.push(`/intake/${intakeId}`)}>
                            Finish & Review <Save className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                </div>
            </GlassCard>

            {/* Task Sidebar */}
            <IntakeTaskSidebar
                intakeId={intakeId}
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen(false)}
            />

            {/* Audit Modal */}
            <AuditHistoryModal
                intakeId={intakeId}
                isOpen={isAuditOpen}
                onClose={() => setIsAuditOpen(false)}
            />
        </div>
    );
};
