import { z } from 'zod';
import { identitySchema, identitySubmissionSchema } from './domains/identity';
import { vocationalSchema, vocationalSubmissionSchema } from './domains/vocational';
import { medicalSchema, medicalSubmissionSchema } from './domains/medical';
import { clinicalSchema, clinicalSubmissionSchema } from './domains/clinical';

/**
 * MASTER SCHEMA COMPOSITION
 * Aggregates all domain slices into the full Intake object.
 */

// 1. BASE/DRAFT SCHEMA (Permissive)
export const draftIntakeSchema = identitySchema
    .merge(vocationalSchema)
    .merge(medicalSchema)
    .merge(clinicalSchema)
    .extend({
        // Top-level Metadata
        editComment: z.string().optional(),
    });

// 2. FINAL SUBMISSION SCHEMA (Strict)
export const finalIntakeSchema = identitySubmissionSchema
    .merge(vocationalSubmissionSchema)
    .merge(medicalSubmissionSchema)
    .merge(clinicalSubmissionSchema)
    .extend({
        editComment: z.string().optional(),
    });

// Backward compatibility
export const baseIntakeSchema = draftIntakeSchema;
export const intakeSchema = finalIntakeSchema;
export type IntakeFormValues = z.infer<typeof intakeSchema>;
