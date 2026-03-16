"use server";

import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Add Observation using Prisma.
 * Enforces explicit Clinical Voice (Client vs Counselor).
 */
export async function addObservationAction(
    intakeId: string,
    domain: string,
    value: string,
    source: 'client' | 'counselor' | 'document',
    confidence?: string
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        // 1. Fetch Intake to get Client ID
        const intake = await prisma.intake.findUnique({
            where: { id: intakeId },
            select: { clientId: true }
        });

        if (!intake) throw new Error('Intake not found');

        // 2. Perform Transactional update
        const result = await prisma.$transaction(async (tx: any) => {
            // A. Create Observation
            const obs = await tx.observation.create({
                data: {
                    intakeId,
                    clientId: intake.clientId,
                    domain,
                    value,
                    source,
                    confidence,
                    authorUserId: auth.userId
                }
            });

            // B. Mandatory Audit Event
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'observation_entry',
                    fieldPath: `observations.${domain}`,
                    newValue: `[${source}] ${value}`,
                    changedBy: auth.userId
                }
            });

            return obs;
        });

        revalidatePath(`/intake/${intakeId}`);
        return result;

    } catch (error: any) {
        console.error('Error adding observation:', error);
        throw error;
    }
}

/**
 * Server Action: Remove Observation using Prisma.
 */
export async function removeObservationAction(intakeId: string, observationId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        await prisma.$transaction(async (tx: any) => {
            // 1. Delete Observation
            await tx.observation.delete({
                where: { id: observationId }
            });

            // 2. Audit Event
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'observation_remove',
                    fieldPath: 'observations',
                    newValue: `Removed observation ID: ${observationId}`,
                    changedBy: auth.userId
                }
            });
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };

    } catch (error: any) {
        console.error('Error removing observation:', error);
        throw error;
    }
}
/**
 * Server Action: Get Observations using Prisma.
 */
export async function getObservationsAction(intakeId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    try {
        const observations = await prisma.observation.findMany({
            where: { intakeId },
            orderBy: { createdAt: 'desc' }
        });

        return { 
            success: true, 
            data: observations.map((o: any) => ({
                ...o,
                observed_at: o.createdAt.toISOString(),
                author_user_id: o.authorUserId
            }))
        };
    } catch (error: any) {
        console.error('Error fetching observations:', error);
        return { success: false, error: error.message };
    }
}
