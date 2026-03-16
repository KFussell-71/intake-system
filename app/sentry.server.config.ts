import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: 0.1,

    // Server-specific configuration
    beforeSend(event) {
        // Filter database connection strings
        if (event.exception?.values) {
            event.exception.values = event.exception.values.map(exception => {
                if (exception.value) {
                    // Filter PostgreSQL connection strings
                    exception.value = exception.value.replace(
                        /postgresql:\/\/[^@]+@/g,
                        'postgresql://[FILTERED]@'
                    );
                    // Filter Supabase URLs with keys
                    exception.value = exception.value.replace(
                        /supabase\.co\/[^/]+\/[a-zA-Z0-9_-]+/g,
                        'supabase.co/[FILTERED]/[FILTERED]'
                    );
                }
                return exception;
            });
        }

        // Filter environment variables from context
        if (event.contexts?.runtime?.env) {
            const filtered: Record<string, string> = {};
            for (const [key, value] of Object.entries(event.contexts.runtime.env)) {
                if (key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')) {
                    filtered[key] = '[FILTERED]';
                } else {
                    filtered[key] = value as string;
                }
            }
            event.contexts.runtime.env = filtered;
        }

        return event;
    },
});
