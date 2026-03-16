"use server";

import { aiService } from "@/lib/ai/UnifiedAIService";
import { IntelligenceController } from "@/domain/services/IntelligenceController";

import { getResources } from "./resourceActions";
import { AV_RESOURCES } from "@/data/av_resources"; 
import { PROMPTS } from "@/lib/ai/prompts";
import { sanitizeForPrompt } from "@/lib/ai/sanitizer";
import { scrubPII } from "@/lib/security/piiScrubber";
import { auditService } from "@/services/auditService";
import { verifyAuthentication } from "@/lib/auth/authHelpersServer";

/**
 * Server Action: Generate Case Note using AI.
 * MIGRATED WITH UNIFIED AUDITING
 */
export async function generateCaseNote(rawInput: string, type: string, clientName: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    const isClinicalNote = ['SOAP', 'DAP', 'BIRP', 'General'].includes(type) || type === 'Clinical';

    let systemPrompt = "";
    let userPrompt = "";
    let resources: any[] = [];

    // RED TEAM REMEDIATION: Sanitize user input
    // PURPLE TEAM REMEDIATION: Scrub PII
    const cleanClientName = sanitizeForPrompt(scrubPII(clientName));
    const cleanInput = sanitizeForPrompt(scrubPII(rawInput));

    if (isClinicalNote) {
        systemPrompt = PROMPTS.CLINICAL_NOTE.SYSTEM(type);
        userPrompt = PROMPTS.CLINICAL_NOTE.USER(cleanClientName, cleanInput);
    } else {
        // Fetch resources from DB dynamically
        const dbResources = await getResources();
        resources = dbResources || [];

        // Fallback to static file if DB returns empty
        if (!resources || resources.length === 0) {
            resources = AV_RESOURCES;
        }

        const resourceMapString = resources.map((r: any) =>
            `- ${r.name} (${r.address}). Phone: ${r.phone}. Notes: ${r.notes}`
        ).join("\n");

        systemPrompt = PROMPTS.RESOURCE_COORDINATOR.SYSTEM(type, resourceMapString);
        userPrompt = PROMPTS.RESOURCE_COORDINATOR.USER(cleanClientName, cleanInput);
    }

    try {
        const resultText = await IntelligenceController.execute({
            prompt: systemPrompt + "\n\n" + userPrompt,
            temperature: isClinicalNote ? 0.3 : 0.1,
            isPHISensitive: isClinicalNote,
            context: { type, clientName }
        });

        // Unified Audit Log (Replacing legacy logSystemAction)
        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'ai_generation',
            entityId: 'note_' + Date.now(),
            details: {
                type,
                mode: isClinicalNote ? 'clinical' : 'resource',
                responseLength: resultText.length
            }
        });

        return resultText;
    } catch (error: any) {
        console.error("AI Note Generation Error:", error);

        // Audit the failure
        await auditService.log({
            userId: auth.userId,
            action: 'ERROR',
            entityType: 'ai_generation',
            entityId: 'failed_note_' + Date.now(),
            details: { error: error.message, type }
        });

        throw new Error("AI failed to generate note. Ensure AI Service is available.");
    }
}
