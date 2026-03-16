'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { notificationService } from '@/services/NotificationService';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';

/**
 * Complete a milestone and trigger automated alerts.
 * MIGRATED TO PRISMA
 */
export async function completeMilestoneAction(milestoneId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Fetch milestone details
            const milestone = await tx.trackingMilestone.findUnique({
                where: { id: milestoneId },
                include: { client: { select: { id: true, assignedToId: true } } }
            });

            if (!milestone) throw new Error('Milestone not found');

            // 2. Update completion date
            const updated = await tx.trackingMilestone.update({
                where: { id: milestoneId },
                data: { completionDate: new Date() }
            });

            // 3. Resolve Case ID (Use new Case model)
            const caseRecord = await tx.case.findFirst({
                where: { clientId: milestone.clientId, status: 'active' },
                select: { id: true }
            });

            // 4. Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'UPDATE',
                entityType: 'tracking_milestone',
                entityId: milestoneId,
                details: { 
                    milestoneName: milestone.milestoneName,
                    clientId: milestone.clientId,
                    caseId: caseRecord?.id 
                }
            });

            return { milestone, caseId: caseRecord?.id };
        });

        // 5. Trigger Automated Notifications (outside transaction if service is external)
        if (result.caseId) {
            await notificationService.sendMilestoneAlert(
                result.milestone.clientId,
                result.milestone.milestoneName,
                result.caseId,
                auth.userId
            );
        }

        revalidatePath('/portal');
        revalidatePath('/dashboard/intake');

        return { success: true };
    } catch (err: any) {
        console.error('Milestone Completion Error:', err);
        return { success: false, error: err.message };
    }
}
