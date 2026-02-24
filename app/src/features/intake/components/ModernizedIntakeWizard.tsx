'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { GlassCard } from '@/components/ui/GlassCard';
import { ArrowLeft, ArrowRight, Save, Sidebar, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useIntake } from '../hooks/useIntake';
import { useIntakeRules } from '../hooks/useIntakeRules';

// Dynamic imports for wizard sections
const ModernizedIntakeStepIdentity = dynamic(() => import('./ModernizedIntakeStepIdentity').then(mod => mod.ModernizedIntakeStepIdentity), {
    loading: () => <div className="p-8 text-center animate-pulse">Loading Identity Section...</div>
});
const ModernizedMedicalSection = dynamic(() => import('./ModernizedMedicalSection').then(mod => mod.ModernizedMedicalSection), {
    loading: () => <div className="p-8 text-center animate-pulse">Loading Medical Section...</div>
});
const ModernizedEmploymentSection = dynamic(() => import('./ModernizedEmploymentSection').then(mod => mod.ModernizedEmploymentSection), {
    loading: () => <div className="p-8 text-center animate-pulse">Loading Employment Section...</div>
});
const ModernizedBarriersSection = dynamic(() => import('./ModernizedBarriersSection').then(mod => mod.ModernizedBarriersSection), {
    loading: () => <div className="p-8 text-center animate-pulse">Loading Barriers Section...</div>
});
const ModernizedObservationsSection = dynamic(() => import('./ModernizedObservationsSection').then(mod => mod.ModernizedObservationsSection), {
    loading: () => <div className="p-8 text-center animate-pulse">Loading Observations Section...</div>
});
const ModernizedConsentSection = dynamic(() => import('./ModernizedConsentSection').then(mod => mod.ModernizedConsentSection), {
    loading: () => <div className="p-8 text-center animate-pulse">Loading Consent Section...</div>
});
const IntakeStepReview = dynamic(() => import('./IntakeStepReview').then(mod => mod.IntakeStepReview), {
    loading: () => <div className="p-8 text-center animate-pulse">Loading Review Section...</div>
});
const IntakeDashboard = dynamic(() => import('./IntakeDashboard').then(mod => mod.IntakeDashboard), {
    loading: () => <div className="p-8 text-center animate-pulse">Loading Dashboard...</div>
});
const IntakeTaskSidebar = dynamic(() => import('./IntakeTaskSidebar').then(mod => mod.IntakeTaskSidebar));
const AuditHistoryModal = dynamic(() => import('./AuditHistoryModal').then(mod => mod.AuditHistoryModal));
const ValidationChecklistSidebar = dynamic(() => import('./ValidationChecklistSidebar').then(mod => mod.ValidationChecklistSidebar));

interface Props {
    intakeId: string;
}

type Step = 'dashboard' | 'identity' | 'medical' | 'employment' | 'barriers' | 'observations' | 'consent' | 'review';

const ALL_STEPS: Step[] = ['identity', 'medical', 'employment', 'barriers', 'observations', 'consent', 'review'];

export const ModernizedIntakeWizard: React.FC<Props> = ({ intakeId }) => {
    const router = useRouter();
    // Default to 'dashboard' for non-linear flow
    const [step, setStep] = useState<Step>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuditOpen, setIsAuditOpen] = useState(false);

    // Global State for Rules
    const { intake, loading } = useIntake(intakeId);
    const { hiddenSteps } = useIntakeRules(intake?.data || null);

    // Compute Visible Steps
    const visibleSteps = ALL_STEPS.filter(s => !hiddenSteps.has(s));

    // Effect: If current step becomes hidden, move to dashboard
    useEffect(() => {
        if (step !== 'dashboard' && hiddenSteps.has(step)) {
            setStep('dashboard');
        }
    }, [hiddenSteps, step]);


    const renderStep = () => {
        if (loading) return <div className="p-8 text-center animate-pulse">Loading Intake Context...</div>;

        switch (step) {
            case 'dashboard':
                return <IntakeDashboard intakeId={intakeId} onNavigate={(s) => setStep(s as Step)} />;
            case 'identity':
                return <ModernizedIntakeStepIdentity intakeId={intakeId} onComplete={() => setStep('dashboard')} />;
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
            case 'review':
                return <IntakeStepReview
                    formData={(intake?.data || {}) as any}
                    onChange={() => { }}
                    setFormData={() => { }}
                    intakeId={intakeId}
                    clientId={intake?.client_id}
                    isReadOnly={false}
                />;
            default:
                return null;
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 'dashboard': return 'Dashboard';
            case 'identity': return 'Client Identity';
            case 'medical': return 'Medical & Psychosocial';
            case 'employment': return 'Employment & Vocational';
            case 'barriers': return 'Barriers to Employment';
            case 'observations': return 'Clinical Observations';
            case 'consent': return 'Release of Information';
            case 'review': return 'Review & Finalize';
        }
    };

    const handleNext = () => {
        const currentIndex = visibleSteps.indexOf(step as any);
        if (currentIndex < visibleSteps.length - 1) {
            setStep(visibleSteps[currentIndex + 1]);
        } else {
            setStep('dashboard');
        }
    };

    const handleBack = () => {
        const currentIndex = visibleSteps.indexOf(step as any);
        if (currentIndex > 0) {
            setStep(visibleSteps[currentIndex - 1]);
        } else {
            setStep('dashboard');
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-6 relative">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => step === 'dashboard' ? router.back() : setStep('dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> {step === 'dashboard' ? 'Back' : 'Dashboard'}
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

            {/* Stepper - Only show if NOT dashboard */}
            {step !== 'dashboard' && (
                <div className="flex gap-2 mb-8">
                    {visibleSteps.map((s, idx) => (
                        <button
                            key={s}
                            onClick={() => setStep(s)}
                            className={`flex-1 h-1.5 rounded-full transition-all ${s === step ? 'bg-primary scale-100' :
                                (visibleSteps.indexOf(step as any) > idx) ? 'bg-primary/40' : 'bg-slate-200 dark:bg-slate-800'
                                }`}
                            title={s}
                        />
                    ))}
                </div>
            )}

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-start">
                <div className="min-h-[500px] animate-in slide-in-from-bottom-4 duration-500">
                    {renderStep()}
                </div>

                {step !== 'dashboard' && (
                    <div className="hidden lg:block">
                        <ValidationChecklistSidebar formData={intake?.data || {}} />
                    </div>
                )}
            </div>

            {/* Footer Navigation - Hide on Dashboard */}
            {step !== 'dashboard' && (
                <GlassCard className="p-4 flex justify-between items-center sticky bottom-4 z-10 border-t border-white/20">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> {visibleSteps.indexOf(step as any) === 0 ? 'Dashboard' : 'Previous'}
                    </Button>

                    <div className="flex gap-2">
                        {step !== 'consent' ? (
                            <Button onClick={handleNext}>
                                Next <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={() => setStep('dashboard')}>
                                Finish & Review <Save className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </GlassCard>
            )}

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
