import { clientRepository, ClientRepository } from '../repositories/ClientRepository';
import { intakeRepository, IntakeRepository, IntakeAssessment, SupervisionNote } from '../repositories/IntakeRepository';
import type { IntakeFormData } from '@/features/intake/types/intake';
import { supabase } from '@/lib/supabase';
import { saveSyncTask } from '@/lib/offline/db';
import { IntakeWorkflowService } from '@/domain/services/IntakeWorkflowService';
import { IntakeEntity, ClientAggregate } from '@/domain/entities/ClientAggregate';

export { type IntakeAssessment, type SupervisionNote };

export class IntakeService {
    constructor(
        private readonly repo: ClientRepository = clientRepository,
        private readonly intakeRepo: IntakeRepository = intakeRepository
    ) { }

    private isOffline() {
        return typeof navigator !== 'undefined' && !navigator.onLine;
    }

    async submitNewIntake(data: IntakeFormData) {
        if (this.isOffline()) {
            await saveSyncTask({ type: 'INTAKE_CREATE', data });
            return { success: true, offline: true };
        }

        try {
            // 1. Relational Create via Repository (SME: Persistence)
            const result = await this.repo.createClientWithIntakeRPC({
                p_name: data.clientName,
                p_phone: data.phone,
                p_email: data.email,
                p_address: data.address,
                p_ssn_last_four: data.ssnLastFour,
                p_report_date: data.reportDate,
                p_completion_date: data.completionDate,
                p_intake_data: {} // EMPTY JSONB - Start the strangle
            });

            if (result && result.intake_id) {
                const { data: { user } } = await supabase.auth.getUser();
                const userId = user?.id || 'SYSTEM';

                // 2. Hydrate Domain Tables (Identity, Medical, etc.) - SME: Domain Isolation
                // We use the aggregate to orchestrate. 
                const entity = new IntakeEntity(result.intake_id, data, 'draft');

                // For a new submission, we save the full initial state to relational tables
                // In a true 'Relational First' model, this would be a series of domain inserts.
                // For now, we delegate to the Domain Workflow Service.
                await IntakeWorkflowService.submitIntake(new ClientAggregate(result.client_id, data as any), entity, userId);
            }
            return result;
        } catch (error) {
            console.warn('Network submit failed, saving to offline queue:', error);
            await saveSyncTask({ type: 'INTAKE_CREATE', data });
            return { success: true, offline: true };
        }
    }

    async saveIntakeProgress(intakeId: string, data: Partial<IntakeFormData>, editComment?: string) {
        if (this.isOffline()) {
            await saveSyncTask({ type: 'INTAKE_UPDATE', data: { intakeId, data, summary: editComment } });
            return { success: true, offline: true };
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // DDD: Load and orchestrate
            const raw = await this.intakeRepo.getIntakeById(intakeId);
            const entity = new IntakeEntity(intakeId, raw.data, raw.status);

            // SME: State Transition & Domain Events
            await IntakeWorkflowService.saveProgress(entity, data, editComment || "Progressive Save", user.id);

            // Relational Persistence strategy:
            // We NO LONGER call saveIntakeProgressAtomic as the primary sink for domain data.
            // Instead, we should call domain-specific persistence or just rely on the actions
            // for the Next.js frontend, and this service for the backend/SDK.

            // For now, to maintain compatibility without the God Object, 
            // we'll update the status and log the event.
            await this.intakeRepo.updateIntakeStatus(intakeId, 'draft');

            return { success: true };
        } catch (error: any) {
            console.warn('Network save failed, saving to offline queue:', error);
            await saveSyncTask({ type: 'INTAKE_UPDATE', data: { intakeId, data, summary: editComment } });
            return { success: true, offline: true };
        }
    }

    async loadLatestDraft() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        return await this.intakeRepo.getLatestUserDraft(user.id);
    }

    async getIntakeAssessment(intakeId: string) {
        return await this.intakeRepo.getAssessment(intakeId);
    }

    async saveAssessment(assessment: Partial<IntakeAssessment>) {
        if (!assessment.intake_id) throw new Error("Intake ID required");

        if (this.isOffline()) {
            await saveSyncTask({ type: 'ASSESSMENT_UPSERT', data: assessment });
            return { success: true, offline: true };
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            return await this.intakeRepo.upsertAssessmentAtomic(
                assessment.intake_id,
                assessment,
                user.id
            );
        } catch (error) {
            console.warn('Network assessment save failed, saving to offline queue:', error);
            await saveSyncTask({ type: 'ASSESSMENT_UPSERT', data: assessment });
            return { success: true, offline: true };
        }
    }

    // --- Phase 36: Supervision ---

    async addSupervisionNote(note: Omit<SupervisionNote, 'id' | 'created_at'>) {
        return await this.intakeRepo.addSupervisionNote(note);
    }

    async getSupervisionHistory(intakeId: string) {
        return await this.intakeRepo.getSupervisionHistory(intakeId);
    }

    /**
     * Phase 20: Fetch raw server data for conflict detection
     */
    async fetchServerData(intakeId: string) {
        try {
            const intake = await this.intakeRepo.getIntakeById(intakeId);
            const assessment = await this.intakeRepo.getAssessment(intakeId);
            return {
                ...intake?.data,
                ...assessment,
                updated_at: assessment?.updated_at || intake?.updated_at
            };
        } catch (error) {
            console.error('[IntakeService] fetchServerData failed:', error);
            return null;
        }
    }
}

export const intakeService = new IntakeService();
