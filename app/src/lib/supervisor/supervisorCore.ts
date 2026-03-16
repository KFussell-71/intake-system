/**
 * Supervisor Core Utilities
 * Types and basic logging shared across supervisor modules.
 */

import { supabase } from '../supabase';
import { verifySupervisorRole } from '../auth/authHelpersClient';

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

export interface Worker {
    id: string;
    username: string;
    email: string;
    role: string;
}

/**
 * Log a supervisor action to the database
 */
export async function logSupervisorAction(action: SupervisorAction): Promise<{ success: boolean; id?: string; error?: any }> {
    try {
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
        const authz = await verifySupervisorRole();
        if (!authz.authorized) {
            return { data: [], error: authz.error || 'Unauthorized' };
        }

        const page = filters?.page || 1;
        const pageSize = filters?.limit || 50;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

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

/**
 * Get list of all employment specialists (staff)
 */
export async function getWorkerList(): Promise<{ data: Worker[]; error?: any }> {
    try {
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
