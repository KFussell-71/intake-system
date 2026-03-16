/**
 * Error Sanitization Service
 * 
 * Prevents internal implementation details (SQL errors, UUIDs, stack traces) 
 * from leaking to the end user while maintaining helpful feedback.
 */

export interface TranslatedError {
    message: string;
    code: string;
    severity: 'ERROR' | 'WARN' | 'INFO';
}

const ERROR_MAP: Record<string, string> = {
    '23505': 'This item already exists in the system.',
    '23503': 'This action cannot be completed because the related record is missing.',
    '42P01': 'The requested data service is temporarily unavailable.',
    'P0001': 'Authorization failed: You do not have permission for this resource.',
    'PGRST116': 'The requested record was not found.',
    'auth/invalid-credential': 'Invalid login credentials provided.',
    'not-found': 'The requested resource was not found.',
    'unauthorized': 'You must be logged in to access this feature.',
    'forbidden': 'Your account level does not allow this action.'
};

export function translateError(error: any): TranslatedError {
    // 1. Handle Supabase/Postgrest Errors
    const errorCode = error?.code || error?.status || 'unknown';
    const message = ERROR_MAP[errorCode] || 'An unexpected error occurred. Please contact support.';

    // 2. Log original error for internal monitoring (Server Side Only)
    if (typeof window === 'undefined') {
        console.error('[SECURITY_ERROR_REMAP]', {
            originalCode: errorCode,
            originalMessage: error?.message,
            timestamp: new Date().toISOString()
        });
    }

    return {
        message,
        code: errorCode,
        severity: 'ERROR'
    };
}

/**
 * Safe result wrapper for server actions
 */
export async function withSafeError<T>(promise: Promise<T>) {
    try {
        const data = await promise;
        return { data, error: null };
    } catch (e: any) {
        return { data: null, error: translateError(e) };
    }
}
