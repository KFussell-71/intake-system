import { useState, useCallback } from 'react';
import { IntakeFormData } from '../types/intake';

const initialFormData: IntakeFormData = {
    clientName: '',
    phone: '',
    email: '',
    address: '',
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
    employmentType: [],
};

export function useIntakeForm() {
    const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(0);

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

    return {
        formData,
        setFormData,
        currentStep,
        setCurrentStep,
        handleInputChange,
        nextStep,
        prevStep,
    };
}
