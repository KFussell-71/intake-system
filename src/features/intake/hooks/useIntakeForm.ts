import { useState, useCallback, useEffect } from 'react';
import { IntakeFormData } from '../types/intake';

const STORAGE_KEY = 'intake_draft_v1';

const initialFormData: IntakeFormData = {
    clientName: '',
    phone: '',
    email: '',
    address: '',
    ssnLastFour: '',
    reportDate: new Date().toISOString().split('T')[0],
    completionDate: '',
    employmentGoals: '',
    educationGoals: '',
    housingNeeds: '',
    resumeComplete: false,
    interviewSkills: false,
    jobSearchAssistance: false,
    transportationAssistance: false,
    childcareAssistance: false,
    housingAssistance: false,
    referralSource: '',
    referralContact: '',
    medicalEvalNeeded: false,
    psychEvalNeeded: false,
    medicalPsychNotes: '',
    consentToRelease: false,
    notes: '',
    class1Date: '',
    class2Date: '',
    class3Date: '',
    class4Date: '',
    masterAppComplete: false,
    placementDate: '',
    companyName: '',
    jobTitle: '',
    wage: '',
    hoursPerWeek: '',
    supervisorName: '',
    supervisorPhone: '',
    probationEnds: '',
    benefits: '',
    transportationType: '',
    commuteTime: '',
    referralReviewDate: '',
    referralNotes: '',
    authReviewDate: '',
    authNotes: '',
    workHistoryReviewDate: '',
    workHistoryNotes: '',
    resumeUpdateDate: '',
    resumeUpdateNotes: '',
    mockInterviewDate: '',
    mockInterviewNotes: '',
    networkingDate: '',
    networkingNotes: '',
    checkInDay: '',
    checkInTime: '',
    checkInNotes: '',

    // Barriers & Support Services
    barriers: [],
    barriersOther: '',
    supportServices: [],
    supportServicesOther: '',

    // Strengths & Motivation
    keyStrengths: '',
    motivationFactors: '',
    readinessScale: null,

    // Industry & Job Targets
    industryPreferences: [],
    industryOther: '',
    targetPay: '',
    transferableSkills: [],
    transferableSkillsOther: '',
    employmentType: [],

    // Weekly Job Search Commitment (30 Days)
    jobSearchCommitmentCount: '',
    jobSearchCommitments: [],
    desiredJobTitles: '',
    workExperienceSummary: '',
    preferredContactMethods: [],
    targetReviewDate: '',
    ispGoals: [
        { goal: '', actionSteps: '', responsibleParty: '', targetDate: '' },
        { goal: '', actionSteps: '', responsibleParty: '', targetDate: '' }
    ],
    // Clinical Assessment & Rationale (SME Fix #3)
    prepObservations: '',
    employmentObservations: '',
    placementObservations: '',
    counselorObservations: '',
    clinicalRationale: '',
    clinical_observations: [], // SME Fix: Structured Logic
    // eligibilityDetermination removed

    // Expanded Identity Section
    gender: '',
    race: '',
    birthDate: '',
    employmentStatus: '',
    relationshipStatus: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    paymentMethod: '',
    insuranceCompany: '',
    insurancePolicyNumber: '',
    insuranceGroupNumber: '',
    issueReason: '',
    issueDuration: '',
    issueImmediateNeed: '',
    issuePhysicalDanger: '',
    issueDesiredOutcome: '',

    // --- NEW: Clinical & Psychosocial Assessment Initialization ---
    appearanceClothing: [],
    appearanceHygiene: [],
    generalBehavior: [],
    appearanceOther: '',
    clientMood: [],
    clientMoodOther: '',
    presentingIssueDescription: '',
    presentingIssueDuration: '',
    presentingIssueImmediateNeed: '',
    presentingIssueSafetyConcerns: '',
    presentingIssueGoals: '',
    personalResources: [],
    personalResourcesOther: '',
    supportNetwork: [],
    supportNetworkOther: '',
    supportNetworkComments: '',
    familyMakeupGrowingUp: '',
    familySize: '',
    familyAttitude: '',
    culturalValuesGrowingUp: '',
    culturalValuesCurrent: '',
    educationLevel: '',
    financialIssues: false,
    financialIssuesDescription: '',
    legalIssues: false,
    legalIssuesDescription: '',
    historyOfAbuse: '',
    abuseTypes: [],
    abuseOther: '',
    tobaccoUse: false,
    tobaccoDuration: '',
    tobaccoQuitInterest: '',
    tobaccoProducts: [],
    tobaccoOther: '',
    alcoholHistory: false,
    alcoholCurrent: false,
    alcoholFrequency: '',
    alcoholQuitInterest: '',
    alcoholProducts: [],
    alcoholOther: '',
    alcoholPriorTx: false,
    alcoholPriorTxDetails: '',
    alcoholPriorTxDuration: '',
    drugHistory: false,
    drugCurrent: false,
    drugFrequency: '',
    drugQuitInterest: '',
    drugProducts: [],
    drugOther: '',
    drugPriorTx: false,
    drugPriorTxDetails: '',
    substanceComments: '',
    substanceEmploymentImpact: '',
    mhHistory: false,
    mhHistoryDetails: '',
    mhPriorCounseling: false,
    mhPriorCounselingDetails: '',
    mhPriorCounselingDates: '',
    mhPriorDiagnosis: false,
    mhPriorDiagnosisDetails: '',
    mhPriorHelpfulActivities: '',
    mhPriorMeds: false,
    mhPriorMedsDetails: '',

    // Medical History
    medicalConditionCurrent: false,
    medicalConditionDescription: '',
    medicalPriorHistory: '',
    medicalMedsCurrent: false,
    medicalMedsDetails: '',
    primaryCarePhysician: '',
    primaryCarePhysicianContact: '',
    medicalComments: '',
    medicalEmploymentImpact: '',
    assessmentSummary: '',

    // Performance & Audit tracking
    sessionStartedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    edit_comment: '',
    status: 'draft'
};

export function useIntakeForm() {
    const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(0);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [loadingDraft, setLoadingDraft] = useState(true);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // SME Fix: Review Mode
    const [isReadOnly, setIsReadOnly] = useState(false);
    const toggleEditMode = useCallback(() => setIsReadOnly(prev => !prev), []);

    // Initial Load - Check for server-side draft
    useEffect(() => {
        let mounted = true;
        const loadDraft = async () => {
            // Only load if we haven't already (simple check to avoid overwrite)
            // In a real app we might ask user "Resume draft?"
            try {
                const { intakeController } = await import('@/controllers/IntakeController');
                const result = await intakeController.loadLatestDraft();

                if (mounted && result.success && result.data) {
                    console.log('Draft loaded', result.data);
                    setFormData(prev => ({ ...prev, ...result.data.data }));
                    setDraftId(result.data.intake_id);
                    setLastSaved(new Date(result.data.last_saved));
                }
            } catch (e) {
                console.error('Failed to load draft', e);
            } finally {
                if (mounted) setLoadingDraft(false);
            }
        };

        loadDraft();
        return () => { mounted = false; };
    }, []);

    // Auto-Save Effect (Debounced 3s for Server)
    useEffect(() => {
        // Skip auto-save during initial load
        if (loadingDraft) return;

        const timeoutId = setTimeout(async () => {
            // Only save if dirty? For now just save periodically if changed.
            try {
                const { intakeController } = await import('@/controllers/IntakeController');
                // Don't save empty init state if no changes? 
                // We'll trust the debouncing to only fire on updates.

                const result = await intakeController.saveDraft(formData, draftId || undefined);
                if (result.success) {
                    setLastSaved(new Date());
                    setHasUnsavedChanges(false);
                    if (result.data?.intake_id && !draftId) {
                        setDraftId(result.data.intake_id);
                    }
                }
            } catch (e) {
                console.error('Auto-save failed', e);
            }
        }, 3000); // 3s debounce for server

        return () => clearTimeout(timeoutId);
    }, [formData, loadingDraft, draftId]);

    // Protect against accidental close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = ''; // Required for generic browser alert
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setHasUnsavedChanges(true);
    }, []);

    const nextStep = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, 5)), []);
    const prevStep = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);

    const clearDraft = useCallback(() => {
        setFormData(initialFormData);
        setCurrentStep(0);
        setDraftId(null);
        // Should we delete from server? Maybe just leave as is/archived.
    }, []);

    const patchFormData = useCallback((patch: Partial<IntakeFormData>) => {
        setFormData(prev => ({ ...prev, ...patch }));
        setHasUnsavedChanges(true);
    }, []);

    return {
        formData,
        setFormData,
        patchFormData,
        currentStep,
        setCurrentStep,
        handleInputChange,
        nextStep,
        prevStep,
        lastSaved,
        clearDraft,
        loadingDraft,
        hasUnsavedChanges,
        isReadOnly,
        toggleEditMode
    };
}
