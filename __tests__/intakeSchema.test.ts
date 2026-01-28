import { describe, it, expect } from 'vitest';
import { intakeSchema } from '../src/lib/validations/intake';

describe('intakeSchema', () => {
    it('should validate valid intake data', () => {
        const validData = {
            clientName: 'John Doe',
            reportDate: '2026-01-27',
            consentToRelease: true,
        };

        const result = intakeSchema.safeParse(validData);
        expect(result.success).toBe(true);
    });

    it('should fail if consentToRelease is false', () => {
        const invalidData = {
            clientName: 'John Doe',
            reportDate: '2026-01-27',
            consentToRelease: false,
        };

        const result = intakeSchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });
});
