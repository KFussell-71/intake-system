
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

export type CommunityResource = {
    id: string;
    name: string;
    category: 'Food' | 'Housing' | 'Employment' | 'Health' | 'Legal' | 'Education' | 'Other';
    description: string;
    address: string;
    phone: string;
    website: string;
    is_verified: boolean;
    source: string;
    tags: string[];
};

export class ResourceService {
    static async searchResources(query: string, category?: string): Promise<CommunityResource[]> {
        const supabase = createClient();

        let dbQuery = supabase
            .from('community_resources')
            .select('*')
            .eq('is_verified', true);

        if (category) {
            dbQuery = dbQuery.eq('category', category);
        }

        // Simple text search on name/description if query provided
        if (query) {
            dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
        }

        const { data, error } = await dbQuery;

        if (error) throw new Error(error.message);
        return data || [];
    }

    static async addResource(resource: Omit<CommunityResource, 'id'>) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('community_resources')
            .insert(resource)
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    static async getAll() {
        const supabase = createClient();
        const { data, error } = await supabase.from('community_resources').select('*');
        if (error) throw new Error(error.message);
        return data;
    }
}
