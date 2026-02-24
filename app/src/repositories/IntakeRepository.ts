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

export interface ClientStatement {
    id?: string;
    intake_id: string;
    client_id?: string;
    presenting_issue: string;
    reported_barriers: string[];
    goals_and_objectives: string;
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
    async getAssessment(intakeId: string): Promise<IntakeAssessment | null> {
        const { data, error } = await this.db
            .from('intake_assessments')
            .select('*')
            .eq('intake_id', intakeId)
            .maybeSingle();

        if (error) this.handleError(error, 'getAssessment');
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

    async getIntakeById(intakeId: string) {
        const { data, error } = await this.db
            .from('intakes')
            .select('*, version')
            .eq('id', intakeId)
            .single();

        if (error) this.handleError(error, 'getIntakeById');
        return data;
    }

    async getLatestUserDraft(userId: string) {
        const { data, error } = await this.db
            .from('intakes')
            .select('*')
            .eq('status', 'draft')
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) this.handleError(error, 'getLatestUserDraft');
        return data;
    }

    async upsertAssessmentAtomic(intakeId: string, assessment: Partial<IntakeAssessment>, userId: string) {
        const { data, error } = await this.db
            .from('intake_assessments')
            .upsert({
                ...assessment,
                intake_id: intakeId,
                counselor_id: userId,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) this.handleError(error, 'upsertAssessmentAtomic');
        return data;
    }

    async addSupervisionNote(note: Omit<SupervisionNote, 'id' | 'created_at'>) {
        const { data, error } = await this.db
            .from('intake_supervision_notes')
            .insert({
                ...note,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) this.handleError(error, 'addSupervisionNote');
        return data;
    }

    async getClientStatement(intakeId: string): Promise<ClientStatement | null> {
        const { data, error } = await this.db
            .from('client_statements')
            .select('*')
            .eq('intake_id', intakeId)
            .maybeSingle();

        if (error) this.handleError(error, 'getClientStatement');
        return data;
    }

    async upsertClientStatementAtomic(intakeId: string, statement: Partial<ClientStatement>, userId: string) {
        const { data: profile } = await this.db.from('profiles').select('id').eq('id', userId).single();

        const { data, error } = await this.db
            .from('client_statements')
            .upsert({
                ...statement,
                intake_id: intakeId,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) this.handleError(error, 'upsertClientStatementAtomic');
        return data;
    }

    async syncClinicalCase(params: {
        caseId: string;
        clientId: string;
        localVersion: number;
        data: any;
        events: any[];
    }) {
        const { data, error } = await this.db.rpc('sync_clinical_case', {
            p_case_id: params.caseId,
            p_client_id: params.clientId,
            p_local_version: params.localVersion,
            p_data: params.data,
            p_events: params.events
        });

        if (error) this.handleError(error, 'syncClinicalCase');
        return data;
    }
}

export const intakeRepository = new IntakeRepository();
