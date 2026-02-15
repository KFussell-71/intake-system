"use server";

import { clientRepository } from "@/repositories/ClientRepository";
import { revalidatePath } from "next/cache";

import { CaseNoteType } from "@/features/cases/types";
import { aiService } from "@/lib/ai/UnifiedAIService";

export async function saveCaseNoteAction(prevState: any, formData: FormData) {
    const clientId = formData.get('client_id') as string;
    const content = formData.get('content') as string;
    const author_id = (formData.get('author_id') as string) || 'system-validator';

    // Validate type against allowed values
    const rawType = formData.get('type') as string;
    const type: CaseNoteType = ['general', 'clinical', 'incident', 'administrative'].includes(rawType)
        ? rawType as CaseNoteType
        : 'general';

    if (!clientId || !content) {
        return { success: false, message: 'Missing required fields (content/id)' };
    }





    // --- AI Integration (Real Intelligence) ---
    let sentimentLabel: 'positive' | 'neutral' | 'negative' = 'neutral';
    let sentimentScore = 0.0;
    let barriers: string[] = [];

    // Only analyze if there is substantial content to avoid analyzing "test" or "foo"
    if (content.length > 10) {
        try {
            const prompt = `
            Analyze the following social work case note.
            Return ONLY a valid JSON object. Do not include markdown code blocks.
            JSON Format:
            {
              "sentiment": "positive" | "neutral" | "negative",
              "sentiment_score": number (-1.0 to 1.0),
              "barriers": ["Housing", "Employment", "Transportation", "Health", "Childcare", "Legal", "Financial", "Other"] (Select all that apply)
            }
            
            Case Note Content:
            "${content}"
            `;

            const aiResponse = await aiService.ask({
                prompt: prompt,
                temperature: 0.1 // Strict JSON
            });

            // Attempt to clean JSON if it comes wrapped in markdown
            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(cleanJson);

            sentimentLabel = analysis.sentiment || 'neutral';
            sentimentScore = analysis.sentiment_score || 0.0;
            barriers = Array.isArray(analysis.barriers) ? analysis.barriers : [];

        } catch (aiError) {
            console.error('[CaseNoteAction] AI Analysis Failed:', aiError);
            // Fallback to neutral/empty on failure, don't block the save
        }
    }

    try {
        await clientRepository.createCaseNote({
            client_id: clientId,
            author_id,
            content,
            type,
            is_draft: false,
            sentiment_label: sentimentLabel,
            sentiment_score: sentimentScore,
            detected_barriers: barriers
        });



        revalidatePath(`/clients/${clientId}`);
        return { success: true, message: 'Note saved successfully' };
    } catch (error) {
        console.error('Failed to save note:', error);
        return { success: false, message: 'Failed to save note' };
    }
}
