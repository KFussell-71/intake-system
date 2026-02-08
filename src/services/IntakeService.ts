import { clientRepository, ClientRepository } from '../repositories/ClientRepository';
import { intakeRepository, IntakeRepository, IntakeAssessment, SupervisionNote } from '../repositories/IntakeRepository';
import type { IntakeFormData } from '@/features/intake/types/intake';
import { supabase } from '@/lib/supabase';
import { saveSyncTask } from '@/lib/offline/db';
import { IntakeWorkflowService } from '@/domain/services/IntakeWorkflowService';
import { IntakeEntity } from '@/domain/entities/ClientAggregate';

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
            const result = await this.repo.createClientWithIntakeRPC({
                p_name: data.clientName,
                p_phone: data.phone,
                p_email: data.email,
                p_address: data.address,
                p_ssn_last_four: data.ssnLastFour,
                p_report_date: data.reportDate,
                p_completion_date: data.completionDate,
                p_intake_data: data
            });

            if (result && result.intake_id) {
                const { data: { user } } = await supabase.auth.getUser();
                await this.intakeRepo.saveIntakeProgressAtomic(
                    result.intake_id,
                    data,
                    "Initial Submission",
                    user?.id || ''
                );
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

            await IntakeWorkflowService.saveProgress(entity, data, editComment || "Progressive Save", user.id);

            return await this.intakeRepo.saveIntakeProgressAtomic(
                intakeId,
                entity.data,
                editComment || "Progressive Save",
                user.id
            );
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
}

export const intakeService = new IntakeService();
