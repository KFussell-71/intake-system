'use server';

import { modernizedIntakeRepository } from '@/repositories/ModernizedIntakeRepository';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Create Consent Document using Prisma-backed repository.
 * MIGRATED WITH AUDITING
 */
export async function createConsentDocumentAction(intakeId: string, clientId: string, scopeText: string, version: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    const result = await modernizedIntakeRepository.createConsentDocument({
        intakeId,
        clientId,
        type: 'release_of_information',
        scopeText: scopeText,
        templateVersion: version,
        createdBy: auth.userId
    });

    // 1. Unified Audit Log
    await auditService.log({
        userId: auth.userId,
        action: 'CREATE',
        entityType: 'consent_document',
        entityId: result.id,
        details: { intakeId, clientId, scopeText }
    });

    // 2. Legacy Intake Event (Timeline UI)
    await modernizedIntakeRepository.logIntakeEvent({
        intakeId,
        eventType: 'consent_created',
        fieldPath: 'consent',
        newValue: `Document ID: ${result.id}`,
        changedBy: auth.userId
    });

    revalidatePath(`/intake/${intakeId}`);
    return result;
}

/**
 * Server Action: Sign and Lock Consent using Prisma-backed repository.
 * MIGRATED WITH AUDITING
 */
export async function signConsentAction(
    documentId: string,
    intakeId: string,
    signerName: string,
    signerRole: string,
    method: string
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    // Atomic signature add via Prisma
    const result = await modernizedIntakeRepository.addConsentSignature({
        consentDocumentId: documentId,
        intakeId: intakeId,
        signerName: signerName,
        signerRole: signerRole,
        method: method
    });

    // If client signs, lock the document to prevent tampering
    if (signerRole === 'client') {
        await modernizedIntakeRepository.lockConsentDocument(documentId);
    }

    // 1. Unified Audit Log
    await auditService.log({
        userId: auth.userId,
        action: 'SIGN',
        entityType: 'consent_document',
        entityId: documentId,
        details: { signerName, signerRole, method }
    });

    // 2. Legacy Intake Event
    await modernizedIntakeRepository.logIntakeEvent({
        intakeId,
        eventType: 'consent_signed',
        fieldPath: `consent.${signerRole}`,
        newValue: `Signed by ${signerName} via ${method}`,
        changedBy: auth.userId
    });

    revalidatePath(`/intake/${intakeId}`);
    return result;
}
