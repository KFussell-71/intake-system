import { z } from 'zod';

export const medicalSchema = z.object({
    consentToRelease: z.boolean().default(false),
    medicalEvalNeeded: z.boolean().default(false),
    psychEvalNeeded: z.boolean().default(false),

    // General Health
    medicalConditionCurrent: z.boolean().default(false),
    medicalConditionDescription: z.string().optional().or(z.literal('')),
    medicalPriorHistory: z.string().optional().or(z.literal('')),
    medicalMedsCurrent: z.boolean().default(false),
    medicalMedsDetails: z.string().optional().or(z.literal('')),
    primaryCarePhysician: z.string().optional().or(z.literal('')),
    primaryCarePhysicianContact: z.string().optional().or(z.literal('')),
    medicalComments: z.string().optional().or(z.literal('')),
    medicalEmploymentImpact: z.string().optional().or(z.literal('')),

    // Mental Health
    mhHistory: z.boolean().default(false),
    mhHistoryDetails: z.string().optional().or(z.literal('')),
    mhPriorCounseling: z.boolean().default(false),
    mhPriorCounselingDetails: z.string().optional().or(z.literal('')),
    mhPriorCounselingDates: z.string().optional().or(z.literal('')),
    mhPriorDiagnosis: z.boolean().default(false),
    mhPriorDiagnosisDetails: z.string().optional().or(z.literal('')),
    mhPriorHelpfulActivities: z.string().optional().or(z.literal('')),
    mhPriorMeds: z.boolean().default(false),
    mhPriorMedsDetails: z.string().optional().or(z.literal('')),

    // Substance Use
    tobaccoUse: z.boolean().default(false),
    tobaccoDuration: z.string().optional().or(z.literal('')),
    tobaccoQuitInterest: z.string().optional().or(z.literal('')),
    tobaccoProducts: z.array(z.string()).default([]),
    tobaccoOther: z.string().optional().or(z.literal('')),

    alcoholHistory: z.boolean().default(false),
    alcoholCurrent: z.boolean().default(false),
    alcoholFrequency: z.string().optional().or(z.literal('')),
    alcoholQuitInterest: z.string().optional().or(z.literal('')),
    alcoholProducts: z.array(z.string()).default([]),
    alcoholOther: z.string().optional().or(z.literal('')),
    alcoholPriorTx: z.boolean().default(false),
    alcoholPriorTxDetails: z.string().optional().or(z.literal('')),
    alcoholPriorTxDuration: z.string().optional().or(z.literal('')),

    drugHistory: z.boolean().default(false),
    drugCurrent: z.boolean().default(false),
    drugFrequency: z.string().optional().or(z.literal('')),
    drugQuitInterest: z.string().optional().or(z.literal('')),
    drugProducts: z.array(z.string()).default([]),
    drugOther: z.string().optional().or(z.literal('')),
    drugPriorTx: z.boolean().default(false),
    drugPriorTxDetails: z.string().optional().or(z.literal('')),

    substanceComments: z.string().optional().or(z.literal('')),
    substanceEmploymentImpact: z.string().optional().or(z.literal('')),
});

export const medicalSubmissionSchema = medicalSchema.extend({
    consentToRelease: z.boolean().refine(val => val === true, {
        message: "Consent to Release is required for submission"
    }),
});
