"use server";

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Saves DOR report data into the Intake JSONB blob.
 * MIGRATED WITH AUDITING
 */
export async function saveDORReport(intakeId: string, reportData: any, status: 'draft' | 'final' = 'draft') {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        await prisma.$transaction(async (tx: any) => {
            const intake = await tx.intake.findUnique({
                where: { id: intakeId },
                select: { data: true }
            });

            if (!intake) throw new Error('Intake not found');

            const currentData = (intake.data as any) || {};
            const updatedData = {
                ...currentData,
                dor_report: {
                    ...(reportData || {}),
                    status,
                    last_updated: new Date().toISOString()
                }
            };

            await tx.intake.update({
                where: { id: intakeId },
                data: {
                    data: updatedData,
                    updatedAt: new Date()
                }
            });

            // 1. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'UPDATE',
                entityType: 'intake',
                entityId: intakeId,
                details: { section: 'dor_report', status }
            });

            // 2. Section Status Update
            await tx.intakeSection.upsert({
                where: {
                    intakeId_sectionName: {
                        intakeId,
                        sectionName: 'dor_report'
                    }
                },
                update: {
                    status: status === 'final' ? 'completed' : 'in_progress',
                    updatedAt: new Date(),
                    lastUpdatedBy: auth.userId!
                },
                create: {
                    intakeId,
                    sectionName: 'dor_report',
                    status: status === 'final' ? 'completed' : 'in_progress',
                    lastUpdatedBy: auth.userId!
                }
            });
        });

        revalidatePath(`/intake/${intakeId}`);
        revalidatePath('/dashboard');

        return { success: true };

    } catch (error: any) {
        console.error('Error saving DOR report:', error);
        return { success: false, error: error.message || 'Failed to save report' };
    }
}
