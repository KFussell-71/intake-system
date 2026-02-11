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

export async function createAppointment(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

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

    const payload = {
        client_id: formData.get('client_id'),
        staff_id: user.id,
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
            intake_id: payload.client_id as string, // Assuming client_id is the intake_id in this context
            event_type: 'appointment_scheduled',
            new_value: payload.title as string,
            changed_by: user.id,
            field_path: 'appointments'
        });

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
