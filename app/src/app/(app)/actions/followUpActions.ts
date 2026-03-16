'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { verifyAuthentication, prisma } from '@/lib/auth/authHelpersServer';

const FollowUpSchema = z.object({
    client_id: z.string().uuid(),
    contact_date: z.string(),
    method: z.enum(['phone', 'in-person']),
    notes: z.string().optional(),
});

/**
 * Server Action: Create Follow-up.
 */
export async function createFollowUp(prevState: any, formData: FormData) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
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
        await prisma.followUp.create({
            data: {
                clientId: validated.data.client_id,
                contactDate: new Date(validated.data.contact_date),
                method: validated.data.method,
                notes: validated.data.notes,
                createdById: auth.userId,
                status: 'pending'
            }
        });

        revalidatePath('/follow-ups');
        revalidatePath(`/clients/${validated.data.client_id}`);
        
        return { success: true, message: 'Follow-up created successfully' };
    } catch (error: any) {
        console.error('Create Follow-up Error:', error);
        return { success: false, message: error.message || 'Failed to create follow-up' };
    }
}
