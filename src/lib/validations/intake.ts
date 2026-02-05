import { z } from 'zod';

// 1. BASE SCHEMA: All possible fields, mostly optional to support non-linear entry
const baseIntakeSchema = z.object({
    clientName: z.string().min(1, "Name is required").default("TBD"),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
    ssnLastFour: z.string().optional().or(z.literal('')),
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().or(z.literal('')),
    completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().or(z.literal('')),

    // Clinical Reasoning (Finding #2)
    counselorRationale: z.string().optional().or(z.literal('')),
    editComment: z.string().optional().or(z.literal('')), // Finding #6

    employmentGoals: z.string().optional().or(z.literal('')),
    educationGoals: z.string().optional().or(z.literal('')),
    housingNeeds: z.string().optional().or(z.literal('')),

    // Employment Prep Curriculum
    class1Date: z.string().optional().or(z.literal('')),
    class2Date: z.string().optional().or(z.literal('')),
    class3Date: z.string().optional().or(z.literal('')),
    class4Date: z.string().optional().or(z.literal('')),
    masterAppComplete: z.boolean().default(false),

    // Enhanced Placement Details
    placementDate: z.string().optional().or(z.literal('')),
    companyName: z.string().optional().or(z.literal('')),
    jobTitle: z.string().optional().or(z.literal('')),
    wage: z.string().optional().or(z.literal('')),
    hoursPerWeek: z.string().optional().or(z.literal('')),
    supervisorName: z.string().optional().or(z.literal('')),
    supervisorPhone: z.string().optional().or(z.literal('')),
    probationEnds: z.string().optional().or(z.literal('')),
    benefits: z.string().optional().or(z.literal('')),
    transportationType: z.enum(['bus', 'car', 'other', '']).optional().or(z.literal('')),
    commuteTime: z.string().optional().or(z.literal('')),

    // Supportive Services
    resumeComplete: z.boolean().default(false),
    interviewSkills: z.boolean().default(false),
    jobSearchAssistance: z.boolean().default(false),
    transportationAssistance: z.boolean().default(false),
    childcareAssistance: z.boolean().default(false),
    housingAssistance: z.boolean().default(false),

    referralSource: z.string().optional().or(z.literal('')),
    referralContact: z.string().optional().or(z.literal('')),
    medicalEvalNeeded: z.boolean().default(false),
    psychEvalNeeded: z.boolean().default(false),
    medicalPsychNotes: z.string().optional().or(z.literal('')),

    // Finding #3: Consent - In a real system this would be more complex, 
    // but here we ensure it's at least explicitly handled.
    consentToRelease: z.boolean().default(false),

    notes: z.string().optional().or(z.literal('')),
    transferableSkills: z.array(z.string()).default([]),
    transferableSkillsOther: z.string().optional().or(z.literal('')),
    jobSearchCommitmentCount: z.string().optional().or(z.literal('')),
    jobSearchCommitments: z.array(z.string()).default([]),
    desiredJobTitles: z.string().optional().or(z.literal('')),
    workExperienceSummary: z.string().optional().or(z.literal('')),
    preferredContactMethods: z.array(z.string()).default([]),
    targetReviewDate: z.string().optional().or(z.literal('')),

    ispGoals: z.array(z.object({
        goal: z.string(),
        actionSteps: z.string(),
        responsibleParty: z.enum(['Participant', 'Case Manager', 'Both', '']),
        targetDate: z.string(),
        counselorRationale: z.string().optional().or(z.literal('')) // Clinical reasoning per goal
    })).default([]),
});

// 2. DRAFT SCHEMA: Very permissive to support field saving (Finding #1)
export const draftIntakeSchema = baseIntakeSchema;

// 3. FINAL SCHEMA: Strict requirements for DOR submission (Finding #1)
export const finalIntakeSchema = baseIntakeSchema.extend({
    clientName: z.string().min(2, "Formal name required for submission"),
    ssnLastFour: z.string().length(4, "SSN must be 4 digits").regex(/^\d{4}$/),
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Report date required"),
    consentToRelease: z.boolean().refine(val => val === true, {
        message: "Consent to release is required for final submission"
    }),
    // Rationale is mandatory for final submission (Audit Defense)
    counselorRationale: z.string().min(10, "A detailed clinical rationale is required for submission"),
});

// For backward compatibility while refactoring
export const intakeSchema = finalIntakeSchema;

export type IntakeFormValues = z.infer<typeof intakeSchema>;
