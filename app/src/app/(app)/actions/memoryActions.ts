"use server";

import { prisma } from "@/lib/auth/authHelpersServer";
import { revalidatePath } from "next/cache";

export interface SystemMemoryLog {
    id?: string;
    action_type: 'Correction' | 'Skill' | 'Action' | 'Generation';
    description: string;
    metadata?: any;
    created_at?: string;
    created_by?: string;
}

/**
 * Server Action: Log System Action using Prisma.
 */
export async function logSystemAction(log: Omit<SystemMemoryLog, 'id' | 'created_at'>) {
    try {
        await prisma.$transaction(async (tx: any) => {
            // 1. Insert into SystemMemory
            await tx.systemMemory.create({
                data: {
                    actionType: log.action_type,
                    description: log.description,
                    metadata: log.metadata || {},
                    createdById: log.created_by || null
                }
            });

            // 2. Mandatory Audit Event (matching legacy logic)
            await tx.intakeEvent.create({
                data: {
                    intakeId: "00000000-0000-0000-0000-000000000000", // placeholder for SYSTEM
                    eventType: 'system_memory_log',
                    newValue: log.description,
                    changedBy: log.created_by || null,
                    fieldPath: "system_memory"
                }
            });
        });

        revalidatePath("/supervisor/memory");

    } catch (error) {
        console.error("Failed to log system action:", error);
        // Non-critical log, but we record the failure
    }
}

/**
 * Server Action: Fetch System Logs using Prisma.
 */
export async function getSystemLogs() {
    try {
        const logs = await prisma.systemMemory.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' }
        });

        return logs.map(l => ({
            id: l.id,
            action_type: l.actionType as any,
            description: l.description,
            metadata: l.metadata,
            created_at: l.createdAt.toISOString(),
            created_by: l.createdById
        })) as SystemMemoryLog[];

    } catch (error) {
        console.error("Failed to fetch system logs:", error);
        return [];
    }
}
