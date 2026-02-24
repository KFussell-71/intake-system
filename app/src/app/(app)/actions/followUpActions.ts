'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const FollowUpSchema = z.object({
    client_id: z.string().uuid(),
    contact_date: z.string(),
    method: z.enum(['phone', 'in-person']),
    notes: z.string().optional(),
});

export async function createFollowUp(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Unauthorized' };
    }

    const rawData = {
        client_id: formData.get('client_id'),
        contact_date: formData.get('contact_date'),
        method: formData.get('method'),
        notes: formData.get('notes'),
    };

    const validated = FollowUpSchema.safeParse(rawData);

    if (!validated.success) {
        return {
            success: false,
            message: 'Validation failed',
            errors: validated.error.flatten().fieldErrors
        };
    }

    try {
        const { error } = await supabase.from('follow_ups').insert({
            ...validated.data,
            created_by: user.id,
            status: 'pending'
        });

        if (error) throw error;

        revalidatePath('/follow-ups');
        return { success: true, message: 'Follow-up created successfully' };
    } catch (error: any) {
        console.error('Create Follow-up Error:', error);
        return { success: false, message: error.message || 'Failed to create follow-up' };
    }
}
