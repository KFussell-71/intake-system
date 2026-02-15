'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { comparabilityRepository } from '@/repositories/ComparabilityRepository';

/**
 * Server Action: Get normalized metrics (Rosetta Stone View).
 */
export async function getComparabilityAction(category: string = 'BARRIERS') {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) throw new Error('Unauthorized');

    try {
        const result = await comparabilityRepository.getNormalizedMetrics(category);
        return { success: true, data: result };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
