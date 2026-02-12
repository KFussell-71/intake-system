'use server';

import { createClient } from '@/lib/supabase/server';
import { communicationService, CommunicationLog } from '@/services/CommunicationService';
import { revalidatePath } from 'next/cache';

/**
 * SECURITY: Get Messages for the current Portal User's Client
 */
export async function getPortalMessagesAction(): Promise<{ success: boolean; data: CommunicationLog[] | null; error?: string }> {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: null, error: 'Unauthorized' };

    // 2. Resolve Client ID for this Portal User
    const { data: clientLink } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('id', user.id)
        .single();

    if (!clientLink) return { success: false, data: null, error: 'Portal access not configured' };

    try {
        const messages = await communicationService.getPortalMessages(clientLink.client_id);
        return { success: true, data: messages };
    } catch (err: any) {
        return { success: false, data: null, error: err.message };
    }
}

/**
 * SECURITY: Send a Message from the Portal Client
 */
export async function sendPortalMessageAction(content: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // 1. Verify Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // 2. Resolve Client ID and Case ID
    const { data: clientLink } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('id', user.id)
        .single();

    if (!clientLink) return { success: false, error: 'Portal access not configured' };

    // Find the primary case for this client to attach the message to
    const { data: primaryCase } = await supabase
        .from('cases')
        .select('id')
        .eq('client_id', clientLink.client_id)
        .limit(1)
        .single();

    if (!primaryCase) return { success: false, error: 'Active case not found for this client' };

    try {
        await communicationService.sendMessage({
            case_id: primaryCase.id,
            client_id: clientLink.client_id,
            type: 'internal',
            direction: 'inbound',
            content,
        });

        revalidatePath('/portal');
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
