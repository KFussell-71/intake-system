"use server";

import { aiService } from "@/lib/ai/UnifiedAIService";

import { getResources } from "./resourceActions";
import { logSystemAction } from "./memoryActions";
import { AV_RESOURCES } from "../../data/av_resources"; // Fallback if DB fails or empty
import { PROMPTS } from "@/lib/ai/prompts";
import { sanitizeForPrompt } from "@/lib/ai/sanitizer";
import { scrubPII } from "@/lib/security/piiScrubber";

export async function generateCaseNote(rawInput: string, type: 'SOAP' | 'DAP' | 'General', clientName: string) {
    // Fetch resources from DB dynamically
    let resources = await getResources();

    // Fallback to static file if DB returns empty (e.g. migration not run yet)
    if (!resources || resources.length === 0) {
        console.warn("Using static AV_RESOURCES fallback");
        resources = AV_RESOURCES;
    }

    // Construct the resource map string for the system prompt
    const resourceMapString = resources.map(r =>
        `- ${r.name} (${r.address}). Phone: ${r.phone}. Notes: ${r.notes} [Triggers: ${r.triggers?.join(", ")}]`
    ).join("\n");

    const systemPrompt = PROMPTS.RESOURCE_COORDINATOR.SYSTEM(type, resourceMapString);
    // RED TEAM REMEDIATION: Sanitize user input to prevent Prompt Injection
    // PURPLE TEAM REMEDIATION: Scrub PII before sending to AI
    const userPrompt = PROMPTS.RESOURCE_COORDINATOR.USER(
        sanitizeForPrompt(scrubPII(clientName)),
        sanitizeForPrompt(scrubPII(rawInput))
    );

    try {
        console.log(`Generating case note using UnifiedAIService`);

        // UnifiedAIService.ask returns a string directly
        const responseText = await aiService.ask({
            prompt: systemPrompt + "\n\n" + userPrompt,
            temperature: 0.1,
            // userId: 'system-action' // AIRequest might not support userId, verify types if needed, but safe to omit if not used by ask
        });

        const resultText = responseText.trim();

        // Log the successful generation
        await logSystemAction({
            action_type: 'Generation',
            description: `Generated case note for client: ${clientName}`,
            metadata: {
                model: 'unified-ai', // Model info not returned by ask()
                type,
                resource_count: resources?.length || 0,
                prompt_length: systemPrompt.length + userPrompt.length,
                response_length: resultText.length
            }
        });

        return resultText;
    } catch (error: any) {
        console.error("AI Note Generation Error:", error);

        // Log the failure
        await logSystemAction({
            action_type: 'Correction', // logging as correction/error
            description: `Failed to generate case note for client: ${clientName}`,
            metadata: { error: error.message }
        });

        throw new Error("AI failed to generate note. Ensure AI Service is available.");
    }
}
