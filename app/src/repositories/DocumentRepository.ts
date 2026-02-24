import { BaseRepository } from './BaseRepository';
import { Database } from '@/types/supabase';

type Document = Database['public']['Tables']['documents']['Row'];
type NewDocument = Database['public']['Tables']['documents']['Insert'];

export class DocumentRepository extends BaseRepository {
    async create(doc: NewDocument): Promise<Document> {
        const { data, error } = await this.db
            .from('documents')
            .insert(doc)
            .select()
            .single();

        if (error) this.handleError(error, 'DocumentRepository.create');
        return data;
    }

    async getByClient(clientId: string): Promise<Document[]> {
        const { data, error } = await this.db
            .from('documents')
            .select('*')
            .eq('client_id', clientId)
            .order('uploaded_at', { ascending: false });

        if (error) this.handleError(error, 'DocumentRepository.getByClient');
        return data;
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.db
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) this.handleError(error, 'DocumentRepository.delete');
    }
}

export const documentRepository = new DocumentRepository();

