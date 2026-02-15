'use server';

import { auditService, AuditLogParams } from '@/services/auditService';

/**
 * Server Action to log audit events from Client Components or Isomorphic code.
 * This bridges the gap between client-side events and server-side DB logging.
 */
export async function logAuditAction(params: AuditLogParams) {
    try {
        const result = await auditService.log(params);
        if (!result.success) {
            console.error('[AUDIT_ACTION] Failed to log audit event', result.error);
            // We generally don't want to throw to the client for audit failures, just consistency
        }
    } catch (error) {
        console.error('[AUDIT_ACTION] Unexpected error', error);
    }
}
