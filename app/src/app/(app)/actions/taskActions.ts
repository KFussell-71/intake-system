'use server';

import { createClient } from '@/lib/supabase/server';
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

export async function createTaskAction(data: CreateTaskInput) {
    const supabase = await createClient();

    // Auth Check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const payload = {
            ...data,
            created_by: user.id,
            status: data.status || 'pending',
            priority: data.priority || 'medium'
        };

        const { data: newTask, error } = await supabase
            .from('intake_tasks')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        // Audit Log
        await supabase.from('intake_events').insert({
            intake_id: data.intake_id,
            event_type: 'task_created',
            field_path: 'tasks',
            new_value: data.title,
            changed_by: user.id
        });

        revalidatePath(`/intake/${data.intake_id}`);
        return { success: true, task: newTask };
    } catch (error: any) {
        console.error('Error creating task:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTaskStatusAction(taskId: string, status: TaskStatus, intakeId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const updates: any = { status };
        if (status === 'completed') {
            updates.completed_at = new Date().toISOString();
            updates.completed_by = user.id;
        } else {
            updates.completed_at = null;
            updates.completed_by = null;
        }

        const { error } = await supabase
            .from('intake_tasks')
            .update(updates)
            .eq('id', taskId);

        if (error) throw error;

        // Audit Log
        await supabase.from('intake_events').insert({
            intake_id: intakeId,
            event_type: 'task_status_change',
            field_path: `tasks/${taskId}/status`,
            new_value: status,
            changed_by: user.id
        });

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error updating task status:', error);
        return { success: false, error: error.message };
    }
}

export async function assignTaskAction(taskId: string, assigneeId: string, intakeId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    try {
        const { error } = await supabase
            .from('intake_tasks')
            .update({ assigned_to: assigneeId })
            .eq('id', taskId);

        if (error) throw error;

        revalidatePath(`/intake/${intakeId}`);
        return { success: true };
    } catch (error: any) {
        console.error('Error assigning task:', error);
        return { success: false, error: error.message };
    }
}
