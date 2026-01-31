import { z } from 'zod';

export const intakeSchema = z.object({
    clientName: z.string().min(2, "Client name must be at least 2 characters"),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal('')),
    address: z.string().optional(),
    ssnLastFour: z.string().length(4, "SSN last 4 must be exactly 4 digits").regex(/^\d{4}$/, "Must be digits only"),
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional().or(z.literal('')),
    employmentGoals: z.string().optional(),
    educationGoals: z.string().optional(),
    housingNeeds: z.string().optional(),
    // Employment Prep Curriculum
    class1Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    class2Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    class3Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    class4Date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    masterAppComplete: z.boolean().default(false),
    // Enhanced Placement Details
    placementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    companyName: z.string().optional(),
    jobTitle: z.string().optional(),
    wage: z.string().optional(),
    hoursPerWeek: z.string().optional(),
    supervisorName: z.string().optional(),
    supervisorPhone: z.string().optional(),
    probationEnds: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    benefits: z.string().optional(),
    transportationType: z.enum(['bus', 'car', 'other']).optional().or(z.literal('')),
    commuteTime: z.string().optional(),
    // Supportive Services
    resumeComplete: z.boolean().default(false),
    interviewSkills: z.boolean().default(false),
    jobSearchAssistance: z.boolean().default(false),
    transportationAssistance: z.boolean().default(false),
    childcareAssistance: z.boolean().default(false),
    housingAssistance: z.boolean().default(false),
    referralSource: z.string().optional(),
    referralContact: z.string().optional(),
    medicalEvalNeeded: z.boolean().default(false),
    psychEvalNeeded: z.boolean().default(false),
    medicalPsychNotes: z.string().optional(),
    consentToRelease: z.boolean().refine(val => val === true, {
        message: "Consent to release is required for production compliance"
    }),
    notes: z.string().optional(),
    transferableSkills: z.array(z.string()).default([]),
    transferableSkillsOther: z.string().optional(),
    jobSearchCommitmentCount: z.string().optional(),
    jobSearchCommitments: z.array(z.string()).default([]),
    desiredJobTitles: z.string().optional(),
    workExperienceSummary: z.string().optional(),
    preferredContactMethods: z.array(z.string()).default([]),
    targetReviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    ispGoals: z.array(z.object({
        goal: z.string(),
        actionSteps: z.string(),
        responsibleParty: z.enum(['Participant', 'Case Manager', 'Both', '']),
        targetDate: z.string()
    })).default([]),
});

export type IntakeFormValues = z.infer<typeof intakeSchema>;
