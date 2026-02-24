'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { evidenceRepository } from '@/repositories/EvidenceRepository';

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
 */
export async function generatePacketAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    try {
        const title = `Audit Evidence - ${new Date().toLocaleDateString()}`;
        const data = await evidenceRepository.createPacket(title);
        return { success: true, data };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
