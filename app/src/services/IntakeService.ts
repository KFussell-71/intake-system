import { clientRepository, ClientRepository } from '../repositories/ClientRepository';
import { intakeRepository, IntakeRepository, IntakeAssessment, SupervisionNote } from '../repositories/IntakeRepository';
import type { IntakeFormData } from '@/features/intake/intakeTypes';
import { createClient } from '@/lib/supabase/browser';
import { saveSyncTask } from '@/lib/offline/db';
import { IntakeWorkflowService } from '@/domain/services/IntakeWorkflowService';
import { IntakeEntity, ClientAggregate } from '@/domain/entities/ClientAggregate';
import { DomainPersistenceManager } from '@/domain/services/DomainPersistenceManager';

export { type IntakeAssessment, type SupervisionNote };

export class IntakeService {
    private get supabase() {
        return createClient();
    }
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
                const { data: { user } } = await this.supabase.auth.getUser();
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
            // Mock ID for Demo/Offline mode so UI can proceed
            return {
                success: true,
                offline: true,
                intake_id: 'mock-intake-' + Date.now(),
                client_id: 'mock-client-' + Date.now()
            };
        }
    }

    async saveIntakeProgress(intakeId: string, data: Partial<IntakeFormData>, editComment?: string, expectedVersion?: number) {
        if (this.isOffline()) {
            await saveSyncTask({ type: 'INTAKE_UPDATE', data: { intakeId, data, summary: editComment } });
            return { success: true, offline: true };
        }

        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // DDD: Load and orchestrate
            const raw = await this.intakeRepo.getIntakeById(intakeId);
            if (!raw) {
                // If the intake doesn't exist, we can't save progress on it.
                // This might happen if the ID is invalid or the initial create failed.
                throw new Error(`Intake not found: ${intakeId}`);
            }

            const entity = new IntakeEntity(intakeId, raw.data || {}, raw.status, [], raw.version);

            // 1. SME: State Transition & Domain Events (Diffing happens here)
            await IntakeWorkflowService.saveProgress(entity, data, editComment || "Progressive Save", user.id);

            // 2. ARCHITECTURE: Incremental Domain Hydration (V3 Parallelized)
            const updatesByTable = DomainPersistenceManager.getUpdatesByTable(data);

            const updatePromises = Object.entries(updatesByTable).map(async ([table, fields]) => {
                let targetId = table === 'clients' ? raw.client_id : intakeId;
                return this.intakeRepo.updateDomainFields(table, targetId, fields);
            });

            // Run updates in parallel to reduce latency from O(N) to O(1) round-trips
            await Promise.all(updatePromises);

            // 3. Finalize versioning and JSONB sync (Backward Compatibility)
            const result = await this.intakeRepo.saveIntakeProgressAtomic(
                intakeId,
                data,
                editComment || "Progressive Save",
                user.id,
                expectedVersion
            );

            if (result && !result.success && result.error === 'CONFLICT') {
                return { success: false, error: 'CONFLICT', message: result.message };
            }

            return { success: true, data: result };
        } catch (error: any) {
            if (error.message?.includes('version mismatch')) {
                return { success: false, error: 'CONFLICT', message: error.message };
            }
            console.warn('Network save failed, saving to offline queue:', error);
            await saveSyncTask({ type: 'INTAKE_UPDATE', data: { intakeId, data, summary: editComment } });
            return { success: true, offline: true };
        }
    }

    async loadLatestDraft() {
        const { data: { user } } = await this.supabase.auth.getUser();
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
            const { data: { user } } = await this.supabase.auth.getUser();
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
                version: intake?.version,
                updated_at: assessment?.updated_at || intake?.updated_at
            };
        } catch (error) {
            console.error('[IntakeService] fetchServerData failed:', error);
            return null;
        }
    }

    /**
     * Phase 6: Narrative-to-Barrier Promotion (V3 Atomic Transaction)
     */
    async promoteNarrativeToBarrier(intakeId: string, text: string, category: string = 'Functional') {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        try {
            // V3: Orchestrate via a single RPC call for atomicity to prevent orphaned rationales
            const { data, error } = await this.supabase.rpc('promote_narrative_to_barrier_v3', {
                p_intake_id: intakeId,
                p_text: text,
                p_category: category,
                p_user_id: user.id
            });

            if (error) throw error;
            return { success: true, rationaleId: data };
        } catch (error) {
            console.error('[IntakeService] promoteNarrativeToBarrier failed:', error);
            throw error;
        }
    }

    /**
     * V3: Graceful Shutdown Handler
     */
    static setupGracefulShutdown() {
        if (typeof process !== 'undefined') {
            process.on('SIGTERM', () => {
                console.log('[V3] SIGTERM received: closing persistent connections...');
                // Close Supabase or other listeners if applicable
                process.exit(0);
            });
        }
    }
}

// Initialize V3 handlers
IntakeService.setupGracefulShutdown();

export const intakeService = new IntakeService();
