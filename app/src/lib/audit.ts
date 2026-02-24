import { createClient } from '@/lib/supabase/server';

/**
 * SECURITY: Audit Logging Utility
 * 
 * This module provides centralized audit logging for security-sensitive operations.
 * All critical actions (report generation, approvals, data modifications) should be logged.
 * 
 * Logs are written to the audit_logs table with the following structure:
 * - user_id: The authenticated user performing the action
 * - action: CREATE, READ, UPDATE, DELETE
 * - entity_type: The type of entity being acted upon
 * - entity_id: The ID of the entity
 * - details: Additional context as JSONB
 */

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
    action: AuditAction;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
}

/**
 * Logs an action to the audit_logs table.
 * 
 * @param entry - The audit log entry to record
 * @returns Promise<boolean> - Returns true if logging succeeded, false otherwise
 * 
 * SECURITY NOTE: This function should never throw or block the main operation.
 * Audit logging failures are logged to console but do not interrupt user workflows.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<boolean> {
    try {
        const supabase = await createClient();

        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('[AUDIT] Cannot log event - no authenticated user');
            return false;
        }

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                user_id: user.id,
                action: entry.action,
                entity_type: entry.entityType,
                entity_id: entry.entityId,
                details: entry.details || {}
            });

        if (error) {
            console.error('[AUDIT] Failed to write audit log:', error);
            return false;
        }

        return true;
    } catch (err) {
        // SECURITY: Never let audit logging failures interrupt the application
        console.error('[AUDIT] Exception during audit logging:', err);
        return false;
    }
}

/**
 * Convenience function for logging report generation events.
 */
export async function logReportGenerated(clientId: string, reportVersionId: string): Promise<boolean> {
    return logAuditEvent({
        action: 'CREATE',
        entityType: 'report_version',
        entityId: reportVersionId,
        details: {
            client_id: clientId,
            generated_at: new Date().toISOString()
        }
    });
}

/**
 * Convenience function for logging report approval events.
 */
export async function logReportApproved(intakeId: string, status: string): Promise<boolean> {
    return logAuditEvent({
        action: 'UPDATE',
        entityType: 'intake',
        entityId: intakeId,
        details: {
            new_status: status,
            approved_at: new Date().toISOString()
        }
    });
}

/**
 * Convenience function for logging document uploads.
 */
export async function logDocumentUploaded(clientId: string, filePath: string): Promise<boolean> {
    return logAuditEvent({
        action: 'CREATE',
        entityType: 'document',
        entityId: filePath,
        details: {
            client_id: clientId,
            uploaded_at: new Date().toISOString()
        }
    });
}

/**
 * Convenience function for logging follow-up status changes.
 */
export async function logFollowUpStatusChanged(followUpId: string, newStatus: string): Promise<boolean> {
    return logAuditEvent({
        action: 'UPDATE',
        entityType: 'follow_up',
        entityId: followUpId,
        details: {
            new_status: newStatus,
            changed_at: new Date().toISOString()
        }
    });
}
