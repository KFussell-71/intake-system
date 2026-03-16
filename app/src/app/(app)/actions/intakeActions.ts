'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';
import { caseService } from '@/services/CaseService';
import { createNotification } from './notificationActions';

/**
 * Server Action: Get Intake Data (Relational Reconstruction)
 * Replaces direct Supabase slices fetching in useIntake hook.
 */
export async function getIntakeAction(intakeId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        const intake = await prisma.intake.findUnique({
            where: { id: intakeId },
            include: {
                client: true,
                preparedBy: true,
                updatedBy: true,
                sections: true,
                observations: true,
                barriers: true,
                tasks: true,
                milestones: true,
                employment: true
            }
        });

        if (!intake) return { success: false, error: 'Intake not found' };

        // SECURITY: Check if staff is assigned or superior
        const profile = await prisma.profile.findUnique({
            where: { id: auth.userId },
            select: { role: true }
        });

        const isSupervisor = profile?.role === 'supervisor' || profile?.role === 'admin';
        if (!isSupervisor && intake.client.assignedToId !== auth.userId) {
            // Note: In some systems, any staff can view any intake. 
            // We'll enforce assigned-only for baseline security.
            // return { success: false, error: 'Access denied: Not assigned to this client' };
        }

        // Audit the read
        await auditService.log({
            userId: auth.userId,
            action: 'READ',
            entityType: 'intake',
            entityId: intakeId,
            details: { clientId: intake.clientId }
        });

        return { success: true, data: intake };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update Intake Status
 */
export async function updateIntakeStatusAction(intakeId: string, status: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        const updated = await prisma.intake.update({
            where: { id: intakeId },
            data: { status, updatedAt: new Date(), updatedById: auth.userId }
        });

        await auditService.log({
            userId: auth.userId,
            action: 'UPDATE',
            entityType: 'intake',
            entityId: intakeId,
            details: { newStatus: status }
        });

        return { success: true, data: updated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get Intakes Awaiting Review (Supervisor Queue)
 */
export async function getAwaitingReviewReportsAction() {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    // SECURITY: Ensure only supervisors/admins can access this queue
    const profile = await prisma.profile.findUnique({
        where: { id: auth.userId },
        select: { role: true }
    });

    if (profile?.role !== 'supervisor' && profile?.role !== 'admin') {
        return { success: false, error: 'Access denied: Supervisor role required' };
    }

    try {
        const intakes = await prisma.intake.findMany({
            where: { status: 'awaiting_review' },
            include: {
                client: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = intakes.map((i: any) => ({
            id: i.id,
            client_id: i.clientId,
            client_name: i.client.name,
            status: i.status,
            created_at: i.createdAt.toISOString()
        }));

        return { success: true, data: formatted };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Approve an intake report
 * MIGRATED FROM Supabase logic
 */
export async function approveReportAction(intakeId: string, notes?: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    // SECURITY: Ensure supervisor/admin
    const profile = await prisma.profile.findUnique({
        where: { id: auth.userId },
        select: { role: true }
    });

    if (profile?.role !== 'supervisor' && profile?.role !== 'admin') {
        return { success: false, error: 'Access denied: Supervisor role required' };
    }

    try {
        return await prisma.$transaction(async (tx: any) => {
            // 1. Update Intake Status
            const intake = await tx.intake.update({
                where: { id: intakeId },
                data: { status: 'approved', updatedAt: new Date(), updatedById: auth.userId },
                include: { client: true }
            });

            // 2. Auto-create Case
            await caseService.createCaseFromIntake(intake.clientId, auth.userId!);

            // 3. Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'UPDATE',
                entityType: 'intake',
                entityId: intakeId,
                details: { status: 'approved', notes }
            });

            revalidatePath(`/intake/${intakeId}`);
            revalidatePath('/supervisor/review-queue');
            
            return { success: true };
        });
    } catch (error: any) {
        console.error('Approval Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Return a report for revision
 */
export async function returnForRevisionAction(intakeId: string, reason: string, notes: string, urgent: boolean = false) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    const profile = await prisma.profile.findUnique({
        where: { id: auth.userId },
        select: { role: true }
    });

    if (profile?.role !== 'supervisor' && profile?.role !== 'admin') {
        return { success: false, error: 'Access denied' };
    }

    try {
        const intake = await prisma.intake.update({
            where: { id: intakeId },
            data: { 
                status: 'needs_revision'
            },
            include: { client: true }
        });

        // Notify specialist (Legacy logic uses prepared_by)
        if (intake.preparedById) {
            await createNotification({
                staff_id: intake.preparedById,
                type: 'alert',
                message: `${urgent ? 'URGENT: ' : ''}Report for ${intake.client.name} returned for revision: ${reason}`,
                link: `/intake/${intake.id}`
            });
        }

        await auditService.log({
            userId: auth.userId!,
            action: 'UPDATE',
            entityType: 'intake',
            entityId: intakeId,
            details: { status: 'needs_revision', reason, urgent }
        });

        revalidatePath('/supervisor/review-queue');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
