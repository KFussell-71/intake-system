'use server';

import { createClient } from '@/lib/supabase/server';
import { notificationService } from '@/services/NotificationService';
import { revalidatePath } from 'next/cache';

/**
 * Complete a milestone and trigger automated alerts
 */
export async function completeMilestoneAction(milestoneId: string) {
    const supabase = await createClient();

    // 1. Fetch milestone details
    const { data: milestone, error: fetchError } = await supabase
        .from('tracking_milestones')
        .select('*, clients(id, assigned_to)')
        .eq('id', milestoneId)
        .single();

    if (fetchError || !milestone) {
        return { success: false, error: 'Milestone not found' };
    }

    // 2. Update completion date
    const { error: updateError } = await supabase
        .from('tracking_milestones')
        .update({ completion_date: new Date().toISOString() })
        .eq('id', milestoneId);

    if (updateError) {
        return { success: false, error: 'Failed to update milestone' };
    }

    // 3. Resolve Case ID (Need to find the primary case for notifications)
    const { data: primaryCase } = await supabase
        .from('cases')
        .select('id')
        .eq('client_id', milestone.client_id)
        .limit(1)
        .maybeSingle();

    // 4. Trigger Automated Notifications
    if (primaryCase) {
        await notificationService.sendMilestoneAlert(
            milestone.client_id,
            (milestone as any).milestone_name,
            primaryCase.id
        );
    }

    revalidatePath('/portal');
    revalidatePath('/dashboard/intake'); // Assuming case detail uses this path or similar

    return { success: true };
}
