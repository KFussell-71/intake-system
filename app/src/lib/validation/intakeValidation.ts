import { z } from 'zod';

export type IntakeSection = 'medical' | 'employment' | 'barriers' | 'observations' | 'consent';

// --- Schemas ---

export const EmploymentSchema = z.object({
    // Vocational Goals
    employmentGoals: z.string().optional(),
    educationGoals: z.string().optional(),
    housingNeeds: z.string().optional(),

    // Vocational History
    educationLevel: z.string().optional(),
    employmentType: z.array(z.string()).optional(),
    desiredJobTitles: z.string().optional(),
    targetPay: z.string().optional(),
    workExperienceSummary: z.string().optional(),
    transferableSkills: z.array(z.string()).optional(),
    transferableSkillsOther: z.string().optional(),
    industryPreferences: z.array(z.string()).optional(),
    industryOther: z.string().optional(),

    // Readiness
    resumeComplete: z.boolean().optional(),
    interviewSkills: z.boolean().optional(),
    jobSearchAssistance: z.boolean().optional(),
    transportationAssistance: z.boolean().optional(),
    childcareAssistance: z.boolean().optional(),
    housingAssistance: z.boolean().optional(),

    // Placement
    placementDate: z.string().optional(),
    companyName: z.string().optional(),
    jobTitle: z.string().optional(),
    wage: z.string().optional(),
    hoursPerWeek: z.string().optional(),
    supervisorName: z.string().optional(),
    supervisorPhone: z.string().optional(),
    probationEnds: z.string().optional(),
    benefits: z.string().optional(),
    transportationType: z.string().optional(), // 'bus' | 'car' | 'other' | ''
    commuteTime: z.string().optional(),

    // Curriculum
    class1Date: z.string().optional(),
    class2Date: z.string().optional(),
    class3Date: z.string().optional(),
    class4Date: z.string().optional(),
    masterAppComplete: z.boolean().optional(),
    jobSearchCommitmentCount: z.string().optional(),
    jobSearchCommitments: z.array(z.string()).optional(),
    ispGoals: z.array(z.object({
        goal: z.string(),
        actionSteps: z.string(),
        responsibleParty: z.string(), // 'Participant' | 'Case Manager' | 'Both' | ''
        targetDate: z.string()
    })).optional(),

    // Status
    sectionStatus: z.enum(['not_started', 'in_progress', 'complete']).optional()
});

export const BarriersSchema = z.object({
    barrierId: z.number(),
    source: z.enum(['client', 'counselor', 'system']),
    notes: z.string().optional(),
    active: z.boolean().optional(),
    // Status
    sectionStatus: z.enum(['not_started', 'in_progress', 'complete']).optional()
});

export const ObservationSchema = z.object({
    domain: z.string(),
    value: z.string().min(1, "Observation cannot be empty"),
    source: z.enum(['client', 'counselor', 'document']),
    confidence: z.string().optional(),
    // Status
    sectionStatus: z.enum(['not_started', 'in_progress', 'complete']).optional()
});

export const ConsentSchema = z.object({
    documentId: z.string().uuid(),
    signatureData: z.string().min(1, "Signature is required"),
    agreed: z.boolean().refine(val => val === true, "Must agree to terms"),
    // Status
    sectionStatus: z.enum(['not_started', 'in_progress', 'complete']).optional()
});

export const MedicalSchema = z.object({
    // Clinical Evals
    medicalEvalNeeded: z.boolean().optional(),
    psychEvalNeeded: z.boolean().optional(),

    // General Health
    medicalConditionCurrent: z.boolean().optional(),
    medicalConditionDescription: z.string().optional(),
    medicalPriorHistory: z.string().optional(),
    medicalMedsCurrent: z.boolean().optional(),
    medicalMedsDetails: z.string().optional(),
    primaryCarePhysician: z.string().optional(),
    primaryCarePhysicianContact: z.string().optional(),
    medicalComments: z.string().optional(),
    medicalEmploymentImpact: z.string().optional(),

    // Mental Health
    mhHistory: z.boolean().optional(),
    mhHistoryDetails: z.string().optional(),
    mhPriorCounseling: z.boolean().optional(),
    mhPriorCounselingDetails: z.string().optional(),
    mhPriorCounselingDates: z.string().optional(),
    mhPriorDiagnosis: z.boolean().optional(),
    mhPriorDiagnosisDetails: z.string().optional(),
    mhPriorHelpfulActivities: z.string().optional(),
    mhPriorMeds: z.boolean().optional(),
    mhPriorMedsDetails: z.string().optional(),

    // Substance Use
    tobaccoUse: z.boolean().optional(),
    tobaccoDuration: z.string().optional(),
    tobaccoQuitInterest: z.string().optional(),
    tobaccoProducts: z.array(z.string()).optional(),
    tobaccoOther: z.string().optional(),

    alcoholHistory: z.boolean().optional(),
    alcoholCurrent: z.boolean().optional(),
    alcoholFrequency: z.string().optional(),
    alcoholQuitInterest: z.string().optional(),
    alcoholProducts: z.array(z.string()).optional(),
    alcoholOther: z.string().optional(),
    alcoholPriorTx: z.boolean().optional(),
    alcoholPriorTxDetails: z.string().optional(),
    alcoholPriorTxDuration: z.string().optional(),

    drugHistory: z.boolean().optional(),
    drugCurrent: z.boolean().optional(),
    drugFrequency: z.string().optional(),
    drugQuitInterest: z.string().optional(),
    drugProducts: z.array(z.string()).optional(),
    drugOther: z.string().optional(),
    drugPriorTx: z.boolean().optional(),
    drugPriorTxDetails: z.string().optional(),

    substanceComments: z.string().optional(),
    substanceEmploymentImpact: z.string().optional(),

    // Status
    sectionStatus: z.enum(['not_started', 'in_progress', 'complete']).optional()
}).superRefine((data, ctx) => {
    // Conditional Validation for 'complete' status could go here
    // For now, we enforce data integrity (e.g. if you say true, provide details if provided)

    if (data.medicalConditionCurrent === true && data.medicalConditionDescription === "") {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Description is required when current condition is reported.",
            path: ["medicalConditionDescription"]
        });
    }

    if (data.medicalMedsCurrent === true && data.medicalMedsDetails === "") {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Medication details are required when meds are current.",
            path: ["medicalMedsDetails"]
        });
    }
});

// --- Validator Function ---

export function validateSection(section: IntakeSection, payload: any) {
    let schema;
    switch (section) {
        case 'medical':
            schema = MedicalSchema;
            break;
        case 'employment':
            schema = EmploymentSchema;
            break;
        case 'barriers':
            schema = BarriersSchema;
            break;
        case 'observations':
            schema = ObservationSchema;
            break;
        case 'consent':
            schema = ConsentSchema;
            break;
        // Add others as we implement
        default:
            return { success: true }; // Skip if no schema yet
    }

    const result = schema.safeParse(payload);
    if (!result.success) {
        // Format errors
        const errorMsg = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
        return { success: false, error: errorMsg };
    }

    return { success: true, data: result.data };
}
