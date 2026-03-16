/**
 * ARCHITECTURE: Base Repository
 * MIGRATED TO PRISMA
 * 
 * Centralizes the Prisma client access and provides standard 
 * error handling patterns.
 */

import { prisma } from '@/lib/auth/authHelpersServer';

export abstract class BaseRepository {
    /**
     * Access to the Prisma client
     */
    protected get db() {
        return prisma;
    }

    /**
     * Standard error handler for repository operations.
     * Throws errors to be handled by the Action/Route level
     * where ErrorTranslator will sanitize them for the UI.
     */
    protected handleError(error: Error, context?: string): never {
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
