'use server';

import { modernizedIntakeRepository } from '@/repositories/ModernizedIntakeRepository';
import { verifyAuthentication, verifyClientAccess, prisma as db } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';
import { validateSection } from '@/lib/validation/intakeValidation';
import { auditService } from '@/services/auditService';

/**
 * ARCHITECTURE: Modernized Intake Actions
 * MIGRATED WITH UNIFIED AUDITING
 */

// --- Helper to resolve clientId from intakeId ---
async function getClientFromIntake(intakeId: string) {
    const intake = await db.intake.findUnique({
        where: { id: intakeId },
        select: { clientId: true }
    });
    if (!intake) throw new Error('Intake not found');
    return intake.clientId;
}

// --- 1. Section Status Actions ---
export async function updateIntakeSection(intakeId: string, sectionName: string, status: any) {
    const clientId = await getClientFromIntake(intakeId);
    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized || !auth.userId) throw new Error(auth.error || 'Unauthorized');

    try {
        const result = await db.$transaction(async (tx: any) => {
            const update = await modernizedIntakeRepository.updateSectionStatus(
                intakeId,
                sectionName,
                status,
                auth.userId!
            );

            // Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'UPDATE',
                entityType: 'intake_section',
                entityId: intakeId,
                details: { sectionName, status }
            });

            return update;
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true, data: result };
    } catch (err: any) {
        console.error('Section Update Error:', err);
        return { success: false, error: err.message };
    }
}

// --- 2. Observation Actions ---
export async function addIntakeObservation(intakeId: string, domain: string, value: string, source: 'client' | 'counselor' | 'document', confidence?: string) {
    const clientId = await getClientFromIntake(intakeId);

    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized || !auth.userId) throw new Error(auth.error || 'Unauthorized');

    // Validation
    const validation = validateSection('observations', { domain, value, source, confidence });
    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        const result = await db.$transaction(async (tx: any) => {
            const observation = await modernizedIntakeRepository.addObservation({
                intakeId,
                clientId,
                domain,
                value,
                source,
                confidence,
                authorUserId: auth.userId
            });

            // Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'observation',
                entityId: observation.id,
                details: { domain, source, intakeId }
            });

            // Legacy Ledger
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'observation_add',
                    newValue: `${domain}: ${value}`,
                    changedBy: auth.userId!,
                    fieldPath: `observations.${domain}`
                }
            });

            return observation;
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true, data: result };
    } catch (err: any) {
        console.error('Observation Add Error:', err);
        return { success: false, error: err.message };
    }
}

export async function removeIntakeObservationAction(intakeId: string, observationId: string) {
    const clientId = await getClientFromIntake(intakeId);
    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized || !auth.userId) throw new Error(auth.error || 'Unauthorized');

    try {
        await db.$transaction(async (tx: any) => {
            await modernizedIntakeRepository.deleteObservation(observationId);

            // Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'DELETE',
                entityType: 'observation',
                entityId: observationId,
                details: { intakeId }
            });

            // Legacy Ledger
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'observation_remove',
                    newValue: observationId,
                    changedBy: auth.userId!,
                    fieldPath: 'observations'
                }
            });
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// --- 3. Barrier Actions ---
export async function addIntakeBarrierAction(intakeId: string, barrierId: number, source: string, notes?: string) {
    const clientId = await getClientFromIntake(intakeId);
    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized || !auth.userId) throw new Error(auth.error || 'Unauthorized');

    // Validation
    const validation = validateSection('barriers', { barrierId, source, notes });
    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        const result = await db.$transaction(async (tx: any) => {
            const barrier = await modernizedIntakeRepository.addIntakeBarrier(
                intakeId,
                clientId,
                barrierId,
                source,
                notes
            );

            // Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'intake_barrier',
                entityId: `${intakeId}_${barrierId}`,
                details: { source, notes }
            });

            // Legacy Ledger
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'barrier_add',
                    newValue: `Barrier ID: ${barrierId}`,
                    changedBy: auth.userId!,
                    fieldPath: 'barriers'
                }
            });

            return barrier;
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true, data: result };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function removeIntakeBarrierAction(intakeId: string, barrierId: number) {
    const clientId = await getClientFromIntake(intakeId);
    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized || !auth.userId) throw new Error(auth.error || 'Unauthorized');

    try {
        await db.$transaction(async (tx: any) => {
            await modernizedIntakeRepository.removeIntakeBarrier(intakeId, barrierId);

            // Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'DELETE',
                entityType: 'intake_barrier',
                entityId: `${intakeId}_${barrierId}`
            });

            // Legacy Ledger
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'barrier_remove',
                    newValue: `Barrier ID: ${barrierId}`,
                    changedBy: auth.userId!,
                    fieldPath: 'barriers'
                }
            });
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

// --- 4. Consent Actions ---
export async function createConsentDocumentAction(intakeId: string, scopeText: string, version: string) {
    const clientId = await getClientFromIntake(intakeId);
    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized || !auth.userId) throw new Error(auth.error || 'Unauthorized');

    if (!intakeId || !scopeText || !version) {
        return { success: false, error: 'Missing required fields' };
    }

    try {
        const result = await db.$transaction(async (tx: any) => {
            const doc = await modernizedIntakeRepository.createConsentDocument({
                intakeId,
                clientId,
                type: 'intake_consent',
                templateVersion: version,
                scopeText: scopeText,
                createdBy: auth.userId
            });

            // Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'consent_document',
                entityId: doc.id,
                details: { version }
            });

            // Legacy Ledger
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'consent_created',
                    newValue: doc.id,
                    changedBy: auth.userId!,
                    fieldPath: 'consent'
                }
            });

            return doc;
        });

        revalidatePath(`/intake/${intakeId}/consent`);
        return { success: true, data: result };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function signConsentAction(documentId: string, intakeId: string, signerName: string, signerRole: string, method: string) {
    const clientId = await getClientFromIntake(intakeId);
    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized) throw new Error(auth.error || 'Unauthorized');

    // Validation
    const validation = validateSection('consent', { documentId, signatureData: method, agreed: true });
    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    try {
        const result = await db.$transaction(async (tx: any) => {
            const registration = await modernizedIntakeRepository.addConsentSignature({
                consentDocumentId: documentId,
                intakeId,
                clientId,
                signerName,
                signerRole,
                method
            });

            if (signerRole === 'client') {
                await modernizedIntakeRepository.lockConsentDocument(documentId);
            }

            // Unified Audit Log
            await auditService.log({
                userId: auth.userId || 'portal-user',
                action: 'SIGN',
                entityType: 'consent_document',
                entityId: documentId,
                details: { signerRole, signerName, method }
            });

            // Legacy Ledger
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'consent_signed',
                    newValue: `Signer: ${signerName} (${signerRole})`,
                    changedBy: auth.userId || null,
                    fieldPath: 'consent.signatures'
                }
            });

            return registration;
        });

        revalidatePath(`/intake/${intakeId}/consent`);
        return { success: true, data: result };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function getConsentDataAction(intakeId: string) {
    const clientId = await getClientFromIntake(intakeId);
    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized) throw new Error(auth.error || 'Unauthorized');

    try {
        // Fetch latest consent document for this intake
        const doc = await db.consentDocument.findFirst({
            where: { intakeId },
            orderBy: { createdAt: 'desc' }
        });

        if (!doc) {
            return { success: true, document: null, signatures: [] };
        }

        const signatures = await db.consentSignature.findMany({
            where: { consentDocumentId: doc.id }
        });

        return { 
            success: true, 
            document: {
                ...doc,
                created_at: doc.createdAt.toISOString()
            }, 
            signatures: signatures.map((s: any) => ({
                ...s,
                signed_at: s.signedAt.toISOString()
            }))
        };
    } catch (err: any) {
        console.error('Consent Fetch Error:', err);
        return { success: false, error: err.message };
    }
}

export async function getBarriersDataAction(intakeId: string) {
    const clientId = await getClientFromIntake(intakeId);
    const auth = await verifyClientAccess(clientId);
    if (!auth.authorized) throw new Error(auth.error || 'Unauthorized');

    try {
        const [allBarriers, selectedBarriers] = await Promise.all([
            modernizedIntakeRepository.getAllBarriers(),
            modernizedIntakeRepository.getIntakeBarriers(intakeId)
        ]);

        return { 
            success: true, 
            data: {
                allBarriers,
                selectedBarriers: selectedBarriers.map((sb: any) => ({
                    barrier_id: sb.barrierId,
                    source: sb.source,
                    notes: sb.notes
                }))
            }
        };
    } catch (err: any) {
        console.error('Barriers Fetch Error:', err);
        return { success: false, error: err.message };
    }
}
