/**
 * Analytics Service
 * 
 * Provides metrics and analytics for supervisors, staff, and clients
 */

import { supabase } from '@/lib/supabase/client';

export interface SupervisorMetrics {
    totalReviewed: number;
    totalApproved: number;
    totalReturned: number;
    approvalRate: number;
    avgReviewTimeHours: number;
    trend: 'up' | 'down' | 'stable';
}

export interface StaffMetrics {
    totalSubmitted: number;
    totalApproved: number;
    totalReturned: number;
    successRate: number;
    avgCompletionTimeHours: number;
}

/**
 * Get supervisor metrics
 */
export async function getSupervisorMetrics(params: {
    supervisorId: string;
    startDate: string;
    endDate: string;
}): Promise<{ data?: SupervisorMetrics; error?: any }> {
    try {
        // Get supervisor actions in date range
        const { data: actions, error } = await supabase
            .from('supervisor_actions')
            .select('*')
            .eq('supervisor_id', params.supervisorId)
            .gte('created_at', params.startDate)
            .lte('created_at', params.endDate);

        if (error) {
            return { error };
        }

        const totalApproved = actions?.filter(a => a.action_type === 'approve').length || 0;
        const totalReturned = actions?.filter(a => a.action_type === 'return').length || 0;
        const totalReviewed = totalApproved + totalReturned;
        const approvalRate = totalReviewed > 0 ? (totalApproved / totalReviewed) * 100 : 0;

        // Calculate average review time
        const { data: intakes } = await supabase
            .from('intakes')
            .select('created_at, updated_at')
            .eq('status', 'approved')
            .gte('updated_at', params.startDate)
            .lte('updated_at', params.endDate);

        const avgReviewTimeMs = intakes?.reduce((sum, intake) => {
            const reviewTime = new Date(intake.updated_at).getTime() - new Date(intake.created_at).getTime();
            return sum + reviewTime;
        }, 0) || 0;

        const avgReviewTimeHours = intakes?.length
            ? (avgReviewTimeMs / intakes.length) / (1000 * 60 * 60)
            : 0;

        // Calculate trend (compare to previous period)
        const periodLength = new Date(params.endDate).getTime() - new Date(params.startDate).getTime();
        const prevStartDate = new Date(new Date(params.startDate).getTime() - periodLength).toISOString();
        const prevEndDate = params.startDate;

        const { data: prevActions } = await supabase
            .from('supervisor_actions')
            .select('*')
            .eq('supervisor_id', params.supervisorId)
            .gte('created_at', prevStartDate)
            .lte('created_at', prevEndDate);

        const prevTotalReviewed = prevActions?.length || 0;
        const trend = totalReviewed > prevTotalReviewed ? 'up' :
            totalReviewed < prevTotalReviewed ? 'down' : 'stable';

        return {
            data: {
                totalReviewed,
                totalApproved,
                totalReturned,
                approvalRate,
                avgReviewTimeHours,
                trend
            }
        };
    } catch (error) {
        return { error };
    }
}

/**
 * Get staff metrics
 */
export async function getStaffMetrics(params: {
    staffId: string;
    startDate: string;
    endDate: string;
}): Promise<{ data?: StaffMetrics; error?: any }> {
    try {
        const { data: intakes, error } = await supabase
            .from('intakes')
            .select('*')
            .eq('assigned_worker_id', params.staffId)
            .gte('created_at', params.startDate)
            .lte('created_at', params.endDate);

        if (error) {
            return { error };
        }

        const totalSubmitted = intakes?.length || 0;
        const totalApproved = intakes?.filter(i => i.status === 'approved').length || 0;
        const totalReturned = intakes?.filter(i => i.status === 'needs_revision').length || 0;
        const successRate = totalSubmitted > 0 ? (totalApproved / totalSubmitted) * 100 : 0;

        // Calculate average completion time
        const completedIntakes = intakes?.filter(i => i.status === 'approved') || [];
        const avgCompletionTimeMs = completedIntakes.reduce((sum, intake) => {
            const completionTime = new Date(intake.updated_at).getTime() - new Date(intake.created_at).getTime();
            return sum + completionTime;
        }, 0);

        const avgCompletionTimeHours = completedIntakes.length
            ? (avgCompletionTimeMs / completedIntakes.length) / (1000 * 60 * 60)
            : 0;

        return {
            data: {
                totalSubmitted,
                totalApproved,
                totalReturned,
                successRate,
                avgCompletionTimeHours
            }
        };
    } catch (error) {
        return { error };
    }
}

/**
 * Get client outcome metrics
 */
export async function getClientMetrics(params: {
    startDate: string;
    endDate: string;
}) {
    try {
        const { data: clients, error } = await supabase
            .from('clients')
            .select('*, intakes(*)')
            .gte('created_at', params.startDate)
            .lte('created_at', params.endDate);

        if (error) {
            return { error };
        }

        const totalClients = clients?.length || 0;
        const clientsWithIntakes = clients?.filter(c => c.intakes && c.intakes.length > 0).length || 0;
        const intakeCompletionRate = totalClients > 0 ? (clientsWithIntakes / totalClients) * 100 : 0;

        return {
            data: {
                totalClients,
                clientsWithIntakes,
                intakeCompletionRate
            }
        };
    } catch (error) {
        return { error };
    }
}

/**
 * Get dashboard summary
 */
export async function getDashboardSummary(userId: string, role: string) {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Last 30 days

    if (role === 'supervisor' || role === 'admin') {
        return getSupervisorMetrics({ supervisorId: userId, startDate, endDate });
    } else {
        return getStaffMetrics({ staffId: userId, startDate, endDate });
    }
}
