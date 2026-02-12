import { BaseRepository } from './BaseRepository';
import { ClientAggregate, IntakeEntity } from '@/domain/entities/ClientAggregate';
import type { CreateCaseNoteParams } from '@/features/cases/types';
import type { IntakeFormData } from '@/features/intake/intakeTypes';

export interface ClientPayload {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    ssn_last_four?: string;
    created_by?: string;
}

export interface IntakePayload {
    client_id: string;
    report_date: string;
    prepared_by?: string;
    completion_date?: string;
    data?: Partial<IntakeFormData>;
}

export interface CreateClientIntakeParams {
    p_name: string;
    p_phone?: string;
    p_email?: string;
    p_address?: string;
    p_ssn_last_four: string;
    p_report_date: string;
    p_completion_date?: string;
    p_intake_data: Partial<IntakeFormData>;
}

export class ClientRepository extends BaseRepository {
    async createClient(clientData: ClientPayload) {
        const { data, error } = await this.db
            .from('clients')
            .insert(clientData)
            .select()
            .single();

        if (error) this.handleError(error, 'createClient');
        return data;
    }

    async createIntake(intakeData: IntakePayload) {
        const { data, error } = await this.db
            .from('intakes')
            .insert(intakeData)
            .select()
            .single();

        if (error) this.handleError(error, 'createIntake');
        return data;
    }

    async createClientWithIntakeRPC(params: CreateClientIntakeParams) {
        const { data, error } = await this.db.rpc('create_client_intake', params);
        if (error) this.handleError(error, 'createClientWithIntakeRPC');
        return data;
    }

    // --- Phase 9: Client Profile & Case Management ---

    async getClientProfile(clientId: string) {
        const { data, error } = await this.db
            .from('clients')
            .select(`
                *,
                intakes (
                    id,
                    status,
                    report_date,
                    data
                ),
                assigned_to (
                    id,
                    username,
                    role
                )
            `)
            .eq('id', clientId)
            .single();

        if (error) this.handleError(error, 'getClientProfile');
        return data;
    }

    async getCaseNotes(clientId: string) {
        const { data, error } = await this.db
            .from('case_notes')
            .select(`
                *,
                author:author_id (
                    username,
                    role
                )
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'getCaseNotes');
        return data;
    }

    async createCaseNote(note: CreateCaseNoteParams) {
        const { data, error } = await this.db
            .from('case_notes')
            .insert(note)
            .select()
            .single();

        if (error) this.handleError(error, 'createCaseNote');
        return data;
    }

    async getTimelineEvents(clientId: string) {
        const { data, error } = await this.db.rpc('get_client_timeline_events', {
            p_client_id: clientId
        });

        if (error) this.handleError(error, 'getTimelineEvents');
        return data as any[];
    }

    /**
     * Reconstructs a rich Domain Aggregate from database rows.
     */
    async loadClientAggregate(clientId: string): Promise<ClientAggregate> {
        const { data, error } = await this.db
            .from('clients')
            .select(`
                *,
                intakes (
                    id,
                    status,
                    data,
                    created_at
                )
            `)
            .eq('id', clientId)
            .single();

        if (error) this.handleError(error, 'loadClientAggregate');

        const intakes = (data.intakes || []).map((i: any) =>
            new IntakeEntity(i.id, i.data, i.status)
        );

        return new ClientAggregate(data.id, data.name, intakes);
    }
}

export const clientRepository = new ClientRepository();
