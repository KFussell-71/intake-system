import { z } from 'zod';

export const vocationalSchema = z.object({
    // Goals
    employmentGoals: z.string().optional().or(z.literal('')),
    educationGoals: z.string().optional().or(z.literal('')),
    housingNeeds: z.string().optional().or(z.literal('')),

    // History & Skills
    educationLevel: z.string().optional().or(z.literal('')),
    employmentType: z.array(z.string()).default([]),
    desiredJobTitles: z.string().optional().or(z.literal('')),
    targetPay: z.string().optional().or(z.literal('')),
    workExperienceSummary: z.string().optional().or(z.literal('')),
    transferableSkills: z.array(z.string()).default([]),
    transferableSkillsOther: z.string().optional().or(z.literal('')),
    industryPreferences: z.array(z.string()).default([]),
    industryOther: z.string().optional().or(z.literal('')),

    // Readiness
    resumeComplete: z.boolean().default(false),
    interviewSkills: z.boolean().default(false),
    jobSearchAssistance: z.boolean().default(false),
    transportationAssistance: z.boolean().default(false),
    childcareAssistance: z.boolean().default(false),
    housingAssistance: z.boolean().default(false),

    // Placement
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

    // Prep
    class1Date: z.string().optional().or(z.literal('')),
    class2Date: z.string().optional().or(z.literal('')),
    class3Date: z.string().optional().or(z.literal('')),
    class4Date: z.string().optional().or(z.literal('')),
    masterAppComplete: z.boolean().default(false),

    // Job Search
    jobSearchCommitmentCount: z.string().optional().or(z.literal('')),
    jobSearchCommitments: z.array(z.string()).default([]),

    // ISP
    ispGoals: z.array(z.object({
        goal: z.string(),
        actionSteps: z.string(),
        responsibleParty: z.enum(['Participant', 'Case Manager', 'Both', '']),
        targetDate: z.string(),
    })).default([]),
});

export const vocationalSubmissionSchema = vocationalSchema.extend({
    employmentGoals: z.string().min(3, "Employment goals are required"),
});
