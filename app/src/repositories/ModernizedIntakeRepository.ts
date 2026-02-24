import { BaseRepository } from './BaseRepository';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type IntakeSection = Tables['intake_sections']['Row'];
type Observation = Tables['observations']['Row'];
type Barrier = Tables['barriers']['Row'];
type IntakeBarrier = Tables['intake_barriers']['Row'];
type ConsentDocument = Tables['consent_documents']['Row'];
type ConsentSignature = Tables['consent_signatures']['Row'];

export class ModernizedIntakeRepository extends BaseRepository {

    // --- 1. Intake Sections (Workflow) ---
    async getSectionStatuses(intakeId: string): Promise<IntakeSection[]> {
        const { data, error } = await this.db
            .from('intake_sections')
            .select('*')
            .eq('intake_id', intakeId);

        if (error) this.handleError(error, 'getSectionStatuses');
        return data || [];
    }

    async updateSectionStatus(intakeId: string, sectionName: string, status: IntakeSection['status'], userId: string) {
        const { data, error } = await this.db
            .from('intake_sections')
            .upsert({
                intake_id: intakeId,
                section_name: sectionName,
                status,
                last_updated_by: userId,
                updated_at: new Date().toISOString()
            }, { onConflict: 'intake_id,section_name' })
            .select()
            .single();

        if (error) this.handleError(error, 'updateSectionStatus');
        return data;
    }

    // --- 2. Observations (Clinical/Client Voice) ---
    async getObservations(intakeId: string, domain?: string): Promise<Observation[]> {
        let query = this.db
            .from('observations')
            .select('*')
            .eq('intake_id', intakeId);

        if (domain) query = query.eq('domain', domain);

        const { data, error } = await query;
        if (error) this.handleError(error, 'getObservations');
        return data || [];
    }

    async addObservation(observation: Tables['observations']['Insert']) {
        const { data, error } = await this.db
            .from('observations')
            .insert(observation)
            .select()
            .single();

        if (error) this.handleError(error, 'addObservation');
        return data;
    }

    // --- 3. Barriers (Relational Analytics) ---
    async deleteObservation(observationId: string) {
        const { error } = await this.db
            .from('observations')
            .delete()
            .eq('id', observationId);

        if (error) this.handleError(error, 'deleteObservation');
        return true;
    }

    async getAllBarriers(): Promise<Barrier[]> {
        const { data, error } = await this.db
            .from('barriers')
            .select('*')
            .eq('active', true);

        if (error) this.handleError(error, 'getAllBarriers');
        return data || [];
    }

    async getIntakeBarriers(intakeId: string) {
        const { data, error } = await this.db
            .from('intake_barriers')
            .select(`
                *,
                barrier:barriers(*)
            `)
            .eq('intake_id', intakeId);

        if (error) this.handleError(error, 'getIntakeBarriers');
        return data || [];
    }

    async addIntakeBarrier(intakeId: string, barrierId: number, source: string, notes?: string) {
        const { data, error } = await this.db
            .from('intake_barriers')
            .insert({
                intake_id: intakeId,
                barrier_id: barrierId,
                source,
                notes,
                added_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) this.handleError(error, 'addIntakeBarrier');
        return data;
    }

    // --- 4. Consent Workflow ---
    async removeIntakeBarrier(intakeId: string, barrierId: number) {
        const { error } = await this.db
            .from('intake_barriers')
            .delete()
            .match({ intake_id: intakeId, barrier_id: barrierId });

        if (error) this.handleError(error, 'removeIntakeBarrier');
        return true;
    }

    // --- 4. Consent Workflow ---
    async createConsentDocument(document: Tables['consent_documents']['Insert']) {
        const { data, error } = await this.db
            .from('consent_documents')
            .insert(document)
            .select()
            .single();

        if (error) this.handleError(error, 'createConsentDocument');
        return data;
    }

    async addConsentSignature(signature: Tables['consent_signatures']['Insert']) {
        const { data, error } = await this.db
            .from('consent_signatures')
            .insert(signature)
            .select()
            .single();

        if (error) this.handleError(error, 'addConsentSignature');
        return data;
    }

    async lockConsentDocument(documentId: string) {
        const { data, error } = await this.db
            .from('consent_documents')
            .update({ locked: true })
            .eq('id', documentId)
            .select()
            .single();

        if (error) this.handleError(error, 'lockConsentDocument');
        return data;
    }

    // --- 5. Audit Ledger ---
    async logIntakeEvent(event: Tables['intake_events']['Insert']) {
        const { data, error } = await this.db
            .from('intake_events')
            .insert(event)
            .select()
            .single();

        if (error) this.handleError(error, 'logIntakeEvent');
        return data;
    }
}

export const modernizedIntakeRepository = new ModernizedIntakeRepository();
