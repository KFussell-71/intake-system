import { prisma } from '@/lib/auth/authHelpersServer';

/**
 * Portal Activity Logger
 * 
 * Utility for logging portal client actions for audit and supervisor visibility.
 */

export type PortalAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VIEWED'
    | 'QUESTIONNAIRE_COMPLETED'
    | 'PROFILE_VIEWED'
    | 'STATUS_VIEWED'
    | 'SESSION_EXPIRED'
    | 'ACCESS_REVOKED'
    | 'INVITE_SENT';

export interface PortalActivityEntry {
    clientId: string;
    userId?: string;
    action: PortalAction;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log a portal activity event
 * 
 * @param entry - The activity to log
 * @returns Promise<boolean> - Returns true if logging succeeded
 */
export async function logPortalActivity(entry: PortalActivityEntry): Promise<boolean> {
    try {
        // Find the portal access record for this client
        const portalAccess = await prisma.portalAccess.findFirst({
            where: { clientId: entry.clientId, isActive: true }
        });

        if (!portalAccess) {
            console.warn(`[PORTAL_ACTIVITY] No active portal access for client ${entry.clientId}`);
            return false;
        }

        await prisma.portalActivity.create({
            data: {
                portalAccessId: portalAccess.id,
                clientId: entry.clientId,
                userId: entry.userId || null,
                action: entry.action,
                metadata: (entry.metadata as any) || {},
                ipAddress: entry.ipAddress || null,
                userAgent: entry.userAgent || null
            }
        });

        return true;
    } catch (err) {
        console.error('[PORTAL_ACTIVITY] Exception:', err);
        return false;
    }
}

/**
 * Get recent portal activity for a client
 * 
 * @param clientId - The client to get activity for
 * @param limit - Maximum number of records to return
 */
export async function getPortalActivityForClient(
    clientId: string,
    limit: number = 20
) {
    try {
        return await prisma.portalActivity.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    } catch (err) {
        console.error('[PORTAL_ACTIVITY] Failed to fetch:', err);
        return [];
    }
}

/**
 * Get recent portal activity across all clients
 * For supervisor dashboard
 * 
 * @param limit - Maximum number of records to return
 */
export async function getRecentPortalActivity(limit: number = 50) {
    try {
        return await prisma.portalActivity.findMany({
            include: {
                portalAccess: {
                    include: {
                        client: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    } catch (err) {
        console.error('[PORTAL_ACTIVITY] Failed to fetch:', err);
        return [];
    }
}

