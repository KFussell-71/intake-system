"use server";

import { aiService } from "@/lib/ai/UnifiedAIService";

import { getResources } from "./resourceActions";
import { logSystemAction } from "./memoryActions";
import { AV_RESOURCES } from "../../data/av_resources"; // Fallback if DB fails or empty
import { PROMPTS } from "@/lib/ai/prompts";
import { sanitizeForPrompt } from "@/lib/ai/sanitizer";
import { scrubPII } from "@/lib/security/piiScrubber";

export async function generateCaseNote(rawInput: string, type: string, clientName: string) {
    // Determine if this is a "Resource Coordination" request or a "Clinical Note" request
    // The previous implementation assumed everything was "Resource Coordinator".
    // We'll use the 'type' to distinguish. 
    // If type is SOAP, DAP, BIRP, or General, use CLINICAL_NOTE.
    // If implied Resource Linkage (legacy), use RESOURCE_COORDINATOR.

    const isClinicalNote = ['SOAP', 'DAP', 'BIRP', 'General'].includes(type) || type === 'Clinical';

    let systemPrompt = "";
    let userPrompt = "";
    let resources: any[] = [];

    // RED TEAM REMEDIATION: Sanitize user input to prevent Prompt Injection
    // PURPLE TEAM REMEDIATION: Scrub PII before sending to AI
    const cleanClientName = sanitizeForPrompt(scrubPII(clientName));
    const cleanInput = sanitizeForPrompt(scrubPII(rawInput));

    if (isClinicalNote) {
        systemPrompt = PROMPTS.CLINICAL_NOTE.SYSTEM(type);
        userPrompt = PROMPTS.CLINICAL_NOTE.USER(cleanClientName, cleanInput);
    } else {
        // Legacy / Resource Coordinator Flow

        // Fetch resources from DB dynamically
        // Note: Using 'any' cast for now as resourceActions return type might vary in strict mode
        // In real impl, import Resource type.
        const dbResources = await getResources();
        resources = dbResources || [];

        // Fallback to static file if DB returns empty
        if (!resources || resources.length === 0) {
            console.warn("Using static AV_RESOURCES fallback");
            resources = AV_RESOURCES;
        }

        // Construct the resource map string
        const resourceMapString = resources.map((r: any) =>
            `- ${r.name} (${r.address}). Phone: ${r.phone}. Notes: ${r.notes} [Triggers: ${r.triggers?.join(", ")}]`
        ).join("\n");

        systemPrompt = PROMPTS.RESOURCE_COORDINATOR.SYSTEM(type, resourceMapString);
        userPrompt = PROMPTS.RESOURCE_COORDINATOR.USER(cleanClientName, cleanInput);
    }

    try {
        console.log(`Generating ${isClinicalNote ? 'Clinical Note' : 'Resource Plan'} using UnifiedAIService`);

        const responseText = await aiService.ask({
            prompt: systemPrompt + "\n\n" + userPrompt,
            temperature: isClinicalNote ? 0.3 : 0.1, // Slightly more creative for phrasing notes, strict for resources
        });

        const resultText = responseText.trim();

        // Log the successful generation
        await logSystemAction({
            action_type: 'Generation',
            description: `Generated ${type} for client: ${clientName}`,
            metadata: {
                model: 'unified-ai',
                type,
                mode: isClinicalNote ? 'clinical' : 'resource',
                prompt_length: systemPrompt.length + userPrompt.length,
                response_length: resultText.length
            }
        });

        return resultText;
    } catch (error: any) {
        console.error("AI Note Generation Error:", error);

        // Log the failure
        await logSystemAction({
            action_type: 'Correction',
            description: `Failed to generate ${type} for client: ${clientName}`,
            metadata: { error: error.message }
        });

        throw new Error("AI failed to generate note. Ensure AI Service is available.");
    }
}
