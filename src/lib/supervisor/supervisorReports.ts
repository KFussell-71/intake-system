/**
 * Supervisor Report Approval & Revision Operations
 */

import { supabase } from '../supabase';
import { verifySupervisorRole } from '../auth/authHelpersClient';
import { logSupervisorAction } from './supervisorCore';

/**
 * Approve an intake report
 */
export async function approveReport(intakeId: string, notes?: string): Promise<{ success: boolean; error?: any }> {
    try {
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

        const logResult = await logSupervisorAction({
            action_type: 'approve',
            target_id: intakeId,
            target_type: 'intake',
            notes: notes || 'Report approved'
        });

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
 */
export async function returnForRevision(
    intakeId: string,
    reason: string,
    notes: string,
    urgent: boolean = false
): Promise<{ success: boolean; error?: any }> {
    try {
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

        const logResult = await logSupervisorAction({
            action_type: 'return',
            target_id: intakeId,
            target_type: 'intake',
            notes: reason,
            metadata: { urgent, detailedNotes: notes }
        });

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
 */
export async function bulkApproveReports(intakeIds: string[]): Promise<{ success: boolean; count?: number; error?: any }> {
    try {
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { success: false, error: authz.error || 'Unauthorized' };
        }

        const { data, error } = await supabase.rpc('bulk_approve_reports', {
            p_intake_ids: intakeIds
        });

        if (error || (data && !data.success)) {
            return { success: false, error: error || data?.error };
        }

        const logResult = await logSupervisorAction({
            action_type: 'bulk_approve',
            target_id: null,
            target_type: 'intake',
            notes: `Bulk approved ${intakeIds.length} reports`,
            metadata: { count: intakeIds.length, intakeIds }
        });

        if (!logResult.success) {
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
        return { success: false, error };
    }
}

/**
 * Get reports pending review
 */
export async function getPendingReports(): Promise<{ data: any[]; error?: any }> {
    try {
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { data: [], error: 'Unauthorized' };
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

        return { data: data || [], error };
    } catch (error) {
        return { data: [], error };
    }
}

/**
 * Get reports needing revision
 */
export async function getReportsNeedingRevision(): Promise<{ data: any[]; error?: any }> {
    try {
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { data: [], error: 'Unauthorized' };
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

        return { data: data || [], error };
    } catch (error) {
        return { data: [], error };
    }
}
