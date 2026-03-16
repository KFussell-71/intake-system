"use server";

import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { hipaaLogger } from '@/lib/logging/hipaaLogger';
import { HIPAAAuthorizationData } from '@/features/documents/types/hipaaRelease';
import { revalidatePath } from 'next/cache';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Save HIPAA Authorization using Prisma and unified auditing.
 * MIGRATED WITH AUDITING
 */
export async function saveHIPAAAuthorizationAction(intakeId: string, data: HIPAAAuthorizationData) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        // 1. Fetch Intake to get Client ID
        const intake = await prisma.intake.findUnique({
            where: { id: intakeId },
            select: { clientId: true, data: true }
        });

        if (!intake) throw new Error('Intake not found');

        // 2. Perform transactional update
        const result = await prisma.$transaction(async (tx: any) => {
            // A. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'SIGN',
                entityType: 'hipaa_release',
                entityId: intakeId,
                details: { representative: data.representativeName || 'Client' }
            });

            // B. Legacy Event (Timeline)
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'hipaa_submitted',
                    fieldPath: 'documents.hipaa',
                    newValue: `Signed by ${data.representativeName || 'Client'}`,
                    changedBy: auth.userId!
                }
            });

            // C. Create document record
            const doc = await tx.document.create({
                data: {
                    clientId: intake.clientId,
                    name: `HIPAA Authorization - ${new Date().toLocaleDateString()}`,
                    type: 'legal/hipaa',
                    url: 'signed_in_engine',
                    uploadedById: auth.userId
                }
            });

            // D. Update intake JSON data
            const existingData = (intake.data as any) || {};
            const updatedData = {
                ...existingData,
                hipaa_status: 'signed',
                hipaa_date: new Date().toISOString(),
                hipaa_doc_id: doc.id
            };

            await tx.intake.update({
                where: { id: intakeId },
                data: {
                    data: updatedData
                }
            });

            return doc;
        });

        hipaaLogger.info('HIPAA authorization successfully persisted', { intakeId, docId: result.id });

        revalidatePath(`/intake/${intakeId}`);
        revalidatePath('/portal');

        return { success: true, docId: result.id };

    } catch (err: any) {
        hipaaLogger.error('Failed to save HIPAA authorization', { error: err.message, intakeId });
        return { success: false, error: err.message };
    }
}
