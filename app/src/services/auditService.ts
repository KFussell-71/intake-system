import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';
import { Masking } from '@/lib/masking';

export type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN' | string;

export interface AuditLogParams {
    userId?: string;
    action: AuditAction;
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
    async log(params: AuditLogParams): Promise<{ success: boolean; error?: any }> {
        try {
            // If userId not provided, try to get from session
            let effectiveUserId = params.userId;
            if (!effectiveUserId) {
                const auth = await verifyAuthentication();
                effectiveUserId = auth.userId;
            }

            // SECURITY: Mask PII/PHI in details before storage
            const maskedDetails = Masking.maskObject({
                ...params.details,
                ip: params.ipAddress,
                ua: params.userAgent
            });

            await prisma.auditLog.create({
                data: {
                    userId: effectiveUserId,
                    action: params.action,
                    resourceType: params.entityType, // Map entityType to Prisma resourceType
                    resourceId: params.entityId,     // Map entityId to Prisma resourceId
                    metadata: maskedDetails as any,       // Map details to Prisma metadata
                    ipAddress: params.ipAddress,
                    userAgent: params.userAgent
                }
            });

            return { success: true };
        } catch (error: any) {
            console.error('[AUDIT_LOG_CRITICAL] Audit service failure:', error);
            // Ideally should not throw to keep calling function alive, returning false instead
            return { success: false, error: error.message };
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
