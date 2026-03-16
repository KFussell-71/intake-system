'use server';

import { NarrativeExtractorService } from '@/domain/services/NarrativeExtractorService';
import { AIIntegrityAgent } from '@/domain/services/AIIntegrityAgent';
import { IntakeEntity } from '@/domain/entities/ClientAggregate';
import { verifyAuthorization } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

/**
 * Action: Smart Form-Fill
 * Extracts structured data from clinical narrative text.
 * MIGRATED TO PRISMA AUDIT
 */
export async function smartFormFill(narrative: string) {
    const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
    if (!authz.authorized) throw new Error('Unauthorized');

    try {
        const result = await NarrativeExtractorService.extractFromNarrative(narrative, authz.userId!);

        await auditService.log({
            userId: authz.userId!,
            action: 'CREATE',
            entityType: 'ai_extraction', // Standardized resource type
            entityId: 'narrative_extraction',
            details: { narrativeLength: narrative.length }
        });

        return result;
    } catch (error: any) {
        console.error('[AI_ACTION] Smart Form-Fill Error:', error);
        throw error;
    }
}

/**
 * Action: Manual Integrity Check
 * Explicitly trigger the integrity agent.
 */
export async function checkIntakeIntegrity(intakeId: string, data: any, status: any) {
    const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
    if (!authz.authorized) throw new Error('Unauthorized');

    try {
        const entity = new IntakeEntity(intakeId, data, status);
        const issues = await AIIntegrityAgent.checkIntegrity(entity, authz.userId!);

        await auditService.log({
            userId: authz.userId!,
            action: 'READ',
            entityType: 'ai_integrity_check',
            entityId: intakeId,
            details: { issueCount: issues.length }
        });

        return issues;
    } catch (error: any) {
        console.error('[AI_ACTION] Integrity Check Error:', error);
        throw error;
    }
}
