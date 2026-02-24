import { supabase } from '@/lib/supabase';
import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

/**
 * ARCHITECTURE: Base Repository
 * 
 * Centralizes the Supabase client access and provides standard 
 * error handling patterns.
 */
export abstract class BaseRepository {
    /**
     * Access to the Supabase client
     */
    protected get db(): SupabaseClient {
        return supabase;
    }

    /**
     * Standard error handler for repository operations.
     * Throws errors to be handled by the Action/Route level
     * where ErrorTranslator will sanitize them for the UI.
     */
    protected handleError(error: PostgrestError | Error, context?: string): never {
        const message = context ? `[${context}] ${error.message}` : error.message;

        // Internal logging
        if (typeof window === 'undefined') {
            console.error(`[DB_ERROR] ${message}`, {
                error,
                timestamp: new Date().toISOString()
            });
        }

        throw error;
    }
}
