'use server';

import { NarrativeExtractorService } from '@/domain/services/NarrativeExtractorService';
import { AIIntegrityAgent } from '@/domain/services/AIIntegrityAgent';
import { IntakeEntity } from '@/domain/entities/ClientAggregate';
import { verifyAuthorization } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

/**
 * Action: Smart Form-Fill
 * Extracts structured data from clinical narrative text.
 */
export async function smartFormFill(narrative: string) {
    const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
    if (!authz.authorized) throw new Error('Unauthorized');

    const result = await NarrativeExtractorService.extractFromNarrative(narrative, authz.userId!);

    await auditService.log({
        userId: authz.userId!,
        action: 'AI_FORM_FILL',
        entityType: 'intake',
        entityId: 'narrative_extraction',
        details: { narrativeLength: narrative.length }
    });

    return result;
}

/**
 * Action: Manual Integrity Check
 * Explicitly trigger the integrity agent (as opposed to the background shadow).
 */
export async function checkIntakeIntegrity(intakeId: string, data: any, status: any) {
    const authz = await verifyAuthorization(['staff', 'supervisor', 'admin']);
    if (!authz.authorized) throw new Error('Unauthorized');

    const entity = new IntakeEntity(intakeId, data, status);
    const issues = await AIIntegrityAgent.checkIntegrity(entity, authz.userId!);

    return issues;
}
