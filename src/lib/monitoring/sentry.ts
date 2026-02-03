/**
 * Sentry Monitoring Utilities
 * 
 * Provides helper functions for error tracking, performance monitoring,
 * and user context management with Sentry.
 */

import * as Sentry from '@sentry/nextjs';

// ============================================
// User Context
// ============================================

/**
 * Set user context for error tracking
 * Call this after user authentication
 */
export function setUserContext(user: {
    id: string;
    email: string;
    role: string;
}) {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role
    });
}

/**
 * Clear user context on logout
 */
export function clearUserContext() {
    Sentry.setUser(null);
}

// ============================================
// Breadcrumbs
// ============================================

/**
 * Add a breadcrumb for debugging context
 */
export function addBreadcrumb(
    message: string,
    data?: Record<string, any>,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info'
) {
    Sentry.addBreadcrumb({
        message,
        data,
        level
    });
}

// ============================================
// Error Capture
// ============================================

/**
 * Capture an error with additional context
 */
export function captureError(
    error: Error,
    context?: Record<string, any>,
    level: 'error' | 'warning' | 'info' = 'error'
) {
    Sentry.captureException(error, {
        level,
        extra: context
    });
}

/**
 * Capture a message (non-error event)
 */
export function captureMessage(
    message: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, any>
) {
    Sentry.captureMessage(message, {
        level,
        extra: context
    });
}

// ============================================
// Performance Monitoring
// ============================================

/**
 * Measure a specific operation with automatic span creation
 */
export async function measureOperation<T>(
    name: string,
    operation: () => Promise<T>
): Promise<T> {
    return Sentry.startSpan(
        {
            name,
            op: 'function'
        },
        async () => {
            return await operation();
        }
    );
}

// ============================================
// Tags
// ============================================

/**
 * Set a tag for filtering errors
 */
export function setTag(key: string, value: string) {
    Sentry.setTag(key, value);
}

/**
 * Set multiple tags at once
 */
export function setTags(tags: Record<string, string>) {
    Sentry.setTags(tags);
}

// ============================================
// Context
// ============================================

/**
 * Set additional context for errors
 */
export function setContext(name: string, context: Record<string, any>) {
    Sentry.setContext(name, context);
}
