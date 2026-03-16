'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { generateTimeSlots } from '@/lib/logic/scheduling';
import { revalidatePath } from 'next/cache';
import { createAppointment } from '@/app/(app)/actions/appointmentActions';
import { createNotification } from '@/app/(app)/actions/notificationActions';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Get available time slots for portal booking using Prisma.
 */
export async function getAvailableSlots(dateStr: string, clientId: string, staffId?: string) {
    try {
        const date = new Date(dateStr);

        // 1. Determine Target Staff using Prisma
        let targetStaffId = staffId;

        if (!targetStaffId && clientId) {
            const client = await prisma.client.findUnique({
                where: { id: clientId },
                select: { assignedToId: true }
            });

            if (client?.assignedToId) {
                targetStaffId = client.assignedToId;
            }
        }

        // Fallback: Pick first supervisor if no assigned staff
        if (!targetStaffId) {
            const staff = await prisma.profile.findFirst({
                where: { role: 'supervisor' },
                select: { id: true }
            });
            if (staff) targetStaffId = staff.id;
        }

        if (!targetStaffId) return { success: false, message: 'No staff available for booking.' };

        // 2. Fetch Appointments and Availability Blocks via Prisma
        const dayStart = new Date(dateStr);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateStr);
        dayEnd.setHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                staffId: targetStaffId,
                startTime: { lte: dayEnd },
                endTime: { gte: dayStart }
            },
            select: { startTime: true, endTime: true }
        });

        const blocks = await prisma.availabilityBlock.findMany({
            where: {
                userId: targetStaffId,
                startTime: { lte: dayEnd },
                endTime: { gte: dayStart }
            },
            select: { startTime: true, endTime: true }
        });

        const slots = generateTimeSlots(date, appointments.map((a: any) => ({ start: a.startTime, end: a.endTime })), blocks.map((b: any) => ({ start: b.startTime, end: b.endTime })));

        return { success: true, data: slots, staffId: targetStaffId };
    } catch (error: any) {
        console.error('Error fetching slots:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Server Action: Book appointment via portal.
 * MIGRATED WITH AUDITING
 */
export async function bookClientAppointment(formData: FormData) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) throw new Error('Unauthorized');

    // createAppointment handles Prisma creation and internal auditing
    const result = await createAppointment(null, formData);

    if (result.success && result.data) {
        revalidatePath('/portal');

        const staffId = formData.get('staff_id') as string;
        const clientId = formData.get('client_id') as string;
        const apptTitle = formData.get('title') as string;
        const apptDate = formData.get('date') as string;

        // 1. Unified Audit Log (Portal Specific Context)
        await auditService.log({
            userId: auth.userId,
            action: 'CREATE',
            entityType: 'appointment',
            entityId: result.data.id,
            details: { source: 'portal_booking', clientId, staffId }
        });

        // 2. Create Staff Notification
        if (staffId && clientId) {
            await createNotification({
                staff_id: staffId,
                client_id: clientId,
                type: 'booking',
                message: `New appointment scheduled: ${apptTitle} on ${apptDate}`
            });
        }
    }

    return result;
}
