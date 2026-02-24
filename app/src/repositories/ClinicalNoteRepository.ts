import { BaseRepository } from './BaseRepository';
import { ClinicalNote, ClinicalNoteFormData } from '@/types/clinical_note';

export class ClinicalNoteRepository extends BaseRepository {
    async getNoteById(id: string): Promise<ClinicalNote | null> {
        const { data, error } = await this.db
            .from('clinical_notes')
            .select(`
                *,
                author:profiles(first_name, last_name, username)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as any;
    }

    async getNotesByClient(clientId: string): Promise<ClinicalNote[]> {
        const { data, error } = await this.db
            .from('clinical_notes')
            .select(`
                *,
                author:profiles(first_name, last_name, username)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as any[];
    }

    async createNote(clientId: string, authorId: string, data: ClinicalNoteFormData): Promise<ClinicalNote> {
        const { data: note, error } = await this.db
            .from('clinical_notes')
            .insert({
                client_id: clientId,
                author_id: authorId,
                ...data,
                is_finalized: false
            })
            .select()
            .single();

        if (error) throw error;
        return note as any;
    }

    async updateNote(id: string, authorId: string, data: Partial<ClinicalNoteFormData>): Promise<ClinicalNote> {
        const { data: note, error } = await this.db
            .from('clinical_notes')
            .update(data)
            .eq('id', id)
            .eq('author_id', authorId)
            .eq('is_finalized', false) // Integrity check at repo level
            .select()
            .single();

        if (error) {
            if (error.message?.includes('0 rows')) {
                throw new Error('Note is finalized or you are not the author');
            }
            throw error;
        }
        return note as any;
    }

    async finalizeNote(id: string, authorId: string, signature: string): Promise<ClinicalNote> {
        const { data: note, error } = await this.db
            .from('clinical_notes')
            .update({
                is_finalized: true,
                finalized_at: new Date().toISOString(),
                signature
            })
            .eq('id', id)
            .eq('author_id', authorId)
            .eq('is_finalized', false)
            .select()
            .single();

        if (error) throw error;
        return note as any;
    }
}

export const clinicalNoteRepository = new ClinicalNoteRepository();
