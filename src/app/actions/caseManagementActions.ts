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

    try {
        await clientRepository.createCaseNote({
            client_id: clientId,
            author_id: authorId,
            content,
            type,
            is_draft: false
        });

        revalidatePath(`/clients/${clientId}`);
        return { success: true, message: 'Note saved successfully' };
    } catch (error) {
        console.error('Failed to save note:', error);
        return { success: false, message: 'Failed to save note' };
    }
}
