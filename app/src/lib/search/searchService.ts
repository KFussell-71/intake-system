/**
 * Global Search Service (Refactored)
 * 
 * Proxies search requests to Server Actions to remove Supabase browser dependency.
 */

import { globalSearchAction, SearchResult } from '@/app/(app)/actions/searchActions';

export interface SearchFilters {
    type?: 'clients' | 'reports' | 'documents' | 'all';
    status?: string;
    dateRange?: {
        start: string;
        end: string;
    };
    assignedWorker?: string;
}

/**
 * Perform global search
 */
export async function globalSearch(params: {
    query: string;
    filters?: SearchFilters;
    limit?: number;
}): Promise<{ results: SearchResult[]; total: number }> {
    const { query, filters = {}, limit = 20 } = params;

    const result = await globalSearchAction(query, filters.type, limit);
    
    if (result.success && result.results) {
        return { 
            results: result.results, 
            total: result.total || 0 
        };
    }

    return { results: [], total: 0 };
}

/**
 * Save search to history (NOP - Migrating to server-side logging via AuditService)
 */
export async function saveSearchHistory(params: {
    userId: string;
    query: string;
    filters?: SearchFilters;
    resultCount: number;
}) {
    // AuditService handles this now in globalSearchAction
    console.log('Search history recorded in audit trail');
}

/**
 * Get recent searches (Placeholder - Audit logs can be queried if needed)
 */
export async function getRecentSearches(userId: string, limit = 5) {
    return [];
}
