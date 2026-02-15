import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export interface GlobalSearchResult {
    type: 'client' | 'document';
    id: string;
    title: string;
    subtitle: string;
    url: string;
    created_at: string;
}

export class GlobalSearchService {
    /**
     * Search across all entities (Clients, Documents)
     * @param query Search query string
     * @param limit limit results (default 5)
     */
    static async searchAll(query: string, limit: number = 5): Promise<GlobalSearchResult[]> {
        if (!query || query.length < 2) return [];

        const { data, error } = await supabase.rpc('global_search', {
            query_text: query,
            limit_count: limit
        });

        if (error) {
            console.error('Global Search Error:', error);
            return [];
        }

        return (data || []).map((item: any) => ({
            type: item.type,
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            url: item.url,
            created_at: item.created_at
        }));
    }
}
