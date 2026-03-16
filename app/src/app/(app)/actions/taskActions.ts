"use server";

import { prisma, verifyAuthentication } from '@/lib/auth/authHelpersServer';
import { revalidatePath } from 'next/cache';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'waived';
export type TaskPriority = 'high' | 'medium' | 'low' | 'critical';
export type TaskType = 'document_request' | 'verification' | 'signature' | 'review' | 'manual_action';

export interface IntakeTask {
    id: string;
    intake_id: string;
    title: string;
    description?: string;
    task_type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    assigned_to?: string;
    due_date?: string;
    completed_at?: string;
    completed_by?: string;
    created_at: string;
    created_by: string;
}

export type CreateTaskInput = Omit<IntakeTask, 'id' | 'created_at' | 'created_by' | 'completed_at' | 'completed_by'>;

/**
 * Server Action: Create a task for an intake using Prisma.
 */
export async function createTaskAction(data: CreateTaskInput) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        // 1. Fetch Intake to get Client ID
        const intake = await prisma.intake.findUnique({
            where: { id: data.intake_id },
            select: { clientId: true }
        });

        if (!intake) throw new Error('Intake not found');

        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 2. Create Task
            const newTask = await tx.intakeTask.create({
                data: {
                    intakeId: data.intake_id,
                    clientId: intake.clientId,
                    title: data.title,
                    description: data.description,
                    taskType: data.task_type,
                    status: data.status || 'pending',
                    priority: data.priority || 'medium',
                    assignedTo: data.assigned_to || null,
                    dueDate: data.due_date ? new Date(data.due_date) : null,
                    createdById: auth.userId
                }
            });

            // 3. Audit Log
            await tx.intakeEvent.create({
                data: {
                    intakeId: data.intake_id,
                    eventType: 'task_created',
                    fieldPath: 'tasks',
                    newValue: data.title,
                    changedBy: auth.userId
                }
            });

            return newTask;
        });

        revalidatePath(`/intake/${data.intake_id}`);
        return { success: true, task: result };
    } catch (error: any) {
        console.error('Error creating task:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Update task status using Prisma.
 */
export async function updateTaskStatusAction(taskId: string, status: TaskStatus, intakeId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        await (prisma as any).$transaction(async (tx: any) => {
            const updates: any = { status };
            if (status === 'completed') {
                updates.completedAt = new Date();
                updates.completedBy = auth.userId;
            } else {
                updates.completedAt = null;
                updates.completedBy = null;
            }

            // 1. Update Task
            await tx.intakeTask.update({
                where: { id: taskId },
                data: updates
            });

            // 2. Audit Log
            await tx.intakeEvent.create({
                data: {
                    intakeId,
                    eventType: 'task_status_change',
                    fieldPath: `tasks/${taskId}/status`,
                    newValue: status,
                    changedBy: auth.userId
                }
            });
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating task status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Assign task to a user using Prisma.
 */
export async function assignTaskAction(taskId: string, assigneeId: string, intakeId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        await prisma.intakeTask.update({
            where: { id: taskId },
            data: { assignedTo: assigneeId }
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error assigning task:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action: Get tasks for an intake using Prisma.
 */
export async function getIntakeTasksAction(intakeId: string) {
    const auth = await verifyAuthentication();
    if (!auth.authenticated || !auth.userId) return { success: false, error: 'Unauthorized' };

    try {
        const tasks = await prisma.intakeTask.findMany({
            where: { intakeId },
            orderBy: { createdAt: 'asc' }
        });

        // Map Prisma snake_case to legacy camelCase/original interface if needed
        // The IntakeTask interface uses snake_case for several fields (intake_id, task_type, etc.)
        // But Prisma uses camelCase (intakeId, taskType). 
        // We'll normalize to the interface expected by the UI.
        const mappedTasks = tasks.map((t: any) => ({
            id: t.id,
            intake_id: t.intakeId,
            title: t.title,
            description: t.description || undefined,
            task_type: t.taskType as any,
            status: t.status as any,
            priority: t.priority as any,
            assigned_to: t.assignedTo || undefined,
            due_date: t.dueDate?.toISOString(),
            completed_at: t.completedAt?.toISOString(),
            completed_by: t.completedBy || undefined,
            created_at: t.createdAt.toISOString(),
            created_by: t.createdById
        }));

        return { success: true, data: mappedTasks };
    } catch (error: any) {
        console.error('Error fetching tasks:', error);
        return { success: false, error: error.message };
    }
}
