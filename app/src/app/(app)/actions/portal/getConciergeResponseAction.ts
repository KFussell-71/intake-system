'use server';

import { aiService } from '@/lib/ai/UnifiedAIService';
import { getPortalClientData } from '@/actions/portal/getPortalClientData';
import { auditService } from '@/services/auditService';
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';

/**
 * AI Concierge: Answer participant questions based on their case context.
 * MIGRATED WITH UNIFIED AUDITING
 */
export async function getConciergeResponseAction(userMessage: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    // 1. Fetch deep context for this client using Prisma helper
    const { success, data, error } = await getPortalClientData();
    if (!success || !data) return { success: false, error: error || 'Context unavailable' };

    const { client, intake, milestones, documentRequests } = data;

    // 2. Prepare System Prompt with Context
    const activeMilestone = milestones.find((m: any) => !m.completionDate);
    const pendingDocs = documentRequests?.filter((d: any) => d.status === 'pending') || [];

    const systemPrompt = `
        You are the AI Concierge for ${client.name}'s Participant Portal. 
        Your goal is to provide supportive, accurate, and encouraging information about their case status.

        CLIENT CONTEXT:
        - Name: ${client.name}
        - Current Status: ${intake?.status || 'Active'}
        - Current Phase: ${activeMilestone ? activeMilestone.milestoneName : 'General Services'}
        - Next Goal: ${activeMilestone?.description || 'Continue working with your specialist.'}
        - Pending Tasks: ${pendingDocs.length > 0 ? pendingDocs.map((d: any) => d.name).join(', ') : 'None'}
        - Recent Achievements: ${milestones.filter((m: any) => m.completionDate).slice(0, 3).map((m: any) => m.milestoneName).join(', ')}

        INSTRUCTIONS:
        - Be professional, empathetic, and encouraging.
        - Answer specific questions about their progress based ONLY on the provided context.
        - IF they have pending documents (${pendingDocs.length} pending), remind them gently to upload them in the Documents tab.
        - If you don't know something for sure, suggest they message their caseworker directly via the Message Center.
        - Keep responses concise and focused on the client's success.
    `;

    try {
        const response = await aiService.ask({
            prompt: `${systemPrompt}\n\nClient Question: ${userMessage}`,
            temperature: 0.7
        });

        // 3. Unified Audit Log (AI Interaction)
        await auditService.log({
            userId: auth.userId!,
            action: 'READ',
            entityType: 'ai_concierge',
            entityId: client.id,
            details: { question: userMessage.substring(0, 100) }
        });

        return { success: true, data: response };
    } catch (err: any) {
        console.error('Concierge Error:', err);
        return { success: false, error: err.message };
    }
}
