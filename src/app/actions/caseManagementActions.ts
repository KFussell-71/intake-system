"use server";

import { clientRepository } from "@/repositories/ClientRepository";
import { revalidatePath } from "next/cache";

import { CaseNoteType } from "@/features/cases/types";

export async function saveCaseNoteAction(prevState: any, formData: FormData) {
    const clientId = formData.get('client_id') as string;
    const authorId = formData.get('author_id') as string;
    const content = formData.get('content') as string;
    // Validate type against allowed values
    const rawType = formData.get('type') as string;
    const type: CaseNoteType = ['general', 'clinical', 'incident', 'administrative'].includes(rawType)
        ? rawType as CaseNoteType
        : 'general';


    if (!clientId || !authorId || !content) {
        return { success: false, message: 'Missing required fields' };
    }


    // --- AI Simulation Logic (MVP) ---
    let sentimentLabel: 'positive' | 'neutral' | 'negative' = 'neutral';
    let sentimentScore = 0.0;
    const barriers: string[] = [];
    const lowerContent = content.toLowerCase();

    // Sentiment Heuristic
    if (lowerContent.match(/crisis|risk|danger|suicid|threat|fail|evict|homeless|arrest|hospital/)) {
        sentimentLabel = 'negative';
        sentimentScore = -0.8;
    } else if (lowerContent.match(/success|great|good|improve|stable|hired|graduated|safe/)) {
        sentimentLabel = 'positive';
        sentimentScore = 0.8;
    }

    // Barrier Detection Heuristic
    if (lowerContent.match(/homeless|eviction|rent|housing|shelter/)) barriers.push('Housing');
    if (lowerContent.match(/job|work|employ|fired|interview|resume/)) barriers.push('Employment');
    if (lowerContent.match(/transport|bus|car|ride/)) barriers.push('Transportation');
    if (lowerContent.match(/health|sick|doctor|medication|hospital/)) barriers.push('Health');
    if (lowerContent.match(/childcare|kids|school/)) barriers.push('Childcare');

    try {
        await clientRepository.createCaseNote({
            client_id: clientId,
            author_id: authorId,
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
