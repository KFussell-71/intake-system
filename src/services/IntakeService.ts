import { clientRepository, ClientRepository } from '../repositories/ClientRepository';
import { supabase } from '@/lib/supabase/client';

export interface IntakeAssessment {
    id?: string;
    intake_id: string;
    counselor_id?: string;
    verified_barriers: string[];
    clinical_narrative: string;
    recommended_priority_level: number;
    eligibility_status: 'pending' | 'eligible' | 'ineligible';
    eligibility_rationale: string;
    verification_evidence?: Record<string, any>; // Golden Thread
    is_locked?: boolean;
    finalized_at?: string;
    ai_discrepancy_notes?: string;
    ai_risk_score?: number;
    updated_at?: string;
}

export interface SupervisionNote {
    id: string;
    intake_id: string;
    supervisor_id: string;
    note_type: 'approval' | 'rejection' | 'correction_request' | 'flag';
    content: string;
    required_actions: string[];
    created_at: string;
}

export class IntakeService {
    constructor(private readonly repo: ClientRepository = clientRepository) { }

    async submitNewIntake(data: any) {
        // Business logic: Any transformations or validation before saving
        return await this.repo.createClientWithIntakeRPC(data);
    }

    async getIntakeAssessment(intakeId: string) {
        const { data, error } = await supabase
            .from('intake_assessments')
            .select('*')
            .eq('intake_id', intakeId)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore 406 Not Found
            console.error('Error fetching assessment:', error);
            throw error;
        }

        return data as IntakeAssessment | null;
    }

    async saveAssessment(assessment: Partial<IntakeAssessment>) {
        if (!assessment.intake_id) throw new Error("Intake ID required");

        // Upsert based on intake_id constraint (assuming logical 1:1)
        // Note: Our schema PK is ID, but application logic treats it 1:1
        // We first check if one exists

        const existing = await this.getIntakeAssessment(assessment.intake_id);

        if (existing) {
            // Check if locked
            if (existing.is_locked) {
                throw new Error("Assessment is locked and cannot be modified.");
            }

            const { data, error } = await supabase
                .from('intake_assessments')
                .update(assessment)
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        } else {
            const { data, error } = await supabase
                .from('intake_assessments')
                .insert(assessment)
                .select()
                .single();
            if (error) throw error;
            return data;
        }
    }

    // --- Phase 36: Supervision ---

    async addSupervisionNote(note: Omit<SupervisionNote, 'id' | 'created_at'>) {
        const { data, error } = await supabase
            .from('intake_supervision_notes')
            .insert(note)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getSupervisionHistory(intakeId: string) {
        const { data, error } = await supabase
            .from('intake_supervision_notes')
            .select('*')
            .eq('intake_id', intakeId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SupervisionNote[];
    }
}

export const intakeService = new IntakeService();
