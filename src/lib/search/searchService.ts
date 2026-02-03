/**
 * Global Search Service
 * 
 * Provides full-text search across clients, reports, and documents
 */

import { supabase } from '@/lib/supabase/client';

export interface SearchResult {
    type: 'client' | 'report' | 'document';
    id: string;
    title: string;
    subtitle: string;
    link: string;
    metadata?: any;
}

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
 * SECURITY: Sanitize search query (BLUE TEAM REMEDIATION)
 * RED TEAM FINDING: MEDIUM-8 - SQL injection risk in search
 * REMEDIATION: Escape SQL wildcards and remove dangerous characters
 */
function sanitizeSearchQuery(query: string): string {
    if (!query) return '';

    return query
        .replace(/[%_\\]/g, '\\$&') // Escape SQL wildcards
        .replace(/[^\w\s@.-]/g, '') // Remove special chars except safe punctuation
        .substring(0, 100) // Limit length to prevent DoS
        .trim();
}

/**
 * Perform global search
 */
export async function globalSearch(params: {
    query: string;
    filters?: SearchFilters;
    limit?: number;
}): Promise<{ results: SearchResult[]; total: number }> {
    const results: SearchResult[] = [];
    const { query, filters = {}, limit = 20 } = params;

    // SECURITY: Sanitize query to prevent SQL injection
    const sanitizedQuery = sanitizeSearchQuery(query);

    if (!sanitizedQuery) {
        return { results: [], total: 0 };
    }

    // Search clients
    if (!filters.type || filters.type === 'clients' || filters.type === 'all') {
        const { data: clients } = await supabase
            .from('clients')
            .select('id, first_name, last_name, email, phone')
            .or(`first_name.ilike.%${sanitizedQuery}%,last_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
            .limit(limit);

        if (clients) {
            results.push(...clients.map(client => ({
                type: 'client' as const,
                id: client.id,
                title: `${client.first_name} ${client.last_name}`,
                subtitle: client.email || client.phone || '',
                link: `/clients/${client.id}`,
                metadata: client
            })));
        }
    }

    // Search reports/intakes
    if (!filters.type || filters.type === 'reports' || filters.type === 'all') {
        let reportQuery = supabase
            .from('intakes')
            .select('id, status, created_at, clients(first_name, last_name)')
            .limit(limit);

        // Apply filters
        if (filters.status) {
            reportQuery = reportQuery.eq('status', filters.status);
        }
        if (filters.dateRange) {
            reportQuery = reportQuery
                .gte('created_at', filters.dateRange.start)
                .lte('created_at', filters.dateRange.end);
        }
        if (filters.assignedWorker) {
            reportQuery = reportQuery.eq('assigned_worker_id', filters.assignedWorker);
        }

        const { data: reports } = await reportQuery;

        if (reports) {
            results.push(...reports.map(report => {
                const client = Array.isArray(report.clients) ? report.clients[0] : report.clients;
                return {
                    type: 'report' as const,
                    id: report.id,
                    title: `Report for ${client?.first_name || ''} ${client?.last_name || ''}`,
                    subtitle: `Status: ${report.status} | ${new Date(report.created_at).toLocaleDateString()}`,
                    link: `/reports/${report.id}`,
                    metadata: report
                };
            }));
        }
    }

    // Search documents
    if (!filters.type || filters.type === 'documents' || filters.type === 'all') {
        const { data: documents } = await supabase
            .from('documents')
            .select('id, original_filename, category, created_at, client_id')
            .ilike('original_filename', `%${sanitizedQuery}%`)
            .is('deleted_at', null)
            .limit(limit);

        if (documents) {
            results.push(...documents.map(doc => ({
                type: 'document' as const,
                id: doc.id,
                title: doc.original_filename,
                subtitle: `${doc.category || 'Document'} | ${new Date(doc.created_at).toLocaleDateString()}`,
                link: `/clients/${doc.client_id}#documents`,
                metadata: doc
            })));
        }
    }

    return {
        results: results.slice(0, limit),
        total: results.length
    };
}

/**
 * Save search to history
 */
export async function saveSearchHistory(params: {
    userId: string;
    query: string;
    filters?: SearchFilters;
    resultCount: number;
}) {
    await supabase
        .from('search_history')
        .insert({
            user_id: params.userId,
            query: params.query,
            filters: params.filters,
            result_count: params.resultCount
        });
}

/**
 * Get recent searches
 */
export async function getRecentSearches(userId: string, limit = 5) {
    const { data } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    return data || [];
}

/**
 * Save a search for later
 */
export async function saveSearch(params: {
    userId: string;
    name: string;
    query: string;
    filters?: SearchFilters;
}) {
    const { data, error } = await supabase
        .from('saved_searches')
        .insert({
            user_id: params.userId,
            name: params.name,
            query: params.query,
            filters: params.filters
        })
        .select()
        .single();

    return { data, error };
}

/**
 * Get saved searches
 */
export async function getSavedSearches(userId: string) {
    const { data } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    return data || [];
}

/**
 * Delete saved search
 */
export async function deleteSavedSearch(searchId: string) {
    const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);

    return { error };
}
