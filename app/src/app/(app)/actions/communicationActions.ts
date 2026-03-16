'use server';

import { verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { communicationService, CommunicationLog } from '@/services/CommunicationService';
import { revalidatePath } from 'next/cache';

/**
 * Server Action: Get Case Communications
 */
export async function getCaseCommunicationsAction(caseId: string): Promise<{ success: boolean; data?: CommunicationLog[]; error?: string }> {
    const auth = await verifyAuthentication();
    if (!auth.authenticated) return { success: false, error: 'Unauthorized' };

    try {
        const logs = await communicationService.getCaseCommunications(caseId);
        return { success: true, data: logs };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

/**
 * Server Action: Send Communication Message
 */
export async function sendCommunicationMessageAction(data: {
    case_id: string;
    client_id?: string;
    type: 'email' | 'sms' | 'internal';
    content: string;
    recipient_contact?: string;
}): Promise<{ success: boolean; data?: CommunicationLog; error?: string }> {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        const log = await communicationService.sendMessage({
            ...data,
            sender_id: auth.userId
        });
        
        revalidatePath(`/dashboard/cases/${data.case_id}`);
        return { success: true, data: log };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
