export interface IntakeFormData {
    clientName: string;
    phone: string;
    email: string;
    address: string;
    reportDate: string;
    completionDate: string;
    employmentGoals: string;
    educationGoals: string;
    housingNeeds: string;
    resumeComplete: boolean;
    interviewSkills: boolean;
    jobSearchAssistance: boolean;
    transportationAssistance: boolean;
    childcareAssistance: boolean;
    housingAssistance: boolean;
    referralSource: string;
    referralContact: string;
    medicalEvalNeeded: boolean;
    psychEvalNeeded: boolean;
    medicalPsychNotes: string;
    consentToRelease: boolean;
    notes: string;
    class1Date: string;
    class2Date: string;
    class3Date: string;
    class4Date: string;
    masterAppComplete: boolean;
    placementDate: string;
    companyName: string;
    jobTitle: string;
    wage: string;
    hoursPerWeek: string;
    supervisorName: string;
    supervisorPhone: string;
    probationEnds: string;
    benefits: string;
    transportationType: 'bus' | 'car' | 'other' | '';
    commuteTime: string;

    // Document Review & Verification
    referralReviewDate: string;
    referralNotes: string;
    authReviewDate: string;
    authNotes: string;
    workHistoryReviewDate: string;
    workHistoryNotes: string;

    // Preparation & Readiness Tracking
    resumeUpdateDate: string;
    resumeUpdateNotes: string;
    mockInterviewDate: string;
    mockInterviewNotes: string;
    networkingDate: string;
    networkingNotes: string;

    // Weekly Progress Check-Ins
    checkInDay: string;
    checkInTime: string;
    checkInNotes: string;

    // Barriers & Support Services
    barriers: string[];
    barriersOther: string;
    supportServices: string[];
    supportServicesOther: string;

    // Strengths & Motivation
    keyStrengths: string;
    motivationFactors: string;
    readinessScale: number | null; // 1-10

    // Industry & Job Targets
    industryPreferences: string[];
    industryOther: string;
    targetPay: string;
    employmentType: string[];
}

export type IntakeStep = 'Identity' | 'Evaluation' | 'Goals' | 'Prep' | 'Placement' | 'Review';
