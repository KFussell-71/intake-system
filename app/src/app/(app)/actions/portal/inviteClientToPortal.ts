'use server';

import { prisma, verifyAuthentication, verifyClientAccess } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * SECURITY: Invite Client to Portal using Prisma and standardized auditing.
 * Generates a magic-link invitation and links it to a portal access record.
 * MIGRATED WITH AUDITING
 */
export async function inviteClientToPortal(
    clientId: string,
    clientEmail: string,
    expirationDays: number = 30
) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized: Authentication required' };
    }

    try {
        // 1. SECURITY: Verify user has access to this client via RBAC helper
        const authz = await verifyClientAccess(clientId);
        if (!authz.authorized) {
            return { success: false, error: authz.error || 'Unauthorized' };
        }

        // 2. Validate email format
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRegex.test(clientEmail) || clientEmail.length > 254) {
            return { success: false, error: 'Invalid email format' };
        }

        // 3. Check for existing portal access
        const existingAccess = await prisma.portalAccess.findUnique({
            where: { id: clientId } // Assuming clientId maps to portal id or similar (needs check)
            // Correction: PortalAccess id is the user id, link is clientId. 
            // In the schema draft it was model PortalAccess { id String @id @map("id") @db.Uuid; clientId String @db.Uuid ... }
        });
        
        // Actually find by clientId
        const portalRecord = await prisma.portalAccess.findFirst({
            where: { clientId: clientId }
        });

        if (portalRecord?.isActive && (!portalRecord.revokedAt) && new Date(portalRecord.expiresAt) > new Date()) {
            return {
                success: false,
                error: 'Client already has active portal access.'
            };
        }

        // 4. Generate magic link via Supabase Admin (Required for auth service)
        const adminSupabase = createAdminClient();
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
            type: 'magiclink',
            email: clientEmail,
            options: { redirectTo: `${appUrl}/portal` }
        });

        if (linkError || !linkData.user) {
            console.error('[PORTAL] Magic link error:', linkError);
            return { success: false, error: 'Failed to generate invitation link' };
        }

        const portalUserId = linkData.user.id;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expirationDays);

        // 5. Update/Create Portal Access record transactionally
        await prisma.$transaction(async (tx: any) => {
            await tx.portalAccess.upsert({
                where: { id: portalUserId },
                update: {
                    clientId: clientId,
                    isActive: true,
                    expiresAt: expiresAt,
                    revokedAt: null,
                    invitedById: auth.userId
                },
                create: {
                    id: portalUserId,
                    clientId: clientId,
                    isActive: true,
                    expiresAt: expiresAt,
                    invitedById: auth.userId
                }
            });

            // 6. Unified Audit Log
            await auditService.log({
                userId: auth.userId!,
                action: 'CREATE',
                entityType: 'portal_invite',
                entityId: clientId,
                details: { clientEmail, expiresAt }
            });

            // 7. Legacy Portal Activity Log
            await tx.portalActivity.create({
                data: {
                    clientId: clientId,
                    userId: portalUserId,
                    action: 'INVITE_SENT',
                    metadata: { invited_by: auth.userId, email: clientEmail, expiresAt }
                }
            });
        });

        return {
            success: true,
            message: `Invitation sent to ${clientEmail}. Access until ${expiresAt.toLocaleDateString()}.`
        };

    } catch (error: any) {
        console.error('Invite Error:', error);
        return { success: false, error: error.message };
    }
}
