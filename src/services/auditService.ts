import { createClient } from '@/lib/supabase/server';
import { PostgrestError } from '@supabase/supabase-js';
import { Masking } from '@/lib/masking';

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN';

export interface AuditLogParams {
    userId?: string;
    action: AuditAction | string; // Allow flexible strings for custom actions
    entityType: string;
    entityId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * HIPAA Compliance Audit Service
 * 
 * Ensures all PHI access and security events are logged with 
 * source tracking (IP/UserAgent).
 */
export class AuditService {
    async log(params: AuditLogParams): Promise<{ success: boolean; error?: PostgrestError }> {
        try {
            const supabase = await createClient();

            // If userId not provided, try to get from session
            let effectiveUserId = params.userId;
            if (!effectiveUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                effectiveUserId = user?.id;
            }

            // SECURITY: Mask PII/PHI in details before storage
            const maskedDetails = Masking.maskObject({
                ...params.details,
                ip: params.ipAddress,
                ua: params.userAgent
            });

            const { error } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: effectiveUserId,
                    action: params.action as any, // Cast for simplicity, DB handles check constraint
                    entity_type: params.entityType,
                    entity_id: params.entityId as any, // UUID or placeholder
                    details: maskedDetails,
                    ip_address: params.ipAddress,
                    user_agent: params.userAgent
                });

            if (error) {
                console.error('[AUDIT_LOG_ERROR] Failed to save log:', error);
                return { success: false, error };
            }

            return { success: true };
        } catch (error) {
            console.error('[AUDIT_LOG_CRITICAL] Audit service failure:', error);
            return { success: false };
        }
    }

    /**
     * Specialized logger for PHI View events
     */
    async logPhiAccess(clientId: string, userId: string, details?: any) {
        return this.log({
            userId,
            action: 'READ',
            entityType: 'client_phi',
            entityId: clientId,
            details: {
                reason: 'Standard Profile View',
                ...details
            }
        });
    }
}

export const auditService = new AuditService();
