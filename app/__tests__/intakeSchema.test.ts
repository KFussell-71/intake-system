import { describe, it, expect } from 'vitest';
import { intakeSchema, draftIntakeSchema } from '../src/lib/validations/intake';

describe('intakeSchema', () => {
    it('should validate valid final submission data', () => {
        const validData = {
            clientName: 'John Doe',
            reportDate: '2026-01-27',
            ssnLastFour: '1234',
            consentToRelease: true,

            // Vocational Requirements
            employmentGoals: 'Obtain full-time employment',

            // Clinical Requirements
            clinicalRationale: 'Client demonstrates improved stability and motivation.',
            // Needs to satisfy other strict requirements if any, but identitySchema only enforces these so far.
        };

        const result = intakeSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('should fail final submission if consentToRelease is false', () => {
        const invalidData = {
            clientName: 'John Doe',
            reportDate: '2026-01-27',
            ssnLastFour: '1234',
            consentToRelease: false,
        };

        const result = intakeSchema.safeParse(invalidData);
        expect(result.success).toBe(false); // Strict schema requires true
    });

    it('should allow consentToRelease=false in Draft Schema', () => {
        const draftData = {
            clientName: 'John Doe',
            // reportDate optional in draft
            consentToRelease: false,
        };
        const result = draftIntakeSchema.safeParse(draftData);
        expect(result.success).toBe(true);
    });
});
