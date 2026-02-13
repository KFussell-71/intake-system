'use server';

import { createClient } from '@/lib/supabase/server';
import { getPortalClientData } from './getPortalClientData';

export async function getUnreadNotificationsAction() {
    const supabase = await createClient();

    // 1. Verify Portal Access
    const clientData = await getPortalClientData();
    if (!clientData.success || !clientData.data) {
        return { success: false, error: 'Unauthorized' };
    }

    const clientId = clientData.data.client.id;

    // 2. Fetch unread notifications
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, error: 'Failed to fetch notifications' };
    }

    return { success: true, data };
}

export async function markNotificationAsReadAction(notificationId: string) {
    const supabase = await createClient();

    // 1. Verify Portal Access (implicitly handled by RLS, but good to check auth)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // 2. Update notification
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    // RLS will ensure they can only update their own linked client's notifications

    if (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error: 'Failed to update notification' };
    }

    return { success: true };
}
