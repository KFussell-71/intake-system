'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { communicationService, CommunicationLog } from '@/services/CommunicationService';
import { auditService } from '@/services/auditService';
import { revalidatePath } from 'next/cache';

/**
 * SECURITY: Get Messages for the current Portal User's Client using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function getPortalMessagesAction(): Promise<{ success: boolean; data: CommunicationLog[] | null; error?: string }> {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, data: null, error: 'Unauthorized' };
    }

    try {
        // 1. Resolve Client ID for this Portal User via Prisma
        const portalAccess = await prisma.portalAccess.findUnique({
            where: { id: auth.userId },
            select: { clientId: true }
        });

        if (!portalAccess) {
            return { success: false, data: null, error: 'Portal access not configured' };
        }

        const messages = await communicationService.getPortalMessages(portalAccess.clientId);

        // Optional: Audit read if high security
        /*
        await auditService.log({
            userId: auth.userId,
            action: 'READ',
            entityType: 'portal_messages',
            entityId: portalAccess.clientId
        });
        */

        return { success: true, data: messages as any };
    } catch (err: any) {
        return { success: false, data: null, error: err.message };
    }
}

/**
 * SECURITY: Send a Message from the Portal Client using Prisma.
 * MIGRATED WITH AUDITING
 */
export async function sendPortalMessageAction(content: string): Promise<{ success: boolean; error?: string }> {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Resolve Client ID for this Portal User
        const portalAccess = await prisma.portalAccess.findUnique({
            where: { id: auth.userId },
            select: { clientId: true }
        });

        if (!portalAccess) {
            return { success: false, error: 'Portal access not configured' };
        }

        // 2. Find active case for this client via Prisma
        const caseRecord = await prisma.case.findFirst({
            where: { clientId: portalAccess.clientId, status: 'active' },
            select: { id: true }
        });

        if (!caseRecord) {
            return { success: false, error: 'Active case not found for this client' };
        }

        // 3. Send message using CommunicationService
        await communicationService.sendMessage({
            case_id: caseRecord.id,
            client_id: portalAccess.clientId,
            type: 'internal' as any,
            direction: 'inbound' as any,
            content,
        } as any);

        // 4. Unified Audit Log
        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'message',
            entityId: 'portal_msg_' + Date.now(),
            details: { clientId: portalAccess.clientId, caseId: caseRecord.id }
        });

        revalidatePath('/portal');
        return { success: true };

    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
