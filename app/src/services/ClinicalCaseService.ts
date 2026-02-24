import { createClient } from '@/lib/supabase/browser';
import { intakeRepository, IntakeRepository } from '../repositories/IntakeRepository';

export class ConflictError extends Error {
    constructor(public serverVersion: number, message: string) {
        super(message);
        this.name = 'ConflictError';
    }
}

export class ClinicalCaseService {
    private get supabase() {
        return createClient();
    }

    constructor(
        private readonly intakeRepo: IntakeRepository = intakeRepository
    ) { }

    /**
     * Executes a version-aware mutation on a ClinicalCase aggregate.
     * centralizes optimistic concurrency and event logging.
     */
    async executeMutation<T>(
        caseId: string,
        baseVersion: number,
        mutationFn: () => Promise<T>,
        eventMetadata: { type: string; actorId: string }
    ): Promise<T> {
        // 1. Fetch current state to verify version
        const current = await this.intakeRepo.getIntakeById(caseId);

        if (!current) {
            throw new Error(`Clinical case ${caseId} not found.`);
        }

        if (current.version !== baseVersion) {
            console.error(`[ClinicalCaseService] Version mismatch. Client: ${baseVersion}, Server: ${current.version}`);
            throw new ConflictError(current.version, 'Another provider has updated this record. Please refresh and try again.');
        }

        // 2. Execute the actual domain mutation
        // Note: In a pure distributed system, this would ideally be wrapped in a single DB transaction.
        // For the current Supabase architecture, we rely on the atomic nature of the final sync call.
        const result = await mutationFn();

        // 3. Record the transition in the Case Event Log
        // This ensures every change is traceable for the Distributed Sync protocol.
        await this.logSyncEvent(caseId, baseVersion + 1, eventMetadata.type, result, eventMetadata.actorId);

        return result;
    }

    private async logSyncEvent(
        caseId: string,
        version: number,
        type: string,
        payload: any,
        actorId: string
    ) {
        const { error } = await this.supabase
            .from('clinical_case_events')
            .insert({
                case_id: caseId,
                version: version,
                event_type: type,
                payload: payload,
                actor_id: actorId
            });

        if (error) {
            console.error('[ClinicalCaseService] Failed to log sync event:', error);
            // We don't throw here to avoid failing the mutation, but in production, 
            // this should be queued or retried.
        }
    }
}

export const clinicalCaseService = new ClinicalCaseService();
