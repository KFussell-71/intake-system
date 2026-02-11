import { z } from 'zod';

export const identitySchema = z.object({
    // Core Identity
    clientName: z.string().min(1, "Name is required").default(""),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email("Invalid email").optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),

    // Demographics
    ssnLastFour: z.string().optional().or(z.literal('')),
    gender: z.string().optional().or(z.literal('')),
    race: z.string().optional().or(z.literal('')),
    birthDate: z.string().optional().or(z.literal('')),
    employmentStatus: z.string().optional().or(z.literal('')),
    relationshipStatus: z.string().optional().or(z.literal('')),

    // Emergency Contact
    emergencyContactName: z.string().optional().or(z.literal('')),
    emergencyContactPhone: z.string().optional().or(z.literal('')),
    emergencyContactRelation: z.string().optional().or(z.literal('')),
    preferredContactMethods: z.array(z.string()).default([]),

    // Meta
    reportDate: z.string().optional().or(z.literal('')),
    completionDate: z.string().optional().or(z.literal('')),
    referralSource: z.string().optional().or(z.literal('')),
    referralContact: z.string().optional().or(z.literal('')),
    consentToRelease: z.boolean().default(false),
});

// Strict Schema for Submission
export const identitySubmissionSchema = identitySchema.extend({
    clientName: z.string().min(2, "Full name is required"),
    ssnLastFour: z.string().length(4, "SSN (Last 4) is required"),
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Report date is required"),
    consentToRelease: z.literal(true),
});
