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
    counselorObservations: '',
    clinicalRationale: '',
    eligibilityDetermination: 'pending',

    // Performance & Audit tracking
    sessionStartedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
    edit_comment: '',
};

export function useIntakeForm() {
    // Lazy initialization to load draft if exists
    const [formData, setFormData] = useState<IntakeFormData>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return { ...initialFormData, ...JSON.parse(saved) };
                } catch (e) {
                    console.error('Failed to parse draft', e);
                }
            }
        }
        return initialFormData;
    });

    const [currentStep, setCurrentStep] = useState(0);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Auto-Save Effect (Debounced 1s)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
                setLastSaved(new Date());
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [formData]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    const nextStep = useCallback(() => setCurrentStep(prev => Math.min(prev + 1, 5)), []);
    const prevStep = useCallback(() => setCurrentStep(prev => Math.max(prev - 1, 0)), []);

    const clearDraft = useCallback(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
        setFormData(initialFormData);
        setCurrentStep(0);
    }, []);

    return {
        formData,
        setFormData,
        currentStep,
        setCurrentStep,
        handleInputChange,
        nextStep,
        prevStep,
        lastSaved,
        clearDraft
    };
}
