'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { comparabilityRepository } from '@/repositories/ComparabilityRepository';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Get normalized metrics (Rosetta Stone View).
 * MIGRATED WITH AUDITING
 */
export async function getComparabilityAction(category: string = 'BARRIERS') {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    try {
        const result = await comparabilityRepository.getNormalizedMetrics(category);

        // Unified Audit Log (Read action for analytics)
        await auditService.log({
            userId: auth.userId,
            action: 'READ',
            entityType: 'comparability_metrics',
            entityId: category,
            details: { count: result?.length || 0 }
        });

        return { success: true, data: result };
    } catch (err: any) {
        console.error('Comparability Action Error:', err);
        return { success: false, error: err.message };
    }
}
