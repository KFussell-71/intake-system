import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Filter sensitive data
    beforeSend(event, hint) {
        // Remove cookies and auth headers
        if (event.request) {
            delete event.request.cookies;
            if (event.request.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }
        }

        // Filter PII from breadcrumbs
        if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
                if (breadcrumb.data) {
                    // Filter email addresses
                    if (breadcrumb.data.email) {
                        breadcrumb.data.email = '[FILTERED]';
                    }
                    // Filter names
                    if (breadcrumb.data.name) {
                        breadcrumb.data.name = '[FILTERED]';
                    }
                    // Filter phone numbers
                    if (breadcrumb.data.phone) {
                        breadcrumb.data.phone = '[FILTERED]';
                    }
                }
                return breadcrumb;
            });
        }

        return event;
    },

    // Ignore common errors
    ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        // Random plugins/extensions
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        // Network errors
        'NetworkError',
        'Network request failed',
    ],
});
