/**
 * HIPAA-Compliant Logging Utility
 * 
 * Automatically redacts PHI/PII from logs to prevent HIPAA violations
 * Use this instead of console.log/error/warn for any data that might contain PHI
 */

const PHI_FIELDS = [
    'ssn',
    'social_security_number',
    'dob',
    'date_of_birth',
    'medical_record_number',
    'diagnosis',
    'medications',
    'treatment_plan',
    'phone',
    'email',
    'address',
    'street',
    'city',
    'zip',
    'postal_code'
];

/**
 * Recursively sanitize an object by redacting PHI fields
 */
function sanitizeForLogging(data: any): any {
    if (!data) return data;

    // Handle arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeForLogging(item));
    }

    // Handle objects
    if (typeof data === 'object') {
        const sanitized: any = {};

        for (const [key, value] of Object.entries(data)) {
            // Check if this field should be redacted
            const shouldRedact = PHI_FIELDS.some(field =>
                key.toLowerCase().includes(field.toLowerCase())
            );

            if (shouldRedact) {
                sanitized[key] = '[REDACTED-PHI]';
            } else if (typeof value === 'object') {
                // Recursively sanitize nested objects
                sanitized[key] = sanitizeForLogging(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    return data;
}

/**
 * HIPAA-compliant logger
 * Use this instead of console.log/error/warn
 */
export const hipaaLogger = {
    info: (message: string, data?: any) => {
        if (data) {
            console.log(message, sanitizeForLogging(data));
        } else {
            console.log(message);
        }
    },

    error: (message: string, error?: any) => {
        if (error) {
            console.error(message, sanitizeForLogging(error));
        } else {
            console.error(message);
        }
    },

    warn: (message: string, data?: any) => {
        if (data) {
            console.warn(message, sanitizeForLogging(data));
        } else {
            console.warn(message);
        }
    },

    debug: (message: string, data?: any) => {
        if (process.env.NODE_ENV === 'development') {
            if (data) {
                console.debug(message, sanitizeForLogging(data));
            } else {
                console.debug(message);
            }
        }
    }
};

/**
 * Sanitize function for use in other contexts
 */
export { sanitizeForLogging };
