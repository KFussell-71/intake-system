'use server';

import { modernizedIntakeRepository } from '@/repositories/ModernizedIntakeRepository';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Add Observation
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

    const result = await modernizedIntakeRepository.addObservation({
        intake_id: intakeId,
        domain,
        value,
        source,
        confidence,
        author_user_id: auth.userId
    });

    // Mandatory Audit Event
    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: intakeId,
        event_type: 'observation_entry',
        field_path: `observations.${domain}`,
        new_value: `[${source}] ${value}`,
        changed_by: auth.userId
    });

    revalidatePath(`/intake/${intakeId}`);
    return result;
}

/**
 * Server Action: Remove Observation
 */
export async function removeObservationAction(intakeId: string, observationId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    await modernizedIntakeRepository.deleteObservation(observationId);

    // Audit Event
    await modernizedIntakeRepository.logIntakeEvent({
        intake_id: intakeId,
        event_type: 'observation_remove',
        field_path: 'observations',
        new_value: `Removed observation ID: ${observationId}`,
        changed_by: auth.userId || null
    });

    revalidatePath(`/intake/${intakeId}`);
    return { success: true };
}
