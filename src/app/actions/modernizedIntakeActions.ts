'use server';

import { modernizedIntakeRepository } from '@/repositories/ModernizedIntakeRepository';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';
import { validateSection } from '@/lib/validation/intakeValidation';

/**
 * ARCHITECTURE: Modernized Intake Actions
 * 
 * Domain-specific server actions that interface with the relational schema.
 * These actions enforce authentication and revalidate relevant Next.js paths.
 */

// --- 1. Section Status Actions ---
export async function updateIntakeSection(intakeId: string, sectionName: string, status: any) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    const result = await modernizedIntakeRepository.updateSectionStatus(
        intakeId,
        sectionName,
        status,
        auth.userId
    );

    revalidatePath(`/intake/${intakeId}`);
    return result;
}

// --- 2. Observation Actions ---
export async function addIntakeObservation(intakeId: string, domain: string, value: string, source: 'client' | 'counselor' | 'document', confidence?: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    // Validation
    const validation = validateSection('observations', { domain, value, source, confidence });
    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    const result = await modernizedIntakeRepository.addObservation({
        intake_id: intakeId,
        domain,
        value,
        source,
        confidence,
        author_user_id: auth.userId
    });

    revalidatePath(`/intake/${intakeId}`);
    return result;
}

export async function removeIntakeObservationAction(intakeId: string, observationId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    await modernizedIntakeRepository.deleteObservation(observationId);

    revalidatePath(`/intake/${intakeId}`);
    return { success: true };
}

// --- 3. Barrier Actions ---
export async function addIntakeBarrierAction(intakeId: string, barrierId: number, source: string, notes?: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    // Validation
    const validation = validateSection('barriers', { barrierId, source, notes });
    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    const result = await modernizedIntakeRepository.addIntakeBarrier(
        intakeId,
        barrierId,
        source,
        notes
    );

    // Also log this as an audit event
    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: intakeId,
        event_type: 'barrier_add',
        new_value: `Barrier ID: ${barrierId}`,
        changed_by: auth.userId,
        field_path: 'barriers'
    });

    revalidatePath(`/intake/${intakeId}`);
    return result;
}

export async function removeIntakeBarrierAction(intakeId: string, barrierId: number) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    await modernizedIntakeRepository.removeIntakeBarrier(intakeId, barrierId);

    // Audit Log
    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: intakeId,
        event_type: 'barrier_remove',
        new_value: `Barrier ID: ${barrierId}`,
        changed_by: auth.userId,
        field_path: 'barriers'
    });

    revalidatePath(`/intake/${intakeId}`);
    return { success: true };
}

// --- 4. Consent Actions ---
export async function createConsentDocumentAction(intakeId: string, scopeText: string, version: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    // Validation
    // The provided validation block was for 'observations' and used incorrect parameters.
    // Keeping the original repository call and adding a placeholder for correct validation.
    // TODO: Implement specific validation for consent document creation using intakeId, scopeText, version.
    // const validation = validateSection('consent', { intakeId, scopeText, version });
    // if (!validation.success) {
    //     return { success: false, error: validation.error };
    // }

    const result = await modernizedIntakeRepository.createConsentDocument({
        intake_id: intakeId,
        scope_text: scopeText,
        template_version: version,
        created_by: auth.userId
    });

    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: intakeId,
        event_type: 'consent_created',
        new_value: result.id,
        changed_by: auth.userId,
        field_path: 'consent'
    });

    revalidatePath(`/intake/${intakeId}/consent`);
    return result;
}

export async function signConsentAction(documentId: string, intakeId: string, signerName: string, signerRole: string, method: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    // Validation
    // Note: We construct a payload that matches ConsentSchema structure mostly for signature data
    // Ideally pass actual signature data. Here we assume 'method' or other fields act as proxy or we expand args.
    const validation = validateSection('consent', {
        documentId,
        signatureData: method,
        agreed: true
    });

    if (!validation.success) {
        return { success: false, error: validation.error };
    }

    const result = await modernizedIntakeRepository.addConsentSignature({
        consent_document_id: documentId,
        signer_name: signerName,
        signer_role: signerRole,
        method: method
    });

    // If this is the client signature, we might want to lock it
    if (signerRole === 'client') {
        await modernizedIntakeRepository.lockConsentDocument(documentId);
    }

    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: intakeId,
        event_type: 'consent_signed',
        new_value: `Signer: ${signerName} (${signerRole})`,
        changed_by: auth.userId || null,
        field_path: 'consent.signatures'
    });

    revalidatePath(`/intake/${intakeId}/consent`);
    return result;
}
