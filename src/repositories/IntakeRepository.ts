import { BaseRepository } from './BaseRepository';
import type { IntakeFormData } from '@/features/intake/intakeTypes';

export interface IntakeAssessment {
    id?: string;
    intake_id: string;
    counselor_id?: string;
    verified_barriers: string[];
    clinical_narrative: string;
    recommended_priority_level: number;
    eligibility_status: 'pending' | 'eligible' | 'ineligible';
    eligibility_rationale: string;
    verification_evidence?: Record<string, any>;
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

export class IntakeRepository extends BaseRepository {
    async saveIntakeProgressAtomic(intakeId: string, data: Partial<IntakeFormData>, summary: string, userId: string, expectedVersion?: number) {
        const { data: result, error } = await this.db.rpc('save_intake_progress_atomic', {
            p_intake_id: intakeId,
            p_data: data,
            p_summary: summary,
            p_user_id: userId,
            p_expected_version: expectedVersion
        });

        if (error) this.handleError(error, 'saveIntakeProgressAtomic');
        return result;
    }

    async upsertAssessmentAtomic(intakeId: string, assessmentData: Partial<IntakeAssessment>, userId: string) {
        const { data, error } = await this.db.rpc('upsert_intake_assessment_atomic', {
            p_intake_id: intakeId,
            p_assessment_data: assessmentData,
            p_user_id: userId
        });

        if (error) this.handleError(error, 'upsertAssessmentAtomic');
        return data;
    }

    async getAssessment(intakeId: string): Promise<IntakeAssessment | null> {
        const { data, error } = await this.db
            .from('intake_assessments')
            .select('*')
            .eq('intake_id', intakeId)
            .maybeSingle();

        if (error) this.handleError(error, 'getAssessment');
        return data;
    }

    async addSupervisionNote(note: Omit<SupervisionNote, 'id' | 'created_at'>) {
        const { data, error } = await this.db
            .from('intake_supervision_notes')
            .insert(note)
            .select()
            .single();

        if (error) this.handleError(error, 'addSupervisionNote');
        return data;
    }

    async getSupervisionHistory(intakeId: string) {
        const { data, error } = await this.db
            .from('intake_supervision_notes')
            .select('*')
            .eq('intake_id', intakeId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'getSupervisionHistory');
        return data;
    }

    // --- Draft Management RPCs (Synchronizing with Controller) ---

    async saveDraft(intakeId: string | null, data: Partial<IntakeFormData>, userId: string, expectedVersion?: number) {
        const { data: result, error } = await this.db.rpc('save_intake_draft', {
            p_intake_id: intakeId,
            p_intake_data: data,
            p_user_id: userId,
            p_expected_version: expectedVersion
        });

        if (error) this.handleError(error, 'saveDraft');
        return result;
    }

    async getLatestUserDraft(userId: string) {
        const { data, error } = await this.db.rpc('get_latest_user_draft', {
            p_user_id: userId
        });

        if (error) this.handleError(error, 'getLatestUserDraft');
        return data;
    }

    async updateIntakeStatus(intakeId: string, status: 'draft' | 'submitted' | 'approved' | 'archived') {
        const { data, error } = await this.db
            .from('intakes')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', intakeId)
            .select()
            .single();

        if (error) this.handleError(error, 'updateIntakeStatus');
        return data;
    }

    async getIntakeById(intakeId: string) {
        const { data, error } = await this.db
            .from('intakes')
            .select('*, version')
            .eq('id', intakeId)
            .single();

        if (error) this.handleError(error, 'getIntakeById');
        return data;
    }
}

export const intakeRepository = new IntakeRepository();
