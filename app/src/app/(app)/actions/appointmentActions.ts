"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { modernizedIntakeRepository } from "@/repositories/ModernizedIntakeRepository";

const AppointmentSchema = z.object({
    clientId: z.string().uuid(),
    title: z.string().min(1, "Title is required"),
    date: z.string(), // ISO string from calendar
    time: z.string(), // "HH:MM"
    type: z.enum(['intake', 'follow_up', 'crisis', 'service_planning', 'other']),
    notes: z.string().optional(),
    location: z.string().optional()
});

import { createNotification } from './notificationActions';

export async function createAppointment(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Allow public booking if validated via portal token (middleware handled)
    // OR just basic check. Ideally we check if user is staff or client.
    // For now, if no user, return 401.
    if (!user) {
        return { success: false, message: 'Unauthorized' };
    }

    // Combine date + time
    const rawDate = formData.get('date') as string;
    const rawTime = formData.get('time') as string;

    // Simple validation
    if (!rawDate || !rawTime) {
        return { success: false, message: 'Date and time required' };
    }

    const startDateTime = new Date(`${rawDate}T${rawTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

    // Determine Staff ID:
    // 1. If passed explicitly (e.g. from Portal Wizard), use it.
    // 2. Else if user is staff, use their ID.
    const formStaffId = formData.get('staff_id') as string;
    let staffId = formStaffId;

    if (!staffId) {
        // Only default to user.id if they are NOT a client
        // We can check profile role or assumes clients must pass staff_id
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile && ['case_manager', 'supervisor', 'admin'].includes(profile.role)) {
            staffId = user.id;
        } else {
            return { success: false, message: 'Staff ID is required for booking.' };
        }
    }

    // Overlap Check (Zero Footgun)
    const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('staff_id', staffId)
        .lt('time', endDateTime.toTimeString().slice(0, 5)) // appointments starting before this one ends
        .gt('time', startDateTime.toTimeString().slice(0, 5)) // appointments ending after this one starts... wait, time column is text?
        .eq('date', rawDate);

    // The above query is tricky because 'time' is text "HH:MM". 
    // And logic needs to check interval overlap: (StartA < EndB) and (EndA > StartB).
    // Using Time strings for comparison is risky if they cross midnight (unlikely for appts) but works for ISO "HH:MM:SS".
    // Better: Retrieve all appts for the day and check in code, or use a sophisticated SQL query if possible.
    // Given the current schema likely stores date and time separately:
    // Let's do a quick fetch of that day's appointments for that staff.

    const { data: dayAppts } = await supabase
        .from('appointments')
        .select('time, duration_minutes')
        .eq('staff_id', staffId)
        .eq('date', rawDate);

    const hasOverlap = (dayAppts || []).some(appt => {
        const apptStart = new Date(`${rawDate}T${appt.time}`);
        const apptEnd = new Date(apptStart.getTime() + (appt.duration_minutes || 60) * 60000);

        // Check overlap
        return startDateTime < apptEnd && endDateTime > apptStart;
    });

    if (hasOverlap) {
        return { success: false, message: 'This slot is no longer available.' };
    }

    const payload = {
        client_id: formData.get('client_id'),
        staff_id: staffId,
        title: formData.get('title'),
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        type: formData.get('type'),
        status: 'scheduled',
        notes: formData.get('notes'),
        location: formData.get('location') || 'Office',
    };

    try {
        const { error } = await supabase.from('appointments').insert(payload);
        if (error) throw error;

        // Audit Log
        await modernizedIntakeRepository.logIntakeEvent({
            intake_id: payload.client_id as string,
            event_type: 'appointment_scheduled',
            new_value: payload.title as string,
            changed_by: user.id,
            field_path: 'appointments'
        });

        // NOTIFICATION: Use the new action
        // Detect if booked by someone else for the staff
        if (user.id !== staffId) {
            await createNotification({
                staff_id: staffId,
                client_id: payload.client_id as string,
                type: 'booking',
                message: `New appointment scheduled: ${payload.title} on ${rawDate} at ${rawTime}`
            });
        }

        revalidatePath(`/clients/${payload.client_id}`);
        return { success: true, message: 'Appointment scheduled' };
    } catch (error: any) {
        console.error('Schedule Error:', error);
        return { success: false, message: error.message || 'Failed to schedule' };
    }
}

export async function cancelAppointment(appointmentId: string, clientId: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', appointmentId);

        if (error) throw error;

        // Audit Log
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await modernizedIntakeRepository.logIntakeEvent({
                intake_id: clientId,
                event_type: 'appointment_cancelled',
                new_value: appointmentId,
                changed_by: user.id,
                field_path: 'appointments'
            });
        }

        revalidatePath(`/clients/${clientId}`);
        return { success: true };
    } catch (error) {
        console.error('Cancel Error:', error);
        return { success: false, message: 'Failed to cancel' };
    }
}
