'use server';

import { aiService } from "@/lib/ai/UnifiedAIService";
import { IntakeFormData } from "@/features/intake/intakeTypes";
import { scrubObject } from "@/lib/security/piiScrubber";
import { PROMPTS } from "@/lib/ai/prompts";
import { sanitizeForPrompt } from "@/lib/ai/sanitizer";
import { verifyAuthentication } from '@/lib/auth/authHelpersServer';

export async function generateNarrativeDraft(rawData: IntakeFormData, type: 'rationale' | 'notes') {
    // Auth Check
    const auth = await verifyAuthentication();
    if (!auth.authenticated) {
        throw new Error("Unauthorized");
    }

    // PURPLE TEAM FIX: Scrub all PII from input data
    const data = scrubObject(rawData);

    // RED TEAM REMEDIATION: Sanitize inputs
    const clientName = sanitizeForPrompt(data.clientName) || 'The participant';

    // SME: Edge-RAG Context Injection (New V4.1)
    // We search for context related to the client's goals and barriers
    const searchQuery = `${data.employmentGoals} ${data.barriers?.join(' ')}`.trim();
    const clinicalContext = await aiService.retrieveClinicalContext(searchQuery);

    const systemPrompt = PROMPTS.NARRATIVE.SYSTEM(clientName);

    // Append context to system prompt if found
    const augmentedSystemPrompt = clinicalContext
        ? `${systemPrompt}\n\n### LOCAL CLINICAL KNOWLEDGE & GUIDELINES:\n${clinicalContext}\n\nINSTRUCTIONS: Use the above context to ground your narrative.`
        : systemPrompt;

    const userPrompt = type === 'rationale'
        ? PROMPTS.NARRATIVE.RATIONALE(data)
        : PROMPTS.NARRATIVE.NOTES(data);

    try {
        const responseText = await aiService.ask({
            prompt: augmentedSystemPrompt + "\n\n" + userPrompt,
            temperature: 0.7,
            isPHISensitive: true
        });

        return responseText.trim();
    } catch (error) {
        console.error("AI Draft Generation Error:", error);
        throw new Error("AI failed to generate draft");
    }
}
