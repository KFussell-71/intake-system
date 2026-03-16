import { createClient } from '@/lib/supabase/browser';
import { clinicalNoteRepository, ClinicalNoteRepository } from '../repositories/ClinicalNoteRepository';
import { ClinicalNote, ClinicalNoteFormData } from '@/types/clinical_note';

export class ClinicalNoteService {
    private get supabase() {
        return createClient();
    }
    constructor(private readonly repo: ClinicalNoteRepository = clinicalNoteRepository) { }

    async getNotesForClient(clientId: string): Promise<ClinicalNote[]> {
        return await this.repo.getNotesByClient(clientId);
    }

    async createNote(clientId: string, data: ClinicalNoteFormData): Promise<ClinicalNote> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        return await this.repo.createNote(clientId, user.id, data);
    }

    async updateNote(id: string, data: Partial<ClinicalNoteFormData>): Promise<ClinicalNote> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        // The repository handles the is_finalized check
        return await this.repo.updateNote(id, user.id, data);
    }

    async finalizeNote(id: string, signature: string): Promise<ClinicalNote> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        return await this.repo.finalizeNote(id, user.id, signature);
    }

    async createAddendum(clientId: string, parentNoteId: string, data: ClinicalNoteFormData): Promise<ClinicalNote> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        return await this.repo.createNote(clientId, user.id, {
            ...data,
            extra_data: {
                ...data.extra_data,
                is_addendum: true,
                parent_note_id: parentNoteId
            }
        });
    }
}

export const clinicalNoteService = new ClinicalNoteService();
