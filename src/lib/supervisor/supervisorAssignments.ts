/**
 * Supervisor Client Assignment Operations
 */

import { supabase } from '../supabase';
import { verifySupervisorRole } from '../auth/authHelpersClient';
import { logSupervisorAction } from './supervisorCore';

export interface ClientAssignment {
    id?: string;
    client_id: string;
    assigned_worker_id: string;
    assigned_by?: string;
    assigned_date?: string;
    assignment_type: 'primary' | 'secondary';
    notes?: string;
    active?: boolean;
}

/**
 * Get active assignment for a client
 */
export async function getClientAssignment(clientId: string): Promise<{ data: any; error?: any }> {
    try {
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { data: null, error: authz.error || 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('client_assignments')
            .select(`
                *,
                worker:profiles!assigned_worker_id(id, username, email),
                assigned_by_user:profiles!assigned_by(username)
            `)
            .eq('client_id', clientId)
            .eq('active', true)
            .order('assigned_date', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching client assignment:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (error) {
        console.error('Exception fetching client assignment:', error);
        return { data: null, error };
    }
}

/**
 * Assign a client to a worker
 */
export async function assignClientToWorker(assignment: ClientAssignment): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { success: false, error: authz.error || 'Unauthorized' };
        }

        // Deactivate previous assignments
        await supabase
            .from('client_assignments')
            .update({ active: false })
            .eq('client_id', assignment.client_id)
            .eq('active', true);

        // Create new assignment
        const { data, error } = await supabase
            .from('client_assignments')
            .insert({
                client_id: assignment.client_id,
                assigned_worker_id: assignment.assigned_worker_id,
                assigned_by: authz.userId,
                assignment_type: assignment.assignment_type,
                notes: assignment.notes,
                assigned_date: new Date().toISOString(),
                active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error assigning client:', error);
            return { success: false, error };
        }

        // Audit Log
        const logResult = await logSupervisorAction({
            action_type: 'assign',
            target_id: assignment.client_id,
            target_type: 'client',
            notes: `Assigned to worker ${assignment.assigned_worker_id}`,
            metadata: {
                workerId: assignment.assigned_worker_id,
                assignmentType: assignment.assignment_type
            }
        });

        if (!logResult.success) {
            console.error('Audit log failed - rolling back assignment');
            await supabase
                .from('client_assignments')
                .delete()
                .eq('id', data.id);

            return {
                success: false,
                error: 'Failed to log action - operation rolled back for compliance'
            };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception assigning client:', error);
        return { success: false, error };
    }
}
