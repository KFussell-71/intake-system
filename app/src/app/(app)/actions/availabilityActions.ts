'use server';

import { revalidatePath } from 'next/cache';
import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';

export type { AvailabilityBlock } from '@prisma/client';

/**
 * Fetches availability blocks for a given user and date range.
 */
export async function getAvailabilityBlocks(userId: string, startDate: Date, endDate: Date) {
    try {
        const data = await prisma.availabilityBlock.findMany({
            where: {
                userId: userId,
                startTime: {
                    gte: startDate
                },
                endTime: {
                    lte: endDate
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        return { success: true, data: data };
    } catch (error: any) {
        console.error('[AVAILABILITY_ACTION] Fetch Error:', error);
        return { success: false, message: 'Failed to load availability' };
    }
}

/**
 * Adds an availability block.
 */
export async function addAvailabilityBlock(data: {
    userId: string;
    startTime: string;
    endTime: string;
    title?: string;
    isRecurring?: boolean;
}) {
    try {
        const auth = await verifyAuthentication();
        if (!auth.authenticated || !auth.userId) {
            return { success: false, message: 'Unauthorized' };
        }

        // Get requester role
        const profile = await prisma.profile.findUnique({
            where: { id: auth.userId },
            select: { role: true }
        });

        const isElevated = profile?.role === 'supervisor' || profile?.role === 'admin';

        // SECURITY: Only allow users to manage their own availability unless they are supervisors/admins
        if (!isElevated && data.userId !== auth.userId) {
            return { success: false, message: 'You may only manage your own availability.' };
        }

        const start = new Date(data.startTime);
        const end = new Date(data.endTime);

        if (end <= start) {
            return { success: false, message: 'End time must be after start time' };
        }

        const newBlock = await prisma.$transaction(async (tx: any) => {
            const block = await tx.availabilityBlock.create({
                data: {
                    userId: data.userId,
                    startTime: start,
                    endTime: end,
                    title: data.title || 'Unavailable',
                    isRecurring: data.isRecurring || false
                }
            });

            await tx.auditLog.create({
                data: {
                    userId: auth.userId,
                    action: 'CREATE',
                    entityType: 'availability_block',
                    entityId: block.id,
                    metadata: { userId: data.userId, startTime: data.startTime }
                }
            });

            return block;
        });

        revalidatePath('/dashboard/schedule');
        return { success: true, data: newBlock };
    } catch (error: any) {
        console.error('[AVAILABILITY_ACTION] Create Error:', error);
        return { success: false, message: 'Failed to add availability block' };
    }
}

/**
 * Deletes an availability block.
 */
export async function deleteAvailabilityBlock(blockId: string, userId: string) {
    try {
        const auth = await verifyAuthentication();
        if (!auth.authenticated || !auth.userId) {
            return { success: false, message: 'Unauthorized' };
        }

        const profile = await prisma.profile.findUnique({
            where: { id: auth.userId },
            select: { role: true }
        });

        const isElevated = profile?.role === 'supervisor' || profile?.role === 'admin';

        // SECURITY: Only allow users to delete their own blocks unless elevated
        if (!isElevated && userId !== auth.userId) {
            return { success: false, message: 'You can only remove your own availability blocks.' };
        }

        const existingBlock = await prisma.availabilityBlock.findUnique({
            where: { id: blockId }
        });

        if (!existingBlock || existingBlock.userId !== userId) {
            return { success: false, message: 'Block not found or unauthorized' };
        }

        await prisma.$transaction(async (tx: any) => {
            await tx.availabilityBlock.delete({
                where: { id: blockId }
            });

            await tx.auditLog.create({
                data: {
                    userId: auth.userId,
                    action: 'DELETE',
                    entityType: 'availability_block',
                    entityId: blockId,
                    metadata: { userId }
                }
            });
        });

        revalidatePath('/dashboard/schedule');
        return { success: true };
    } catch (error: any) {
        console.error('[AVAILABILITY_ACTION] Delete Error:', error);
        return { success: false, message: 'Failed to remove availability block' };
    }
}
