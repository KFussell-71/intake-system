import type { IntakeFormData } from '@/features/intake/intakeTypes';

/**
 * ARCHITECTURE: Domain Persistence Manager
 * 
 * Maps the monolithic IntakeFormData keys to specific domain tables.
 * This is the core of the "Incremental Hydration" pattern.
 */
export class DomainPersistenceManager {
    /**
     * Maps fields to their respective tables and column names.
     */
    private static DOMAIN_MAP: Record<string, { table: string; column: string }> = {
        // Identity / Client Domain
        'clientName': { table: 'clients', column: 'name' },
        'clientDob': { table: 'clients', column: 'dob' },
        'clientPhone': { table: 'clients', column: 'phone' },
        'clientEmail': { table: 'clients', column: 'email' },
        'clientAddress': { table: 'clients', column: 'address' },

        // Vocational / Employment Domain
        'vocationalStatus': { table: 'intakes', column: 'vocational_status' },
        'employmentGoal': { table: 'intakes', column: 'employment_goal' },
        'highestEducation': { table: 'intakes', column: 'education_level' },

        // Medical Domain
        'primaryDiagnosisCode': { table: 'intakes', column: 'diagnosis_code' },
        'medicalHistory': { table: 'intakes', column: 'medical_history' },
        'mobilityStatus': { table: 'intakes', column: 'mobility_status' },

        // Clinical / Evaluation Domain
        'clinicalNarrative': { table: 'intake_assessments', column: 'clinical_narrative' },
        'eligibility_status': { table: 'intake_assessments', column: 'eligibility_status' },
        'recommended_priority_level': { table: 'intake_assessments', column: 'recommended_priority_level' }
    };

    /**
     * Aggregates partial form data into per-table update payloads.
     */
    static getUpdatesByTable(data: Partial<IntakeFormData>): Record<string, Record<string, any>> {
        const updates: Record<string, Record<string, any>> = {};

        for (const [key, value] of Object.entries(data)) {
            const mapping = this.DOMAIN_MAP[key];
            if (mapping) {
                if (!updates[mapping.table]) updates[mapping.table] = {};
                updates[mapping.table][mapping.column] = value;
            } else {
                // Default: Fallback to monolithic 'intakes' table if not specifically mapped
                // but usually we want explicit mapping for compliance.
                if (!updates['intakes']) updates['intakes'] = {};
                if (!updates['intakes']['data']) updates['intakes']['data'] = {};
                updates['intakes']['data'][key] = value;
            }
        }

        return updates;
    }
}
