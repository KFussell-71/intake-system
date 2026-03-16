'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { Prisma } from '@prisma/client';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';

/**
 * SECURITY: Revoke Client Portal Access using Prisma and standardized auditing.
 * Immediately deactivates portal access and logs the revocation.
 * MIGRATED WITH AUDITING
 */
export async function revokeClientPortalAccess(
    clientId: string,
    reason?: string
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized: Authentication required' };
    }

    try {
        // 1. SECURITY: Verify user has access to this client or is admin/supervisor
        const clientRecord = await prisma.client.findFirst({
            where: {
                id: clientId,
                OR: [
                    { assignedToId: auth.userId },
                    { createdById: auth.userId }
                ]
            },
            select: { id: true, name: true }
        });

        if (!clientRecord && auth.role !== 'admin' && auth.role !== 'supervisor') {
            return {
                success: false,
                error: 'Access denied: You are not authorized to revoke this client\'s access'
            };
        }

        // 2. Perform revocation in a transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Find active access
            const portalAccessResult = await tx.portalAccess.findFirst({
                where: { clientId: clientId, isActive: true }
            });

            if (!portalAccessResult) {
                throw new Error('No active portal access found for this client');
            }

            // Revoke
            const revoked = await tx.portalAccess.update({
                where: { id: portalAccessResult.id },
                data: {
                    isActive: false,
                    revokedAt: new Date()
                }
            });

            // 3. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'DELETE',
                entityType: 'portal_access',
                entityId: clientId,
                details: { reason: reason || 'Manual revocation by staff' }
            });

            // 4. Legacy portal activity log
            await tx.portalActivity.create({
                data: {
                    clientId: clientId,
                    userId: portalAccessResult.id,
                    action: 'ACCESS_REVOKED',
                    details: {
                        revoked_by: auth.userId,
                        reason: reason || 'Manual revocation by staff',
                        revoked_at: new Date().toISOString()
                    } as any
                }
            });

            return { revoked, clientName: clientRecord?.name || 'client' };
        });

        revalidatePath('/directory');
        revalidatePath(`/clients/${clientId}`);

        return {
            success: true,
            message: `Portal access revoked for ${result.clientName}.`
        };

    } catch (error: any) {
        console.error('Revoke Error:', error);
        return { success: false, error: error.message };
    }
}
