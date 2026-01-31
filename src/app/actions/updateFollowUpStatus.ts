'use server';

import { createClient } from "@/lib/supabase/server";
import { logFollowUpStatusChanged } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function updateFollowUpStatus(followUpId: string, status: 'pending' | 'completed') {
    const supabase = await createClient();

    // 1. Verify Ownership/Assignment
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Check if user is assigned to the client linked to this follow-up
    const { data: followUp, error: fetchErr } = await supabase
        .from('follow_ups')
        .select(`
            id,
            clients!inner (
                assigned_to,
                created_by
            )
        `)
        .eq('id', followUpId)
        .single();

    if (fetchErr || !followUp) {
        console.error('Permission check fetch error:', fetchErr);
        throw new Error("Follow-up not found or access denied");
    }

    const client = followUp.clients as any;
    const isOwner = client.assigned_to === user.id || client.created_by === user.id;

    if (!isOwner) throw new Error("Unauthorized: You are not assigned to this client");

    // 2. Perform update
    const { error } = await supabase
        .from('follow_ups')
        .update({ status })
        .eq('id', followUpId);

    if (error) {
        console.error('Error updating follow-up status:', error);
        return { success: false, error: error.message };
    }

    // 3. SECURITY: Log status change for audit trail
    await logFollowUpStatusChanged(followUpId, status);

    revalidatePath('/follow-ups');
    return { success: true };
}
