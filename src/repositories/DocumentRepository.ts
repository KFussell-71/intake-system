import { createClient } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Document = Database['public']['Tables']['documents']['Row'];
type NewDocument = Database['public']['Tables']['documents']['Insert'];

export class DocumentRepository {
    static async create(doc: NewDocument): Promise<Document> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('documents')
            .insert(doc)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    static async getByClient(clientId: string): Promise<Document[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('client_id', clientId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    static async delete(id: string): Promise<void> {
        const supabase = createClient();
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
