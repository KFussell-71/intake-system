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
    AlertCircle,
    Eye
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
import { ReportPreviewModal } from '@/features/intake/components/ReportPreviewModal';
import { ComplianceSidebar } from '@/features/intake/components/ComplianceSidebar';
import { IntakeSidebar } from '@/features/intake/components/IntakeSidebar'; // SME Fix
import { MobileIntakeNav } from '@/features/intake/components/MobileIntakeNav';
import { ReviewModeBanner } from '@/features/intake/components/ReviewModeBanner';

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
    const [intakeId, setIntakeId] = useState<string | null>(null);
    const {
        formData,
        setFormData,
        currentStep,
        setCurrentStep,
        handleInputChange,
        nextStep,
        prevStep,
        lastSaved,
        clearDraft,
        isReadOnly,
        toggleEditMode
    } = useIntakeForm();

    const [error, setError] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [success, setSuccess] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

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

    const handleSaveAndExit = async () => {
        setSaving(true);
        try {
            if (intakeId) {
                await intakeController.saveIntakeProgress(intakeId, formData, "Manual Draft Save");
            } else {
                const result = await intakeController.handleIntakeSubmission({
                    p_name: formData.clientName || 'Draft ' + new Date().toLocaleDateString(),
                    p_phone: formData.phone || '',
                    p_email: formData.email || '',
                    p_address: formData.address || '',
                    p_ssn_last_four: formData.ssnLastFour || '0000',
                    p_report_date: formData.reportDate,
                    p_intake_data: { ...formData, status: 'draft' }
                });
                if (result.success && result.data?.intake_id) {
                    setIntakeId(result.data.intake_id);
                }
            }
            router.push('/dashboard');
        } catch (err) {
            setError('Failed to save draft securely.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setValidationErrors({});

        try {
            const validatedData = intakeSchema.parse(formData);
            const result = await intakeController.handleIntakeSubmission({
                p_name: validatedData.clientName,
                p_phone: validatedData.phone,
                p_email: validatedData.email,
                p_address: validatedData.address,
                p_ssn_last_four: validatedData.ssnLastFour,
                p_report_date: validatedData.reportDate,
                p_completion_date: validatedData.completionDate || null,
                p_intake_data: {
                    ...formData,
                    status: 'submitted'
                }
            });

            if (!result.success) throw new Error(result.error);

            // Upload Signed PDF if exists (Phase 8: Workflow)
            if (result.success && result.data?.client_id && signedPdf && user) {
                try {
                    const { DocumentService } = await import('@/services/DocumentService');
                    await DocumentService.uploadDocument(
                        result.data.client_id,
                        signedPdf,
                        user.id
                    );
                    console.log('Signed packet uploaded successfully');
                } catch (uploadErr) {
                    console.error('Failed to upload signed packet:', uploadErr);
                    // Don't fail the whole submission, but maybe warn?
                    // For now, valid intake is priority.
                }
            }

            clearDraft();
            setSuccess(true);
            return { success: true, clientId: result.data?.client_id };

        } catch (err) {
            console.error('Error saving intake:', err);
            if (err instanceof z.ZodError) {
                const errors: Record<string, string> = {};
                err.issues.forEach(issue => {
                    const path = issue.path[0];
                    if (path) errors[path.toString()] = issue.message;
                });
                setValidationErrors(errors);

                // --- FIX: Validation Navigation ---
                // Find the first step that contains an error and jump to it.
                // Step 0: Identity (clientName, phone, email, etc.)
                // Step 1: Evaluation (consentToRelease, medicalEvalNeeded)
                // Logic map:
                let errorStep = -1;
                const errorKeys = Object.keys(errors);

                // Simple heuristic mapping
                if (errorKeys.some(k => ['clientName', 'phone', 'email', 'ssnLastFour'].includes(k))) errorStep = 0;
                else if (errorKeys.some(k => ['consentToRelease'].includes(k))) errorStep = 1;
                // Add more mappings as needed for other steps

                if (errorStep !== -1) {
                    setCurrentStep(errorStep);
                    setError(`Please fix the errors in the ${steps[errorStep].title} section.`);
                } else {
                    setError('Please fix the validation errors highlighted in red.');
                }
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

    const [signedPdf, setSignedPdf] = useState<File | null>(null);

    const renderStep = () => {
        const commonProps = {
            formData,
            onChange: handleInputChange,
            setFormData, // Added for AI Auto-Fill
            errors: validationErrors,
            isReadOnly // SME Fix: Propagate review mode
        };

        switch (currentStep) {
            case 0: return <IntakeStepIdentity {...commonProps} />;
            case 1: return <IntakeStepEvaluation {...commonProps} />;
            case 2: return <IntakeStepGoals formData={formData} onChange={handleInputChange} />;
            case 3: return <IntakeStepPrep formData={formData} onChange={handleInputChange} />;
            case 4: return <IntakeStepPlacement formData={formData} onChange={handleInputChange} />;
            case 5: return <IntakeStepReview {...commonProps} onFileSelect={setSignedPdf} />;
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-surface-dark py-12 px-6">
            <div className="max-w-7xl mx-auto">
                {/* SME Fix: Review Mode Banner */}
                <ReviewModeBanner
                    isReadOnly={isReadOnly}
                    onToggleEdit={toggleEditMode}
                />

                <div className="flex justify-between items-start mb-8 max-w-3xl mx-auto lg:mx-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-semibold group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </button>
                        {lastSaved && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                                    Last Snapshot Taken {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowPreview(true)}
                            icon={<Eye className="w-4 h-4" />}
                            className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                        >
                            Preview Report
                        </ActionButton>
                        <ActionButton
                            variant="secondary"
                            size="sm"
                            onClick={handleSaveAndExit}
                            className="border-slate-200"
                        >
                            Save & Exit
                        </ActionButton>
                        <AccessibilityToggle />
                        {!isReadOnly && (
                            <ActionButton
                                variant="secondary"
                                size="sm"
                                onClick={toggleEditMode}
                                icon={<Shield className="w-4 h-4" />}
                                className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                            >
                                Supervisor View
                            </ActionButton>
                        )}
                    </div>
                </div>

                <div className="mb-12 max-w-3xl mx-auto lg:mx-0">
                    <h1 className="text-4xl font-bold mb-2">New Client Intake</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Non-linear documentation enabled. Use the sidebar to track mandatory items.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* SME Fix: Quick Jump Sidebar (Desktop) */}
                    <IntakeSidebar
                        currentStep={currentStep}
                        onJump={setCurrentStep}
                        validationErrors={validationErrors}
                    />

                    {/* SME Fix: Bottom Sheet Nav (Mobile) */}
                    <MobileIntakeNav
                        currentStep={currentStep}
                        onJump={setCurrentStep}
                        validationErrors={validationErrors}
                    />

                    <div className="flex-1 max-w-4xl min-w-0">
                        {/* Legacy Stepper (Mobile Only) */}
                        <div className="flex lg:hidden justify-between items-center mb-8 relative px-4 overflow-x-auto pb-4">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-white/5 -translate-y-1/2 z-0" />
                            {steps.map((step, idx) => {
                                const hasError = (idx === 0 && (validationErrors.clientName || validationErrors.ssnLastFour)) ||
                                    (idx === 1 && validationErrors.consentToRelease);

                                return (
                                    <div
                                        key={idx}
                                        className={`relative z-10 flex flex-col items-center cursor-pointer hover:scale-105 active:scale-95 transition-all`}
                                        onClick={() => {
                                            // Allow free navigation
                                            setCurrentStep(idx);
                                        }}
                                    >
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

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-3xl text-red-600 dark:text-red-400 font-bold flex items-center gap-3"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p>Error: {error}</p>
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
                                                onClick={handleSaveAndExit}
                                                className="border-slate-200"
                                            >
                                                Save Draft
                                            </ActionButton>
                                            <ActionButton
                                                onClick={(e) => {
                                                    const dummyEvent = { preventDefault: () => { } } as React.FormEvent;
                                                    handleSubmit(dummyEvent);
                                                }}
                                                isLoading={saving}
                                                icon={<FileCheck className="w-4 h-4" />}
                                                className="bg-primary text-white shadow-xl shadow-primary/20"
                                            >
                                                Submit & Finalize
                                            </ActionButton>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    <ComplianceSidebar formData={formData} />
                </div>
            </div>

            <ReportPreviewModal
                open={showPreview}
                onOpenChange={setShowPreview}
                formData={formData}
                onJumpToStep={(stepIndex) => {
                    setShowPreview(false);
                    setCurrentStep(stepIndex);
                }}
                onSubmit={() => {
                    setShowPreview(false);
                    const dummyEvent = { preventDefault: () => { } } as React.FormEvent;
                    handleSubmit(dummyEvent);
                }}
            />
        </div>
    );
}
