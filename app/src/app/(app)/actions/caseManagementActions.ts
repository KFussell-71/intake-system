"use server";

import { revalidatePath } from "next/cache";
import { CaseNoteType } from "@/features/cases/types";
import { aiService } from "@/lib/ai/UnifiedAIService";
import { verifyAuthentication, prisma } from "@/lib/auth/authHelpersServer";
import { auditService } from "@/services/auditService";

/**
 * Server Action: Save a case note with AI sentiment analysis and auditing.
 * MIGRATED TO PRISMA
 */
export async function saveCaseNoteAction(prevState: any, formData: FormData) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, message: 'Unauthorized' };
    }

    const clientId = formData.get('client_id') as string;
    const content = formData.get('content') as string;
    const author_id = (formData.get('author_id') as string) || auth.userId;

    // Validate type against allowed values
    const rawType = formData.get('type') as string;
    const type: CaseNoteType = ['general', 'clinical', 'incident', 'administrative'].includes(rawType)
        ? rawType as CaseNoteType
        : 'general';

    if (!clientId || !content) {
        return { success: false, message: 'Missing required fields (content/id)' };
    }

    // --- AI Integration ---
    let sentimentLabel: 'positive' | 'neutral' | 'negative' = 'neutral';
    let sentimentScore = 0.0;
    let barriers: string[] = [];

    if (content.length > 10) {
        try {
            const prompt = `
            Analyze the following social work case note.
            Return ONLY a valid JSON object. Do not include markdown code blocks.
            JSON Format:
            {
              "sentiment": "positive" | "neutral" | "negative",
              "sentiment_score": number (-1.0 to 1.0),
              "barriers": ["Housing", "Employment", "Transportation", "Health", "Childcare", "Legal", "Financial", "Other"]
            }
            
            Case Note Content:
            "${content}"
            `;

            const aiResponse = await aiService.ask({
                prompt: prompt,
                temperature: 0.1
            });

            const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const analysis = JSON.parse(cleanJson);

            sentimentLabel = analysis.sentiment || 'neutral';
            sentimentScore = analysis.sentiment_score || 0.0;
            barriers = Array.isArray(analysis.barriers) ? analysis.barriers : [];

        } catch (aiError) {
            console.error('[CaseNoteAction] AI Analysis Failed:', aiError);
        }
    }

    try {
        const note = await prisma.$transaction(async (tx: any) => {
            // 1. Ensure Case exists for this client (upsert matching legacy behavior)
            let caseRecord = await tx.case.findFirst({
                where: { clientId: clientId, status: 'active' }
            });

            if (!caseRecord) {
                caseRecord = await tx.case.create({
                    data: { clientId: clientId, status: 'active' }
                });
            }

            // 2. Create Note
            const newNote = await tx.caseNote.create({
                data: {
                    clientId: clientId,
                    caseId: caseRecord.id,
                    authorId: author_id,
                    content: content,
                    type: type,
                    isDraft: false,
                    sentimentLabel: sentimentLabel,
                    sentimentScore: sentimentScore,
                    detectedBarriers: barriers
                }
            });

            // 3. Audit Log (via global audit service)
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'case_note',
                entityId: newNote.id,
                details: {
                    clientId,
                    type,
                    sentiment: sentimentLabel,
                    barriersFound: barriers.length
                }
            });

            return newNote;
        });

        revalidatePath(`/clients/${clientId}`);
        return { success: true, message: 'Note saved successfully', id: note.id };
    } catch (error: any) {
        console.error('Failed to save note:', error);
        return { success: false, message: error.message || 'Failed to save note' };
    }
}
