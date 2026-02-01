'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { intakeSchema } from '@/lib/validations/intake';
import { User } from '@supabase/supabase-js';
import { z } from 'zod';
import {
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    User as UserIcon,
    Stethoscope,
    Target,
    FileCheck,
    ArrowLeft,
    GraduationCap,
    Briefcase,
    Shield,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { ActionButton } from '@/components/ui/ActionButton';

// Feature imports
import { useIntakeForm } from '@/features/intake/hooks/useIntakeForm';
import { IntakeStepIdentity } from '@/features/intake/components/IntakeStepIdentity';
import { IntakeStepEvaluation } from '@/features/intake/components/IntakeStepEvaluation';
import { IntakeStepGoals } from '@/features/intake/components/IntakeStepGoals';
import { IntakeStepPrep } from '@/features/intake/components/IntakeStepPrep';
import { IntakeStepPlacement } from '@/features/intake/components/IntakeStepPlacement';
import { IntakeStepReview } from '@/features/intake/components/IntakeStepReview';
import { AccessibilityToggle } from '@/components/ui/AccessibilityToggle';
import { intakeController } from '@/controllers/IntakeController';
import { LogicValidationSummary } from '@/features/intake/components/LogicValidationSummary';

const steps = [
    { title: 'Identity', icon: <UserIcon className="w-4 h-4" /> },
    { title: 'Evaluation', icon: <Stethoscope className="w-4 h-4" /> },
    { title: 'Goals', icon: <Target className="w-4 h-4" /> },
    { title: 'Prep', icon: <GraduationCap className="w-4 h-4" /> },
    { title: 'Placement', icon: <Briefcase className="w-4 h-4" /> },
    { title: 'Review', icon: <FileCheck className="w-4 h-4" /> },
];

export default function NewIntakePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const {
        formData,
        currentStep,
        handleInputChange,
        nextStep,
        prevStep
    } = useIntakeForm();

    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    const [complianceResult, setComplianceResult] = useState<{ valid: boolean, score: number, issues: any[] } | null>(null);
    const [checkingCompliance, setCheckingCompliance] = useState(false);

    const runComplianceCheck = async () => {
        setCheckingCompliance(true);
        setError('');
        try {
            const result = await intakeController.runComplianceCheck(formData);
            setComplianceResult(result);
            if (!result.valid) {
                setError('AI Logic Guard found potential contradictions. Please review the summary below.');
            }
        } catch (err) {
            console.error('Compliance Scan Error:', err);
            setError('Failed to run AI Compliance Scan.');
        } finally {
            setCheckingCompliance(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setValidationErrors({});

        try {
            // 1. Zod Validation
            const validatedData = intakeSchema.parse(formData);

            // 2. Database Submission via Controller
            const result = await intakeController.handleIntakeSubmission({
                p_name: validatedData.clientName,
                p_phone: validatedData.phone,
                p_email: validatedData.email,
                p_address: validatedData.address,
                p_ssn_last_four: validatedData.ssnLastFour,
                p_report_date: validatedData.reportDate,
                p_completion_date: validatedData.completionDate || null,
                p_intake_data: {
                    employmentGoals: validatedData.employmentGoals,
                    educationGoals: validatedData.educationGoals,
                    housingNeeds: validatedData.housingNeeds,
                    preEmploymentPrep: {
                        resumeComplete: validatedData.resumeComplete,
                        interviewSkills: validatedData.interviewSkills,
                        jobSearchAssistance: validatedData.jobSearchAssistance,
                    },
                    supportiveServices: {
                        transportation: validatedData.transportationAssistance,
                        childcare: validatedData.childcareAssistance,
                        housing: validatedData.housingAssistance,
                    },
                    referral: {
                        source: validatedData.referralSource,
                        contact: validatedData.referralContact,
                    },
                    medicalPsychEvaluations: {
                        medicalEvalNeeded: validatedData.medicalEvalNeeded,
                        psychEvalNeeded: validatedData.psychEvalNeeded,
                        notes: validatedData.medicalPsychNotes,
                        consentToRelease: validatedData.consentToRelease,
                    },
                    notes: validatedData.notes,
                    // Additional fields from details that the RPC expects
                    barriers: formData.barriers,
                    ispGoals: formData.ispGoals,
                    workExperienceSummary: formData.workExperienceSummary,
                    desiredJobTitles: formData.desiredJobTitles,
                    preferredContactMethods: formData.preferredContactMethods,
                    placement: {
                        companyName: formData.companyName,
                        jobTitle: formData.jobTitle,
                        wage: formData.wage,
                        hoursPerWeek: formData.hoursPerWeek,
                        placementDate: formData.placementDate,
                        probationEnds: formData.probationEnds,
                        supervisorName: formData.supervisorName,
                        supervisorPhone: formData.supervisorPhone,
                        benefits: formData.benefits
                    }
                }
            });

            if (!result.success) throw new Error(result.error);

            setSuccess(true);
            return { success: true, clientId: result.data?.clientId };

        } catch (err) {
            console.error('Error saving intake:', err);
            if (err instanceof z.ZodError) {
                const errors: Record<string, string> = {};
                err.issues.forEach(issue => {
                    const path = issue.path[0];
                    if (path) errors[path.toString()] = issue.message;
                });
                setValidationErrors(errors);
                setError('Please fix the validation errors on the preceding steps.');
            } else {
                setError(err instanceof Error ? err.message : 'Failed to save intake');
            }
            return { success: false };
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark">
                <div className="animate-pulse text-primary font-heading text-xl">Loading Experience...</div>
            </div>
        );
    }

    const renderStep = () => {
        const commonProps = {
            formData,
            onChange: handleInputChange,
            errors: validationErrors
        };

        switch (currentStep) {
            case 0: return <IntakeStepIdentity {...commonProps} />;
            case 1: return <IntakeStepEvaluation {...commonProps} />;
            case 2: return <IntakeStepGoals formData={formData} onChange={handleInputChange} />;
            case 3: return <IntakeStepPrep formData={formData} onChange={handleInputChange} />;
            case 4: return <IntakeStepPlacement formData={formData} onChange={handleInputChange} />;
            case 5: return <IntakeStepReview formData={formData} onChange={handleInputChange} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-start mb-8">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-semibold group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </button>
                    <AccessibilityToggle />
                </div>

                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-2">New Client Intake</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Please follow the steps below to document a new client's information and career readiness plan.
                    </p>
                </div>

                {/* Stepper Header */}
                <div className="flex justify-between items-center mb-12 relative px-4">
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-white/5 -translate-y-1/2 z-0" />
                    {steps.map((step, idx) => {
                        const hasError = (idx === 0 && (validationErrors.clientName || validationErrors.ssnLastFour)) ||
                            (idx === 1 && validationErrors.consentToRelease);

                        return (
                            <div key={idx} className="relative z-10 flex flex-col items-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: idx === currentStep ? 1.2 : 1,
                                        backgroundColor: hasError ? '#ef4444' : (idx <= currentStep ? 'var(--color-primary)' : 'var(--color-surface)'),
                                        color: idx <= currentStep || hasError ? '#fff' : '#64748b'
                                    }}
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-4 ${hasError ? 'border-red-500' : (idx <= currentStep ? 'border-primary' : 'border-slate-100 dark:border-white/5')} transition-colors duration-500`}
                                >
                                    {idx < currentStep && !hasError ? <CheckCircle className="w-5 h-5" /> : step.icon}
                                </motion.div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider mt-3 ${hasError ? 'text-red-500' : (idx === currentStep ? 'text-primary' : 'text-slate-400')}`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {success && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-8 p-6 bg-green-500/10 border border-green-500/30 rounded-3xl text-green-600 dark:text-green-400 font-bold text-center"
                    >
                        ✓ Intake saved successfully! Creating record and returning to dashboard...
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p>Error: {error}</p>
                            {Object.keys(validationErrors).length > 0 && (
                                <p className="text-xs mt-1 font-medium opacity-80">Fields affected: {Object.keys(validationErrors).join(', ')}</p>
                            )}
                        </div>
                    </motion.div>
                )}

                <GlassCard className="overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {renderStep()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="mt-12 flex justify-between items-center border-t border-slate-100 dark:border-white/5 pt-8">
                        <ActionButton
                            variant="secondary"
                            onClick={prevStep}
                            disabled={currentStep === 0 || saving}
                            icon={<ChevronLeft className="w-4 h-4" />}
                        >
                            Previous
                        </ActionButton>

                        <div className="flex gap-4">
                            {currentStep === steps.length - 1 && (
                                <ActionButton
                                    variant="secondary"
                                    onClick={runComplianceCheck}
                                    isLoading={checkingCompliance}
                                    icon={<Shield className="w-4 h-4" />}
                                    className="border-primary text-primary"
                                >
                                    AI Compliance Scan
                                </ActionButton>
                            )}
                            {currentStep < steps.length - 1 ? (
                                <ActionButton
                                    onClick={nextStep}
                                    icon={<ChevronRight className="w-4 h-4" />}
                                    className="bg-accent text-white"
                                >
                                    Continue
                                </ActionButton>
                            ) : (
                                <div className="flex gap-4">
                                    <ActionButton
                                        variant="secondary"
                                        onClick={handleSubmit}
                                        isLoading={saving}
                                        className="border-slate-200"
                                    >
                                        Save Draft
                                    </ActionButton>
                                    <ActionButton
                                        onClick={(e) => {
                                            // Trigger regular submit but then handle navigation differently
                                            const submitBtn = e.currentTarget;
                                            (async () => {
                                                const result = await handleSubmit(e as any);
                                                if (result?.success) {
                                                    router.push(`/reports/${result.clientId}`);
                                                }
                                            })();
                                        }}
                                        isLoading={saving}
                                        icon={<FileCheck className="w-4 h-4" />}
                                        className="bg-primary text-white shadow-xl shadow-primary/20"
                                    >
                                        Submit & Generate Report
                                    </ActionButton>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Logic Summary Integration */}
                    {currentStep === steps.length - 1 && (complianceResult || checkingCompliance) && (
                        <div className="px-8 pb-8">
                            <LogicValidationSummary result={complianceResult} isChecking={checkingCompliance} />

                            {complianceResult && !complianceResult.valid && (
                                <button
                                    onClick={() => setComplianceResult({ ...complianceResult, valid: true })}
                                    className="mt-4 text-[10px] underline text-slate-400 hover:text-primary font-bold transition-colors"
                                >
                                    Override: I have verified these contradictions are actually accurate for this specific case
                                </button>
                            )}
                        </div>
                    )}
                </GlassCard>
            </div>
        </div>
    );
}
