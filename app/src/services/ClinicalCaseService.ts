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
        metadata: { type: string; actorId?: string }
    ): Promise<T> {
        const userId = metadata.actorId || 'SYSTEM';
        const deviceId = this.getDeviceId();
        const clientTimestamp = new Date().toISOString();
        const eventId = crypto.randomUUID(); // Origin-generated ID for event ledger

        // CONFORMS TO DETERMINISTIC REPLAY: Canonicalize payload
        const canonicalPayload = this.canonicalize(payload);

        console.log(`[ClinicalCaseService] Executing Forensic Master Sync: Case ${caseId}, Event ${eventId}, V${baseVersion}`);

        const { data, error } = await this.supabase.rpc('master_clinical_sync_v3', {
            p_case_id: caseId,
            p_event_id: eventId,
            p_base_version: baseVersion,
            p_device_id: deviceId,
            p_user_id: userId,
            p_timestamp: clientTimestamp,
            p_payload: canonicalPayload
        });

        if (error) {
            console.error(`[ClinicalCaseService] Mutation Failed:`, error);
            throw new Error(`Mutation failed: ${error.message}`);
        }

        if (data.status === 'error') {
            console.error(`[ClinicalCaseService] Business Logic Error:`, data.message);
            if (data.message === 'Version conflict') {
                throw new Error(`version mismatch: expected ${baseVersion}, got ${data.current_version}`);
            }
            throw new Error(data.message);
        }

        return data as T;
    }

    /**
     * Calculates a SHA256 hash of a file for deterministic sync.
     * This is the "Law" of binary reconciliation in the Clinical Node.
     */
    async calculateFileHash(file: File): Promise<string> {
        if (typeof window === 'undefined') return 'SERVER_CALCULATION';

        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        console.log(`[ClinicalCaseService] Generated Hash for ${file.name}: ${hashHex}`);
        return hashHex;
    }

    private getDeviceId(): string {
        // In a real distributed app, this would be a persistent UUID stored in localStorage
        // or a hardware ID. For now, we use a session-based or derived ID.
        let deviceId = typeof localStorage !== 'undefined' ? localStorage.getItem('clinical_node_device_id') : null;
        if (!deviceId) {
            deviceId = crypto.randomUUID();
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('clinical_node_device_id', deviceId);
            }
        }
        return deviceId;
    }

    /**
     * Ensures deterministic JSON serialization by recursively sorting object keys.
     * Required for byte-level state equality across replicas.
     */
    private canonicalize(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.canonicalize(item));
        }

        const sortedKeys = Object.keys(obj).sort();
        const result: Record<string, any> = {};
        for (const key of sortedKeys) {
            if (obj[key] !== undefined) {
                result[key] = this.canonicalize(obj[key]);
            }
        }
        return result;
    }
}

export const clinicalCaseService = new ClinicalCaseService();
