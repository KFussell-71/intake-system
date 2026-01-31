'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateFollowUpStatus(followUpId: string, status: 'pending' | 'completed') {
    const supabase = createClient();

    const { error } = await supabase
        .from('follow_ups')
        .update({ status })
        .eq('id', followUpId);

    if (error) {
        console.error('Error updating follow-up status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/follow-ups');
    return { success: true };
}
