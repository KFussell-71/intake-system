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
