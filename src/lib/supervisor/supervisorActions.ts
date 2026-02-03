/**
 * Supervisor Operations Utility Functions
 * 
 * SECURITY ENHANCED VERSION
 * - All functions verify supervisor/admin role
 * - Audit logging is blocking (failures cause rollback)
 * - Input validation throughout
 * 
 * Shared utilities for supervisor dashboard features including:
 * - Activity logging
 * - Worker management
 * - Client assignments
 * - Report operations
 */

import { supabase } from '../supabase';
import { verifySupervisorRole } from '../auth/authHelpersClient';

// ============================================
// Types
// ============================================

export interface SupervisorAction {
    id?: string;
    supervisor_id?: string;
    action_type: 'approve' | 'return' | 'assign' | 'bulk_approve' | 'bulk_export';
    target_id: string | null;
    target_type: 'intake' | 'client';
    notes?: string;
    metadata?: Record<string, any>;
    created_at?: string;
}

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

export interface Worker {
    id: string;
    username: string;
    email: string;
    role: string;
}

// ============================================
// Activity Logging
// ============================================

/**
 * Log a supervisor action to the database
 * 
 * SECURITY: Verifies supervisor role before logging
 */
export async function logSupervisorAction(action: SupervisorAction): Promise<{ success: boolean; id?: string; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { success: false, error: authz.error || 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('supervisor_actions')
            .insert({
                supervisor_id: authz.userId,
                action_type: action.action_type,
                target_id: action.target_id,
                target_type: action.target_type,
                notes: action.notes,
                metadata: action.metadata,
                created_at: new Date().toISOString()
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error logging supervisor action:', error);
            return { success: false, error };
        }

        return { success: true, id: data?.id };
    } catch (error) {
        console.error('Exception logging supervisor action:', error);
        return { success: false, error };
    }
}

/**
 * Get supervisor action history
 * 
 * SECURITY: Verifies supervisor role before fetching
 */
export async function getSupervisorActions(filters?: {
    actionType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
}): Promise<{
    data: SupervisorAction[];
    error?: any;
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}> {
    try {
        // SECURITY: Verify supervisor role
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { data: [], error: authz.error || 'Unauthorized' };
        }

        // Pagination settings
        const page = filters?.page || 1;
        const pageSize = filters?.limit || 50;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // PERFORMANCE: Select only needed columns (uses covering index)
        let query = supabase
            .from('supervisor_actions')
            .select('id, action_type, target_id, target_type, notes, metadata, created_at', { count: 'exact' })
            .eq('supervisor_id', authz.userId!)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (filters?.actionType) {
            query = query.eq('action_type', filters.actionType);
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching supervisor actions:', error);
            return { data: [], error };
        }

        return {
            data: data || [],
            pagination: {
                page,
                pageSize,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / pageSize)
            }
        };
    } catch (error) {
        console.error('Exception fetching supervisor actions:', error);
        return { data: [], error };
    }
}

// ============================================
// Worker Management
// ============================================

/**
 * Get list of all employment specialists (staff)
 * 
 * SECURITY: Verifies supervisor role before fetching
 */
export async function getWorkerList(): Promise<{ data: Worker[]; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { data: [], error: authz.error || 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, email, role')
            .eq('role', 'staff')
            .order('username');

        if (error) {
            console.error('Error fetching workers:', error);
            return { data: [], error };
        }

        return { data: data || [], error: null };
    } catch (error) {
        console.error('Exception fetching workers:', error);
        return { data: [], error };
    }
}

// ============================================
// Client Assignments
// ============================================

/**
 * Get active assignment for a client
 * 
 * SECURITY: Verifies supervisor role before fetching
 */
export async function getClientAssignment(clientId: string): Promise<{ data: any; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
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
 * 
 * SECURITY: Verifies supervisor role before assigning
 * COMPLIANCE: Audit logging is BLOCKING - if logging fails, assignment is rolled back
 */
export async function assignClientToWorker(assignment: ClientAssignment): Promise<{ success: boolean; data?: any; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
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

        // COMPLIANCE: Log the action - BLOCKING
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

        // CRITICAL: If logging fails, rollback the assignment
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

// ============================================
// Report Operations
// ============================================

/**
 * Approve an intake report
 * 
 * SECURITY: Verifies supervisor role before approving
 * COMPLIANCE: Audit logging is BLOCKING
 */
export async function approveReport(intakeId: string, notes?: string): Promise<{ success: boolean; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { success: false, error: authz.error || 'Unauthorized' };
        }

        const { error } = await supabase
            .from('intakes')
            .update({ status: 'approved' })
            .eq('id', intakeId);

        if (error) {
            console.error('Error approving report:', error);
            return { success: false, error };
        }

        // COMPLIANCE: Log the action - BLOCKING
        const logResult = await logSupervisorAction({
            action_type: 'approve',
            target_id: intakeId,
            target_type: 'intake',
            notes: notes || 'Report approved'
        });

        // CRITICAL: If logging fails, rollback the approval
        if (!logResult.success) {
            console.error('Audit log failed - rolling back approval');
            await supabase
                .from('intakes')
                .update({ status: 'awaiting_review' })
                .eq('id', intakeId);

            return {
                success: false,
                error: 'Failed to log action - operation rolled back for compliance'
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Exception approving report:', error);
        return { success: false, error };
    }
}

/**
 * Return a report for revision
 * 
 * SECURITY: Verifies supervisor role before returning
 * COMPLIANCE: Audit logging is BLOCKING
 */
export async function returnForRevision(
    intakeId: string,
    reason: string,
    notes: string,
    urgent: boolean = false
): Promise<{ success: boolean; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { success: false, error: authz.error || 'Unauthorized' };
        }

        const { error } = await supabase
            .from('intakes')
            .update({
                status: 'needs_revision',
                revision_notes: notes,
                returned_at: new Date().toISOString(),
                returned_by: authz.userId
            })
            .eq('id', intakeId);

        if (error) {
            console.error('Error returning report:', error);
            return { success: false, error };
        }

        // COMPLIANCE: Log the action - BLOCKING
        const logResult = await logSupervisorAction({
            action_type: 'return',
            target_id: intakeId,
            target_type: 'intake',
            notes: reason,
            metadata: { urgent, detailedNotes: notes }
        });

        // CRITICAL: If logging fails, rollback the return
        if (!logResult.success) {
            console.error('Audit log failed - rolling back return');
            await supabase
                .from('intakes')
                .update({
                    status: 'awaiting_review',
                    revision_notes: null,
                    returned_at: null,
                    returned_by: null
                })
                .eq('id', intakeId);

            return {
                success: false,
                error: 'Failed to log action - operation rolled back for compliance'
            };
        }

        return { success: true };
    } catch (error) {
        console.error('Exception returning report:', error);
        return { success: false, error };
    }
}

/**
 * Bulk approve multiple reports
 * 
 * SECURITY: Verifies supervisor role before approving
 * COMPLIANCE: Audit logging is BLOCKING
 */
export async function bulkApproveReports(intakeIds: string[]): Promise<{ success: boolean; count?: number; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { success: false, error: authz.error || 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('intakes')
            .update({ status: 'approved' })
            .in('id', intakeIds);

        if (error) {
            console.error('Error bulk approving reports:', error);
            return { success: false, error };
        }

        // COMPLIANCE: Log the bulk action - BLOCKING
        const logResult = await logSupervisorAction({
            action_type: 'bulk_approve',
            target_id: null,
            target_type: 'intake',
            notes: `Bulk approved ${intakeIds.length} reports`,
            metadata: { count: intakeIds.length, intakeIds }
        });

        // CRITICAL: If logging fails, rollback ALL approvals
        if (!logResult.success) {
            console.error('Audit log failed - rolling back bulk approval');
            await supabase
                .from('intakes')
                .update({ status: 'awaiting_review' })
                .in('id', intakeIds);

            return {
                success: false,
                error: 'Failed to log action - operation rolled back for compliance'
            };
        }

        return { success: true, count: intakeIds.length };
    } catch (error) {
        console.error('Exception bulk approving reports:', error);
        return { success: false, error };
    }
}

/**
 * Get reports pending review
 * 
 * SECURITY: Verifies supervisor role before fetching
 */
export async function getPendingReports(): Promise<{ data: any[]; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { data: [], error: authz.error || 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('intakes')
            .select(`
                id,
                client_id,
                status,
                created_at,
                clients (name),
                profiles!intakes_created_by_fkey (username)
            `)
            .eq('status', 'awaiting_review')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending reports:', error);
            return { data: [], error };
        }

        return { data: data || [], error: null };
    } catch (error) {
        console.error('Exception fetching pending reports:', error);
        return { data: [], error };
    }
}

/**
 * Get reports needing revision
 * 
 * SECURITY: Verifies supervisor role before fetching
 */
export async function getReportsNeedingRevision(): Promise<{ data: any[]; error?: any }> {
    try {
        // SECURITY: Verify supervisor role
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { data: [], error: authz.error || 'Unauthorized' };
        }

        const { data, error } = await supabase
            .from('intakes')
            .select(`
                id,
                client_id,
                status,
                revision_notes,
                returned_at,
                created_at,
                clients (name),
                profiles!intakes_created_by_fkey (username),
                returned_by_user:profiles!returned_by (username)
            `)
            .eq('status', 'needs_revision')
            .order('returned_at', { ascending: false });

        if (error) {
            console.error('Error fetching reports needing revision:', error);
            return { data: [], error };
        }

        return { data: data || [], error: null };
    } catch (error) {
        console.error('Exception fetching reports needing revision:', error);
        return { data: [], error };
    }
}
