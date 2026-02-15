'use server';

import { createClient } from '@/lib/supabase/server';
import { generateTimeSlots } from '@/lib/logic/scheduling';
import { revalidatePath } from 'next/cache';
import { createAppointment } from '../appointmentActions'; // Reuse existing logic where possible

export async function getAvailableSlots(dateStr: string, staffId?: string) {
    const supabase = await createClient();
    try {
        const date = new Date(dateStr);

        // 1. Fetch Staff (if not specified, maybe pick one or aggregate? For now, let's assume a default or specific staff)
        // In a real system, you might select a staff member first. 
        // For simplicity in this demo, we'll pick the first random 'case_manager'.
        let targetStaffId = staffId;
        if (!targetStaffId) {
            const { data: staff } = await supabase.from('profiles').select('id').eq('role', 'case_manager').limit(1).single();
            if (staff) targetStaffId = staff.id;
        }

        if (!targetStaffId) return { success: false, message: 'No staff available' };

        // 2. Fetch Appointments for Date
        const { data: appointments } = await supabase
            .from('appointments')
            .select('date, time, duration_minutes')
            .eq('staff_id', targetStaffId)
            // Ideally filter by date range in DB, but date/time separation makes it tricky if stored as strings.
            // Assuming date is stored as YYYY-MM-DD
            .eq('date', dateStr);

        // 3. Fetch Availability Blocks
        // Blocks are timestamptz, so we need to range query
        const dayStart = new Date(dateStr);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateStr);
        dayEnd.setHours(23, 59, 59, 999);

        const { data: blocks } = await supabase
            .from('availability_blocks')
            .select('start_time, end_time')
            .eq('user_id', targetStaffId)
            .lt('start_time', dayEnd.toISOString())
            .gt('end_time', dayStart.toISOString());

        // 4. Convert to BusyIntervals
        const busyApps = (appointments || []).map(app => {
            const start = new Date(`${app.date}T${app.time}`);
            const end = new Date(start.getTime() + (app.duration_minutes || 60) * 60000);
            return { start, end };
        });

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
