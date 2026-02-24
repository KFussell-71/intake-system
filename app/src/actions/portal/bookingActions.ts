'use server';

import { createClient } from '@/lib/supabase/server';
import { generateTimeSlots } from '@/lib/logic/scheduling';
import { revalidatePath } from 'next/cache';
import { createAppointment } from '@/app/(app)/actions/appointmentActions'; // Reuse existing logic where possible

export async function getAvailableSlots(dateStr: string, clientId: string, staffId?: string) {
    const supabase = await createClient();
    try {
        const date = new Date(dateStr);

        // 1. Determine Target Staff
        let targetStaffId = staffId;

        if (!targetStaffId && clientId) {
            const { data: client } = await supabase
                .from('clients')
                .select('assigned_to')
                .eq('id', clientId)
                .single();

            if (client?.assigned_to) {
                targetStaffId = client.assigned_to;
            }
        }

        // Fallback: If no assigned staff, pick a default case manager (for unassigned clients)
        if (!targetStaffId) {
            const { data: staff } = await supabase.from('profiles').select('id').eq('role', 'case_manager').limit(1).single();
            if (staff) targetStaffId = staff.id;
        }

        if (!targetStaffId) return { success: false, message: 'No staff available for booking.' };

        // 2. Fetch Appointments for Date
        const dayStart = new Date(dateStr);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateStr);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: appointments } = await supabase
            .from('appointments')
            .select('start_time, end_time')
            .eq('staff_id', targetStaffId)
            .lt('start_time', dayEnd.toISOString())
            .gt('end_time', dayStart.toISOString());

        // 3. Fetch Availability Blocks (Busy Times)
        const { data: blocks } = await supabase
            .from('availability_blocks')
            .select('start_time, end_time')
            .eq('user_id', targetStaffId)
            .lt('start_time', dayEnd.toISOString())
            .gt('end_time', dayStart.toISOString());

        // 4. Convert to BusyIntervals
        const busyApps = (appointments || []).map(app => ({
            start: new Date(app.start_time),
            end: new Date(app.end_time)
        }));

        const busyBlocks = (blocks || []).map(b => ({
            start: new Date(b.start_time),
            end: new Date(b.end_time)
        }));

        // 5. Generate Slots
        const slots = generateTimeSlots(date, busyApps, busyBlocks);

        return { success: true, data: slots, staffId: targetStaffId };
    } catch (error: any) {
        console.error('Error fetching slots:', error);
        return { success: false, message: error.message };
    }
}

export async function bookClientAppointment(formData: FormData) {
    const supabase = await createClient();
    // Wrapper around createAppointment to ensure it works for portal context
    // We retain the existing server action logic but might want to add portal-specific notifications here
    const result = await createAppointment(null, formData);

    if (result.success) {
        revalidatePath('/portal');
        // TODO: In-app notification logic can be triggered here
        // await createNotification({ userId: staffId, message: "New booking!" })
    }

    return result;
}
