// Removed unused import of prisma
import { auditService } from '@/services/auditService';

/**
 * ARCHITECTURE: Audit Logging Utility
 * MIGRATED TO PRISMA
 * 
 * Centralizes the audit logging via the Prisma-backed AuditService.
 */

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'SIGN';

export interface AuditLogEntry {
    action: AuditAction;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
}

/**
 * Logs an action to the audit trail using Prisma.
 * This is a wrapper around the unified auditService for backward compatibility.
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<boolean> {
    try {
        // Attempt to find the user via auth context if not provided
        // Since this is a library util, it assumes it's called within a server context
        const { verifyAuthentication } = await import('@/lib/auth/authHelpersServer');
        const auth = await verifyAuthentication();

        if (!auth.authenticated || !auth.userId) {
            console.warn('[AUDIT] Cannot log event - no authenticated user');
            return false;
        }

        const result = await auditService.log({
            userId: auth.userId,
            action: entry.action,
            entityType: entry.entityType,
            entityId: entry.entityId,
            details: entry.details || {}
        });

        return result.success;
    } catch (err) {
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
