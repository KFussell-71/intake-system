'use server';

import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';
import crypto from 'crypto';

/**
 * Server Action: Create a consent document (ROI) using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function createConsentDocumentAction(intakeId: string, scopeText: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        // 1. Fetch Intake to get Client ID
        const intake = await prisma.intake.findUnique({
            where: { id: intakeId },
            select: { clientId: true }
        });

        if (!intake) throw new Error('Intake not found');

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const data = await prisma.$transaction(async (tx: any) => {
            // 2. Create Consent Document
            const doc = await tx.consentDocument.create({
                data: {
                    intakeId: intakeId,
                    clientId: intake.clientId,
                    type: 'release_of_information',
                    templateVersion: 'v2026.1 (Standard ROI)',
                    scopeText: scopeText,
                    expiresAt: expiresAt,
                    createdBy: auth.userId!,
                    locked: false
                }
            });

            // 3. Audit Log (via unified service)
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'consent_document',
                entityId: doc.id,
                details: { intakeId, scopeText }
            });

            // 4. Legacy Intake Event (for backward compatibility with timeline UI)
            await tx.intakeEvent.create({
                data: {
                    intakeId: intakeId,
                    eventType: 'consent_created',
                    newValue: `Created ROI for: ${scopeText}`,
                    changedBy: auth.userId!
                }
            });

            return doc;
        });

        return { success: true, data };
    } catch (err: any) {
        console.error('Consent Creation Error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Sign a consent document using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function signConsentDocumentAction(documentId: string, signerName: string, role: string, signatureData: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const hash = crypto.createHash('sha256').update(`${documentId}:${signerName}:${signatureData}:${new Date().toISOString()}`).digest('hex');

        await prisma.$transaction(async (tx: any) => {
            // 1. Fetch Document and Intake to get Client ID
            const doc = await tx.consentDocument.findUnique({
                where: { id: documentId },
                select: { intakeId: true, clientId: true }
            });

            if (!doc) throw new Error('Document not found');

            // 2. Create Signature
            const sig = await tx.consentSignature.create({
                data: {
                    consentDocumentId: documentId,
                    intakeId: doc.intakeId,
                    clientId: doc.clientId,
                    signerName: signerName,
                    signerRole: role,
                    signatureData: signatureData,
                    method: 'digital_pad',
                    documentHash: hash,
                    ipAddress: '127.0.0.1'
                }
            });

            // 3. Lock Document
            await tx.consentDocument.update({
                where: { id: documentId },
                data: { locked: true }
            });

            // 4. Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'SIGN',
                entityType: 'consent_document',
                entityId: documentId,
                details: { signatureId: sig.id, signerName, role }
            });

            // 5. Legacy Intake Event
            await tx.intakeEvent.create({
                data: {
                    intakeId: doc.intakeId,
                    eventType: 'consent_signed',
                    newValue: `Signed by ${signerName} (${role})`,
                    changedBy: auth.userId!
                }
            });
        });

        return { success: true };
    } catch (err: any) {
        console.error('Consent Signature Error:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Get all consents for an intake using Prisma.
 */
export async function getConsentsAction(intakeId: string) {
    try {
        const data = await prisma.consentDocument.findMany({
            where: { intakeId: intakeId },
            include: { signatures: true },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, data };
    } catch (error: any) {
        console.error('Fetch Consents Error:', error);
        return { success: false, error: error.message };
    }
}
