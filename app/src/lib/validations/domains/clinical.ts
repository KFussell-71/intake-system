import { z } from 'zod';

export const clinicalSchema = z.object({
    // General
    counselorObservations: z.string().optional().or(z.literal('')),
    clinicalRationale: z.string().optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),

    // Appearance
    appearanceClothing: z.array(z.string()).default([]),
    appearanceHygiene: z.array(z.string()).default([]),
    generalBehavior: z.array(z.string()).default([]),
    appearanceOther: z.string().optional().or(z.literal('')),
    clientMood: z.array(z.string()).default([]),
    clientMoodOther: z.string().optional().or(z.literal('')),

    // Deep History
    presentingIssueDescription: z.string().optional().or(z.literal('')),
    presentingIssueDuration: z.string().optional().or(z.literal('')),
    presentingIssueImmediateNeed: z.string().optional().or(z.literal('')),
    presentingIssueSafetyConcerns: z.string().optional().or(z.literal('')),
    presentingIssueGoals: z.string().optional().or(z.literal('')),

    personalResources: z.array(z.string()).default([]),
    personalResourcesOther: z.string().optional().or(z.literal('')),
    supportNetwork: z.array(z.string()).default([]),
    supportNetworkOther: z.string().optional().or(z.literal('')),
    supportNetworkComments: z.string().optional().or(z.literal('')),

    familyMakeupGrowingUp: z.string().optional().or(z.literal('')),
    familySize: z.string().optional().or(z.literal('')),
    familyAttitude: z.string().optional().or(z.literal('')),
    culturalValuesGrowingUp: z.string().optional().or(z.literal('')),
    culturalValuesCurrent: z.string().optional().or(z.literal('')),

    // Legal
    financialIssues: z.boolean().default(false),
    financialIssuesDescription: z.string().optional().or(z.literal('')),
    legalIssues: z.boolean().default(false),
    legalIssuesDescription: z.string().optional().or(z.literal('')),
    historyOfAbuse: z.string().optional().or(z.literal('')),
    abuseTypes: z.array(z.string()).default([]),
    abuseOther: z.string().optional().or(z.literal('')),

    // Summaries
    keyStrengths: z.string().optional().or(z.literal('')),
    motivationFactors: z.string().optional().or(z.literal('')),
    readinessScale: z.number().nullable().optional(),
    barriers: z.array(z.string()).default([]),
    barriersOther: z.string().optional().or(z.literal('')),
    supportServices: z.array(z.string()).default([]),
    supportServicesOther: z.string().optional().or(z.literal('')),
    assessmentSummary: z.string().optional().or(z.literal('')),

    // Reviews
    targetReviewDate: z.string().optional().or(z.literal('')),
    referralReviewDate: z.string().optional().or(z.literal('')),
    referralNotes: z.string().optional().or(z.literal('')),
    authReviewDate: z.string().optional().or(z.literal('')),
    authNotes: z.string().optional().or(z.literal('')),
    workHistoryReviewDate: z.string().optional().or(z.literal('')),
    workHistoryNotes: z.string().optional().or(z.literal('')),
    resumeUpdateDate: z.string().optional().or(z.literal('')),
    resumeUpdateNotes: z.string().optional().or(z.literal('')),
    mockInterviewDate: z.string().optional().or(z.literal('')),
    mockInterviewNotes: z.string().optional().or(z.literal('')),
    networkingDate: z.string().optional().or(z.literal('')),
    networkingNotes: z.string().optional().or(z.literal('')),
    checkInDay: z.string().optional().or(z.literal('')),
    checkInTime: z.string().optional().or(z.literal('')),
    checkInNotes: z.string().optional().or(z.literal('')),
});

export const clinicalSubmissionSchema = clinicalSchema.extend({
    // VRC Requirement: Rationale must be provided
    clinicalRationale: z.string().min(10, "Clinical rationale is required for submission"),
});
