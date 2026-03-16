"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma, verifyAuthentication, verifyAuthorization } from "@/lib/auth/authHelpersServer";
import { Prisma } from "@prisma/client";
import { createNotification } from './notificationActions';

const AppointmentSchema = z.object({
    clientId: z.string().uuid(),
    title: z.string().min(1, "Title is required"),
    date: z.string(), // ISO string from calendar
    time: z.string(), // "HH:MM"
    type: z.enum(['intake', 'follow_up', 'crisis', 'service_planning', 'other']),
    notes: z.string().optional(),
    location: z.string().optional()
});

/**
 * Creates a new appointment using Prisma.
 * Replaces Supabase insert with manual role checks.
 */
export async function createAppointment(prevState: any, formData: FormData) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, message: 'Unauthorized' };
    }

    const rawDate = formData.get('date') as string;
    const rawTime = formData.get('time') as string;
    const clientId = formData.get('client_id') as string;
    const title = formData.get('title') as string;
    const type = formData.get('type') as any;
    const notes = formData.get('notes') as string | undefined;
    const location = (formData.get('location') as string) || 'Office';

    if (!rawDate || !rawTime || !clientId) {
        return { success: false, message: 'Date, time, and client are required' };
    }

    const startDateTime = new Date(`${rawDate}T${rawTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

    // Get staff profile for role check
    const profile = await prisma.profile.findUnique({
        where: { id: auth.userId },
        select: { role: true }
    });

    const requesterRole = profile?.role;
    const isStaff = requesterRole === 'staff' || requesterRole === 'supervisor' || requesterRole === 'admin';
    const isSupervisorOrAdmin = requesterRole === 'supervisor' || requesterRole === 'admin';

    let staffId = formData.get('staff_id') as string | null;
    if (!staffId && isStaff) {
        staffId = auth.userId;
    }

    if (!staffId) {
        return { success: false, message: 'Staff ID is required for booking.' };
    }

    // RBAC: If it's a client booking loro stessi
    if (!isStaff) {
        const portalAccess = await prisma.portalAccess.findUnique({
            where: { clientId: clientId }, // Check if this user has access to this client
            select: { id: true, isActive: true, expiresAt: true, revokedAt: true }
        });

        // In a real Portal-to-Client mapping, we'd check auth.userId === portalAccess.id
        // For now, mirroring the existing logic which checks if client_users exists for this client
        if (
            !portalAccess ||
            !portalAccess.isActive ||
            portalAccess.revokedAt ||
            (portalAccess.expiresAt && portalAccess.expiresAt < new Date())
        ) {
            return { success: false, message: 'Unauthorized to book for this client' };
        }
    }

    // RBAC: If a staff member is booking, ensure they are assigned or have elevated privs
    if (!isSupervisorOrAdmin && isStaff) {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            select: { assignedToId: true }
        });

        if (!client || client.assignedToId !== staffId) {
            return { success: false, message: 'You are not assigned to this client.' };
        }
    }

    // Overlap Detection
    const startOfDay = new Date(startDateTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startDateTime);
    endOfDay.setHours(23, 59, 59, 999);

    const dayAppts = await prisma.appointment.findMany({
        where: {
            staffId: staffId,
            startTime: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: { not: 'cancelled' }
        },
        select: { startTime: true, endTime: true }
    });

    const hasOverlap = dayAppts.some((appt: { startTime: Date, endTime: Date }) => {
        return (startDateTime < appt.endTime && endDateTime > appt.startTime);
    });

    if (hasOverlap) {
        return { success: false, message: 'This slot is no longer available.' };
    }

    try {
        const newAppt = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const appt = await tx.appointment.create({
                data: {
                    clientId,
                    staffId,
                    title,
                    startTime: startDateTime,
                    endTime: endDateTime,
                    type,
                    status: 'scheduled',
                    notes,
                    location
                }
            });

            // Audit
            await tx.auditLog.create({
                data: {
                    userId: auth.userId,
                    action: 'CREATE',
                    resourceType: 'appointment',
                    resourceId: appt.id,
                    metadata: { title, startTime: startDateTime.toISOString() } as any
                }
            });

            return appt;
        });

        // Notify staff if a client or another staff booked it
        if (auth.userId !== staffId) {
            await createNotification({
                staff_id: staffId,
                client_id: clientId,
                type: 'booking',
                message: `New appointment scheduled: ${title} on ${rawDate} at ${rawTime}`
            });
        }

        revalidatePath(`/clients/${clientId}`);
        revalidatePath('/dashboard/schedule');

        return { success: true, message: 'Appointment scheduled', data: newAppt };
    } catch (error: any) {
        console.error('[APPOINTMENT_ACTION] Create Error:', error);
        return { success: false, message: 'Failed to schedule appointment' };
    }
}

/**
 * Cancels an appointment.
 */
export async function cancelAppointment(appointmentId: string, clientId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, message: 'Unauthorized' };
    }

    try {
        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const appt = await tx.appointment.update({
                where: { id: appointmentId },
                data: { status: 'cancelled' }
            });

            await tx.auditLog.create({
                data: {
                    userId: auth.userId,
                    action: 'UPDATE',
                    resourceType: 'appointment',
                    resourceId: appointmentId,
                    metadata: { status: 'cancelled' } as any
                }
            });
        });

        revalidatePath(`/clients/${clientId}`);
        revalidatePath('/dashboard/schedule');
        return { success: true };
    } catch (error) {
        console.error('[APPOINTMENT_ACTION] Cancel Error:', error);
        return { success: false, message: 'Failed to cancel appointment' };
    }
}
