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
     * Executes a version-aware mutation on a ClinicalCase aggregate via the master_clinical_sync RPC.
     * This COLLAPSES all domain mutations into a single database transaction.
     */
    async executeMutation<T>(
        caseId: string,
        baseVersion: number,
        payload: any,
        eventMetadata: { type: string; actorId: string }
    ): Promise<T> {
        const deviceId = this.getDeviceId();

        console.log(`[ClinicalCaseService] Executing Master Sync: Case ${caseId}, V${baseVersion}`);

        const { data, error } = await this.supabase.rpc('master_clinical_sync', {
            p_case_id: caseId,
            p_base_version: baseVersion,
            p_device_id: deviceId,
            p_user_id: eventMetadata.actorId,
            p_payload: payload
        });

        if (error) {
            console.error('[ClinicalCaseService] RPC Error:', error);
            throw error;
        }

        if (data.status === 'error') {
            if (data.message?.includes('Version conflict')) {
                throw new ConflictError(data.current_version || -1, data.message);
            }
            throw new Error(data.message || 'Master sync failed');
        }

        return data as T;
    }

    private getDeviceId(): string {
        // In a real distributed app, this would be a persistent UUID stored in localStorage
        // or a hardware ID. For now, we use a session-based or derived ID.
        if (typeof window !== 'undefined') {
            let id = localStorage.getItem('clinical_node_device_id');
            if (!id) {
                id = crypto.randomUUID();
                localStorage.setItem('clinical_node_device_id', id);
            }
            return id;
        }
        return 'SERVER_NODE_ID';
    }
}

export const clinicalCaseService = new ClinicalCaseService();
