"use server";

import { aiService } from "@/lib/ai/UnifiedAIService";

import { getResources } from "./resourceActions";
import { logSystemAction } from "./memoryActions";
import { AV_RESOURCES } from "../../data/av_resources"; // Fallback if DB fails or empty
import { PROMPTS } from "@/lib/ai/prompts";

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
    const userPrompt = PROMPTS.RESOURCE_COORDINATOR.USER(clientName, rawInput);

    try {
        console.log(`Generating case note using UnifiedAIService`);

        const result = await aiService.generateText({
            prompt: systemPrompt + "\n\n" + userPrompt,
            temperature: 0.1,
            userId: 'system-action'
        });

        const resultText = result.text.trim();

        // Log the successful generation
        await logSystemAction({
            action_type: 'Generation',
            description: `Generated case note for client: ${clientName}`,
            metadata: {
                model: result.model,
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
