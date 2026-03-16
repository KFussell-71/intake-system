'use server';

import { ResourceMatcherAgent } from '@/lib/agents/resourceMatcher';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Find matches for resources based on user needs.
 * MIGRATED WITH AUDITING
 */
export async function findResourcesAction(userNeed: string) {
    try {
        const auth = await verifyAuthentication();

        // Allow unauth in dev for demo purposes
        if (!auth.authenticated && process.env.NODE_ENV !== 'development') {
            throw new Error('Unauthorized');
        }

        const result = await ResourceMatcherAgent.findMatches(userNeed);

        // 1. Unified Audit Log
        if (auth.userId) {
            await auditService.log({
                userId: auth.userId,
                action: 'READ',
                entityType: 'resource_matching',
                entityId: 'ai_agent',
                details: { userNeed, matchCount: result.length }
            });
        }

        return { success: true, data: result };
    } catch (error: any) {
        console.error('Find Resources Error:', error);
        return { success: false, error: error.message };
    }
}
