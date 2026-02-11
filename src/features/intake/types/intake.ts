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
export interface VocationalGoals {
    employmentGoals: string;
    educationGoals: string;
    housingNeeds: string;
}

export interface VocationalHistory {
    educationLevel: string;
    employmentType: string[];
    desiredJobTitles: string;
    targetPay: string;
    workExperienceSummary: string;
    transferableSkills: string[];
    transferableSkillsOther: string;
    industryPreferences: string[];
    industryOther: string;
}

export interface VocationalReadiness {
    resumeComplete: boolean;
    interviewSkills: boolean;
    jobSearchAssistance: boolean;
    transportationAssistance: boolean;
    childcareAssistance: boolean;
    housingAssistance: boolean;
}

export interface VocationalPlacement {
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
}

export interface VocationalCurriculum {
    class1Date: string;
    class2Date: string;
    class3Date: string;
    class4Date: string;
    masterAppComplete: boolean;
    jobSearchCommitmentCount: string;
    jobSearchCommitments: string[];
    ispGoals: {
        goal: string;
        actionSteps: string;
        responsibleParty: 'Participant' | 'Case Manager' | 'Both' | '';
        targetDate: string;
    }[];
}

export type VocationalData = VocationalGoals & VocationalHistory & VocationalReadiness & VocationalPlacement & VocationalCurriculum & {
    sectionStatus?: 'not_started' | 'in_progress' | 'complete';
};


// 3. MEDICAL & PSYCHOSOCIAL HISTORY
export interface MedicalGeneral {
    consentToRelease: boolean;
    medicalEvalNeeded: boolean;
    psychEvalNeeded: boolean;
    medicalConditionCurrent: boolean;
    medicalConditionDescription: string;
    medicalPriorHistory: string;
    medicalMedsCurrent: boolean;
    medicalMedsDetails: string;
    primaryCarePhysician: string;
    primaryCarePhysicianContact: string;
    medicalComments: string;
    medicalEmploymentImpact: string;
}

export interface MedicalMentalHealth {
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
}

export interface MedicalSubstanceUse {
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

export type MedicalData = MedicalGeneral & MedicalMentalHealth & MedicalSubstanceUse & {
    sectionStatus?: 'not_started' | 'in_progress' | 'complete';
};


// 4. CLINICAL ASSESSMENT (Counselor View)
export interface ClinicalObservations {
    prepObservations: string;
    employmentObservations: string;
    placementObservations: string;

    /** @deprecated Use relational observations table */
    counselorObservations: string;
    /** @deprecated Use relational observations table */
    clinicalRationale: string;
    /** @deprecated Use relational observations table */
    notes: string;

    clinical_observations?: {
        id: string;
        category: string;
        observation: string;
        functional_limitation: string;
        accommodation: string;
    }[];
}

export interface ClinicalAppearance {
    appearanceClothing: string[];
    appearanceHygiene: string[];
    generalBehavior: string[];
    appearanceOther: string;
    clientMood: string[];
    clientMoodOther: string;
}

export interface ClinicalHistory {
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
}

export interface ClinicalAssessment {
    financialIssues: boolean;
    financialIssuesDescription: string;
    legalIssues: boolean;
    legalIssuesDescription: string;
    historyOfAbuse: string;
    abuseTypes: string[];
    abuseOther: string;

    keyStrengths: string;
    motivationFactors: string;
    readinessScale: number | null;

    /** @deprecated Use relational intake_barriers table */
    barriers: string[];
    /** @deprecated Use relational intake_barriers table */
    barriersOther: string;

    supportServices: string[];
    supportServicesOther: string;
    assessmentSummary: string;
}

export interface ClinicalReviews {
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

export type ClinicalData = ClinicalObservations & ClinicalAppearance & ClinicalHistory & ClinicalAssessment & ClinicalReviews;

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
//
// ⚠️ ARCHITECTURE GUARDRAIL ⚠️
// Do NOT add new clinical fields here for JSONB storage.
// - Usage: Legacy compatibility only.
// - New Fields: Must be added to specific Domain tables (e.g. observations, intake_sections)
// - See: modernization_plan.md
export type IntakeFormData = IdentityData & VocationalData & MedicalData & ClinicalData & IntakeMetadata;

export type IntakeStep = 'Identity' | 'Evaluation' | 'Goals' | 'Prep' | 'Placement' | 'Review';
