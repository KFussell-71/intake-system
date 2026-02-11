import { aiService } from "@/lib/ai/UnifiedAIService";
import { IntakeFormData } from "@/features/intake/types/intake";
import { scrubObject } from "@/lib/security/piiScrubber";
import { PROMPTS } from "@/lib/ai/prompts";
import { sanitizeForPrompt } from "@/lib/ai/sanitizer";

export async function generateNarrativeDraft(rawData: IntakeFormData, type: 'rationale' | 'notes') {
    // PURPLE TEAM FIX: Scrub all PII from input data
    const data = scrubObject(rawData);

    // Use Unified AI Service (Works with Ollama or Gemini)
    // No direct API key check needed here, the service handles it.

    // RED TEAM REMEDIATION: Sanitize inputs
    const systemPrompt = PROMPTS.NARRATIVE.SYSTEM(sanitizeForPrompt(data.clientName) || 'The participant');

    const userPrompt = type === 'rationale'
        ? PROMPTS.NARRATIVE.RATIONALE(data)
        : PROMPTS.NARRATIVE.NOTES(data);

    try {
        const result = await aiService.generateText({
            prompt: systemPrompt + "\n\n" + userPrompt,
            temperature: 0.7,
            userId: 'system-action' // Internal system call
        });

        return result.text.trim();
    } catch (error) {
        console.error("AI Draft Generation Error:", error);
        throw new Error("AI failed to generate draft");
    }
}
