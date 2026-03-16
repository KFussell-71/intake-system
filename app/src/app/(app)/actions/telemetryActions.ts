'use server';

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { auditService } from '@/services/auditService';

/**
 * Server Action: Get Telemetry Logs for Dashboard.
 */
export async function getTelemetryLogsAction(limit: number = 500) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        // Fetch from the refactored telemetry table via Prisma
        const logs = await prisma.telemetryLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return { success: true, data: logs };
    } catch (error: any) {
        console.error('Telemetry Fetch Error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Log a Telemetry Event.
 */
export async function logTelemetryAction(data: {
    eventName: string;
    eventType: 'metric' | 'span' | 'error';
    value: number;
    attributes?: any;
}) {
    // Note: Telemetry is often unauthenticated or high-volume.
    // We'll record it but not necessarily block on auth unless it's a sensitive metric.
    try {
        await prisma.telemetryLog.create({
            data: {
                eventName: data.eventName,
                eventType: data.eventType,
                value: data.value,
                attributes: data.attributes || {}
            }
        });
        return { success: true };
    } catch (error: any) {
        console.error('Telemetry Logging Error:', error);
        return { success: false, error: error.message };
    }
}
