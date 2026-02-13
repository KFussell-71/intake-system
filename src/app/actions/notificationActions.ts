'use server';

import { supabase } from '@/lib/supabase';

export async function createNotification(data: {
    client_id?: string;
    staff_id?: string;
    type: string; // 'booking', 'message', 'alert'
    message: string;
    link?: string; // Optional link to resource
}) {
    try {
        const { error } = await supabase
            .from('notifications')
            .insert({
                client_id: data.client_id,
                staff_id: data.staff_id,
                type: data.type,
                message: data.message,
                // link: A future implementation detail, might need schema update if we want to store it, 
                // or just embed in message/metadata
            });

        if (error) {
            console.error('Error creating notification:', error);
            // Don't throw for notifications, they are non-critical
        }
    } catch (error) {
        console.error('Notification Exception:', error);
    }
}
