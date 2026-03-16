'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { evidenceRepository } from '@/repositories/EvidenceRepository';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Get standards checklist.
 */
export async function getStandardsAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    try {
        const data = await evidenceRepository.getStandards();
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Get historical packets.
 */
export async function getPacketsAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    try {
        const data = await evidenceRepository.getEvidencePackets();
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Generate a new binder.
 * MIGRATED WITH AUDITING
 */
export async function generatePacketAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const title = `Audit Evidence - ${new Date().toLocaleDateString()}`;
        const data = await evidenceRepository.createPacket(title);

        if (data) {
            await auditService.log({
                userId: auth.userId,
                action: 'CREATE',
                entityType: 'evidence_packet',
                entityId: data.id,
                details: { title }
            });
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('Evidence Generation Error:', err);
        return { success: false, error: err.message };
    }
}
