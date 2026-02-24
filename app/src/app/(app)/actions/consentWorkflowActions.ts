'use server';

import { modernizedIntakeRepository } from '@/repositories/ModernizedIntakeRepository';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Create Consent Document
 */
export async function createConsentDocumentAction(intakeId: string, scopeText: string, version: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    const result = await modernizedIntakeRepository.createConsentDocument({
        intake_id: intakeId,
        scope_text: scopeText,
        template_version: version,
        created_by: auth.userId
    });

    // Audit Event
    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: intakeId,
        event_type: 'consent_created',
        field_path: 'consent',
        new_value: `Document ID: ${result.id}`,
        changed_by: auth.userId
    });

    revalidatePath(`/intake/${intakeId}`);
    return result;
}

/**
 * Server Action: Sign and Lock Consent
 */
export async function signConsentAction(
    documentId: string,
    intakeId: string,
    signerName: string,
    signerRole: string,
    method: string
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    // Atomic signature add
    const result = await modernizedIntakeRepository.addConsentSignature({
        consent_document_id: documentId,
        signer_name: signerName,
        signer_role: signerRole,
        method: method
    });

    // If client signs, lock the document to prevent tampering
    if (signerRole === 'client') {
        await modernizedIntakeRepository.lockConsentDocument(documentId);
    }

    // Audit Event
    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: intakeId,
        event_type: 'consent_signed',
        field_path: `consent.${signerRole}`,
        new_value: `Signed by ${signerName} via ${method}`,
        changed_by: auth.userId || null
    });

    revalidatePath(`/intake/${intakeId}`);
    return result;
}
