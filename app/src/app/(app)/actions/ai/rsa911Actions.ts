'use server';

import { UnifiedAIService } from '@/lib/ai/UnifiedAIService';
import { IntakeFormData } from '@/features/intake/intakeTypes';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

const aiService = new UnifiedAIService();

/**
 * Server Action: Suggest RSA-911 Codes using AI.
 * MIGRATED WITH UNIFIED AUDITING
 */
export async function suggestRSA911Codes(intakeData: Partial<IntakeFormData>) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    // 1. Construct a prompt based on clinical/medical/vocational data
    const context = `
    Client Notes: ${intakeData.notes || 'None'}
    Medical Condition: ${intakeData.medicalConditionDescription || 'None'}
    Barriers: ${intakeData.barriers?.join(', ') || 'None'}
    Education: ${intakeData.educationLevel || 'Unknown'}
    
    Task: Based on the RSA-911 data standards, suggest the appropriate codes for:
    1. Primary Disability Impact (Mobility, Communication, Self-Care, etc.)
    2. Most Significant Disability (Priority Category 1, 2, or 3)
    3. Recommended VR Services (Counseling, Restoration, Training, etc.)
    
    Output JSON only: { "primaryDisability": string, "priorityCategory": string, "suggestedServices": string[] }
    `;

    // 2. Call AI
    try {
        const response = await aiService.ask({
            prompt: context,
            system: "You are an expert VR Counselor and RSA-911 Compliance Officer.",
            temperature: 0.2,
            isPHISensitive: true // SME: Hard Compliance requirement for PHI
        });

        // 3. Unified Audit Log
        await auditService.log({
            userId: auth.userId!,
            action: 'EXECUTE',
            entityType: 'rsa911_ai_assist',
            entityId: 'suggestion_' + Date.now(),
            details: { intakeId: (intakeData as any).id }
        });

        return { success: true, suggestions: response };
    } catch (error: any) {
        console.error('RSA-911 AI Error:', error);
        
        await auditService.log({
            userId: auth.userId!,
            action: 'ERROR',
            entityType: 'rsa911_ai_assist',
            entityId: 'failed_' + Date.now(),
            details: { error: error.message }
        });

        return { success: false, error: 'AI unavailable' };
    }
}
