import { useState, useCallback, useEffect, useRef } from 'react';
import { useOfflineDraft } from '@/hooks/useOfflineDraft';
import { IdentityData, VocationalData, MedicalData, ClinicalData, IntakeMetadata } from '../intakeTypes';
import { saveBackup } from '@/lib/offline/db';
import { toast } from 'sonner';

type CompositeData = IdentityData & VocationalData & MedicalData & ClinicalData & IntakeMetadata & { id?: string };

const STORAGE_KEY = 'intake_draft_v1';

const initialFormData: CompositeData = {
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
    primaryDiagnosisCode: '',
    mobilityStatus: 'independent',
    assessmentSummary: '',

    // Performance & Audit tracking
    sessionStartedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    edit_comment: '',
    status: 'draft'
};

export function useIntakeForm() {
    const [formData, setFormData] = useState<CompositeData>(initialFormData);
    const formDataRef = useRef(formData);

    // Keep ref in sync
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    const [currentStep, setCurrentStep] = useState(0);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [loadingDraft, setLoadingDraft] = useState(true);
    const [draftId, setDraftId] = useState<string | null>(null);
    const [version, setVersion] = useState<number>(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isConflict, setIsConflict] = useState(false);
    const [serverData, setServerData] = useState<any>(null);

    // Feature: Mobile-First Offline Support
    // Automatically saves drafts to IndexedDB when network is redundant or absent
    const { checkDraft } = useOfflineDraft('new_intake_draft', formData, hasUnsavedChanges);

    // SME Fix: Review Mode
    const [isReadOnly, setIsReadOnly] = useState(false);
    const toggleEditMode = useCallback(() => setIsReadOnly(prev => !prev), []);

    // Initial Load - Check for server-side draft OR offline draft
    useEffect(() => {
        let mounted = true;
        const loadDraft = async () => {
            try {
                // 1. Try Offline Draft first (Fastest / Field mode)
                const offlineData = await checkDraft();
                if (offlineData) {
                    console.log('Loaded offline draft');
                    if (mounted) {
                        setFormData((prev: CompositeData) => ({ ...prev, ...offlineData }));
                        setLoadingDraft(false);
                        return; // Prioritize local work if found
                    }
                }

                // 2. Fallback to Server Draft
                const { intakeController } = await import('@/controllers/IntakeController');
                const result = await intakeController.loadLatestDraft();

                if (mounted && result.success && result.data?.found) {
                    console.log('Draft loaded from server', result.data);
                    setFormData((prev: CompositeData) => ({ ...prev, ...result.data.data }));
                    setDraftId(result.data.intake_id);
                    setVersion(result.data.version || 1);
                    setLastSaved(new Date());
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

    // Effect to fetch server data on conflict
    useEffect(() => {
        if (isConflict && draftId) {
            const fetchServer = async () => {
                try {
                    const { intakeController } = await import('@/controllers/IntakeController');
                    const sData = await intakeController.fetchServerData(draftId);
                    setServerData(sData);
                } catch (e) {
                    console.error('Failed to fetch server data for conflict', e);
                }
            };
            fetchServer();
        }
    }, [isConflict, draftId]);

    // Conflict Resolver
    const resolveConflict = useCallback(async (manualResolvedData?: any) => {
        if (!draftId) return;
        try {
            const { intakeController } = await import('@/controllers/IntakeController');

            if (manualResolvedData) {
                setFormData(manualResolvedData);
                // We need to get the NEW version after manual resolution
                const sData = await intakeController.fetchServerData(draftId);
                setVersion(sData?.version || version + 1);
                setIsConflict(false);
                setServerData(null);
                setHasUnsavedChanges(true); // Allow auto-save to try again with new version
                return;
            }

            const result = await intakeController.loadLatestDraft();
            if (result.success && result.data?.found) {
                setVersion(result.data.version);
                setIsConflict(false);
                setServerData(null);
            }
        } catch (e) {
            console.error('Failed to resolve conflict', e);
        }
    }, [draftId, version]);

    // Auto-Save Effect (Debounced 3s for Server)
    useEffect(() => {
        // Skip auto-save during initial load or if in conflict
        if (loadingDraft || isConflict || !hasUnsavedChanges) return;

        const timeoutId = setTimeout(async () => {
            try {
                const { intakeController } = await import('@/controllers/IntakeController');

                const result = await intakeController.saveDraft(
                    formData,
                    draftId || undefined,
                    version
                ) as any;

                if (result.success) {
                    setLastSaved(new Date());
                    setHasUnsavedChanges(false);
                    if (result.data?.intake_id && !draftId) {
                        setDraftId(result.data.intake_id);
                    }
                    if (result.data?.version) {
                        setVersion(result.data.version);
                    }
                } else if (result.error === 'CONFLICT') {
                    setIsConflict(true);
                    console.error('Optimistic locking conflict detected');
                }
            } catch (e) {
                console.error('Auto-save failed', e);
            }
        }, 3000);

        return () => clearTimeout(timeoutId);
    }, [formData, loadingDraft, draftId, version, isConflict, hasUnsavedChanges]);

    // Safety Backup: 5 Minute Interval
    // Persists a distinct snapshot to 'intake-backups' every 5 minutes
    useEffect(() => {
        const backupInterval = setInterval(async () => {
            try {
                const currentData = formDataRef.current;
                // Ensure we have minimal data to warrant a backup (client name or > 5 keys)
                if (currentData.clientName || Object.keys(currentData).length > 20) {
                    await saveBackup('new_intake_draft', currentData);
                    toast.success('Safety Backup Saved', {
                        description: 'A dedicated restore point has been created.',
                        duration: 3000
                    });
                    console.log('[Backup] Safety snapshot created');
                }
            } catch (e) {
                console.error('[Backup] Failed to create safety snapshot', e);
            }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(backupInterval);
    }, []); // Empty dependency array ensures interval persists regardless of renders

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

        setFormData((prev: CompositeData) => ({
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

    const patchFormData = useCallback((patch: Partial<CompositeData>) => {
        setFormData((prev: CompositeData) => ({ ...prev, ...patch }));
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
        toggleEditMode,
        draftId,
        isConflict,
        serverData,
        resolveConflict,
        version
    };
}
