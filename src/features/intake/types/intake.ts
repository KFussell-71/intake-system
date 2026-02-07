/**
 * SME REMEDIATION: Domain Decomposition
 * Splitting the "God Object" into logical domains while maintaining backward compatibility.
 */

// 1. IDENTITY & DEMOGRAPHICS
export interface IdentityData {
    clientName: string;
    phone: string;
    email: string;
    address: string;
    ssnLastFour: string;
    gender: string;
    race: string;
    birthDate: string;
    employmentStatus: string;
    relationshipStatus: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    preferredContactMethods: string[];
    // Basic Intake Meta
    reportDate: string;
    completionDate: string;
    referralSource: string;
    referralContact: string;
}

// 2. VOCATIONAL PROFILE (Employment, Education, Goals)
export interface VocationalData {
    // Goals
    employmentGoals: string;
    educationGoals: string;
    housingNeeds: string;

    // History & Skills
    educationLevel: string;
    employmentType: string[];
    desiredJobTitles: string;
    targetPay: string;
    workExperienceSummary: string;
    transferableSkills: string[];
    transferableSkillsOther: string;
    industryPreferences: string[];
    industryOther: string;

    // Readiness & Barriers
    resumeComplete: boolean;
    interviewSkills: boolean;
    jobSearchAssistance: boolean;
    transportationAssistance: boolean;
    childcareAssistance: boolean;
    housingAssistance: boolean;

    // Placement Details (If applicable)
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

    // Prep Curriculum & Commitments
    class1Date: string;
    class2Date: string;
    class3Date: string;
    class4Date: string;
    masterAppComplete: boolean;

    // Job Search
    jobSearchCommitmentCount: string;
    jobSearchCommitments: string[];

    // ISP (Individual Service Plan)
    ispGoals: {
        goal: string;
        actionSteps: string;
        responsibleParty: 'Participant' | 'Case Manager' | 'Both' | '';
        targetDate: string;
    }[];
}

// 3. MEDICAL & PSYCHOSOCIAL HISTORY
export interface MedicalData {
    // Consent
    consentToRelease: boolean;

    // Clinical Evals
    medicalEvalNeeded: boolean;
    psychEvalNeeded: boolean;

    // General Health
    medicalConditionCurrent: boolean;
    medicalConditionDescription: string;
    medicalPriorHistory: string;
    medicalMedsCurrent: boolean;
    medicalMedsDetails: string;
    primaryCarePhysician: string;
    primaryCarePhysicianContact: string;
    medicalComments: string;
    medicalEmploymentImpact: string;

    // Mental Health
    mhHistory: boolean;
    mhHistoryDetails: string;
    mhPriorCounseling: boolean;
    mhPriorCounselingDetails: string;
    mhPriorCounselingDates: string;
    mhPriorDiagnosis: boolean;
    mhPriorDiagnosisDetails: string;
    mhPriorHelpfulActivities: string;
    mhPriorMeds: boolean;
    mhPriorMedsDetails: string;

    // Substance Use
    tobaccoUse: boolean;
    tobaccoDuration: string;
    tobaccoQuitInterest: string;
    tobaccoProducts: string[];
    tobaccoOther: string;

    alcoholHistory: boolean;
    alcoholCurrent: boolean;
    alcoholFrequency: string;
    alcoholQuitInterest: string;
    alcoholProducts: string[];
    alcoholOther: string;
    alcoholPriorTx: boolean;
    alcoholPriorTxDetails: string;
    alcoholPriorTxDuration: string;

    drugHistory: boolean;
    drugCurrent: boolean;
    drugFrequency: string;
    drugQuitInterest: string;
    drugProducts: string[];
    drugOther: string;
    drugPriorTx: boolean;
    drugPriorTxDetails: string;

    substanceComments: string;
    substanceEmploymentImpact: string;
}

// 4. CLINICAL ASSESSMENT (Counselor View)
export interface ClinicalData {
    // General Observations
    counselorObservations: string;
    clinicalRationale: string;
    notes: string;

    // NEW: Structured Clinical Logic (SME Fix)
    clinical_observations?: {
        id: string;
        category: string;
        observation: string;
        functional_limitation: string;
        accommodation: string;
    }[];

    // Appearance & Behavior
    appearanceClothing: string[];
    appearanceHygiene: string[];
    generalBehavior: string[];
    appearanceOther: string;
    clientMood: string[];
    clientMoodOther: string;

    // Deep History
    presentingIssueDescription: string;
    presentingIssueDuration: string;
    presentingIssueImmediateNeed: string;
    presentingIssueSafetyConcerns: string;
    presentingIssueGoals: string;

    personalResources: string[];
    personalResourcesOther: string;
    supportNetwork: string[];
    supportNetworkOther: string;
    supportNetworkComments: string;

    familyMakeupGrowingUp: string;
    familySize: string;
    familyAttitude: string;
    culturalValuesGrowingUp: string;
    culturalValuesCurrent: string;

    // Legal & Financial
    financialIssues: boolean;
    financialIssuesDescription: string;
    legalIssues: boolean;
    legalIssuesDescription: string;
    historyOfAbuse: string;
    abuseTypes: string[];
    abuseOther: string;

    // Assessment Summary
    keyStrengths: string;
    motivationFactors: string;
    readinessScale: number | null;
    barriers: string[];
    barriersOther: string;
    supportServices: string[];
    supportServicesOther: string;
    assessmentSummary: string;

    // Reviews
    targetReviewDate: string;
    referralReviewDate: string;
    referralNotes: string;
    authReviewDate: string;
    authNotes: string;
    workHistoryReviewDate: string;
    workHistoryNotes: string;
    resumeUpdateDate: string;
    resumeUpdateNotes: string;
    mockInterviewDate: string;
    mockInterviewNotes: string;
    networkingDate: string;
    networkingNotes: string;
    checkInDay: string;
    checkInTime: string;
    checkInNotes: string;
}

// 5. ADMINISTRATIVE & METADATA
export interface IntakeMetadata {
    sessionStartedAt: string;
    lastSavedAt: string;
    edit_comment?: string;
    status: 'draft' | 'submitted' | 'awaiting_review' | 'approved' | 'rejected';

    // NEW: Payment & Issue (Often administrative)
    paymentMethod: string;
    insuranceCompany: string;
    insurancePolicyNumber: string;
    insuranceGroupNumber: string;
    issueReason: string;
    issueDuration: string;
    issueImmediateNeed: string;
    issuePhysicalDanger: string;
    issueDesiredOutcome: string;
    medicalPsychNotes: string; // Often shared
}

// BACKWARD COMPATIBILITY: Re-assemble the God Object
// This ensures existing components don't break immediately
export type IntakeFormData = IdentityData & VocationalData & MedicalData & ClinicalData & IntakeMetadata;

export type IntakeStep = 'Identity' | 'Evaluation' | 'Goals' | 'Prep' | 'Placement' | 'Review';
