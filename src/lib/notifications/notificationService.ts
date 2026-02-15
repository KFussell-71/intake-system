/**
 * Notification Service
 * 
 * Handles creation and management of user notifications
 */

import { createClient } from '@/lib/supabase/browser';
const supabase = createClient();

export interface Notification {
    id: string;
    user_id: string;
    type: 'report_submitted' | 'report_returned' | 'report_approved' | 'worker_assigned' | 'document_uploaded';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
    metadata?: any;
}

/**
 * Create a new notification
 */
export async function createNotification(params: {
    userId: string;
    type: Notification['type'];
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}) {
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link,
            metadata: params.metadata
        })
        .select()
        .single();

    // SECURITY REMEDIATION: FINDING 5 - Missing Audit Logging
    // Log notification creation for accountability and compliance (SOC 2)
    if (data && !error) {
        await supabase.from('audit_logs').insert({
            user_id: params.userId, // Targeted user
            action: 'notification_created',
            resource_type: 'notification',
            resource_id: data.id,
            metadata: {
                type: params.type,
                title: params.title,
                metadata: params.metadata
            }
        });
    }

    return { data, error };
}

/**
 * Get notifications for a user
 */
export async function getNotifications(params: {
    userId: string;
    unreadOnly?: boolean;
    limit?: number;
}) {
    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', params.userId)
        .order('created_at', { ascending: false });

    if (params.unreadOnly) {
        query = query.eq('read', false);
    }

    if (params.limit) {
        query = query.limit(params.limit);
    }

    const { data, error } = await query;
    return { data, error };
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

    return { error };
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(userId: string) {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

    return { error };
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string) {
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

    return { count: count || 0, error };
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

    return { error };
}

// ============================================
// Notification Creators (Helper Functions)
// ============================================

/**
 * Notify supervisor when report is submitted
 */
export async function notifyReportSubmitted(params: {
    supervisorId: string;
    staffName: string;
    clientName: string;
    reportId: string;
}) {
    return createNotification({
        userId: params.supervisorId,
        type: 'report_submitted',
        title: 'New Report Submitted',
        message: `${params.staffName} submitted a report for ${params.clientName}`,
        link: `/supervisor/review-queue`,
        metadata: {
            reportId: params.reportId,
            staffName: params.staffName,
            clientName: params.clientName
        }
    });
}

/**
 * Notify staff when report is returned
 */
export async function notifyReportReturned(params: {
    staffId: string;
    clientName: string;
    reason: string;
    reportId: string;
    urgent?: boolean;
}) {
    return createNotification({
        userId: params.staffId,
        type: 'report_returned',
        title: params.urgent ? '🔴 Urgent: Report Returned' : 'Report Returned for Revision',
        message: `Report for ${params.clientName} needs revision: ${params.reason}`,
        link: `/reports/${params.reportId}`,
        metadata: {
            reportId: params.reportId,
            clientName: params.clientName,
            reason: params.reason,
            urgent: params.urgent
        }
    });
}

/**
 * Notify staff when report is approved
 */
export async function notifyReportApproved(params: {
    staffId: string;
    clientName: string;
    reportId: string;
}) {
    return createNotification({
        userId: params.staffId,
        type: 'report_approved',
        title: '✅ Report Approved',
        message: `Report for ${params.clientName} has been approved`,
        link: `/reports/${params.reportId}`,
        metadata: {
            reportId: params.reportId,
            clientName: params.clientName
        }
    });
}

/**
 * Notify worker when assigned to client
 */
export async function notifyWorkerAssigned(params: {
    workerId: string;
    clientName: string;
    clientId: string;
    assignmentType: string;
}) {
    return createNotification({
        userId: params.workerId,
        type: 'worker_assigned',
        title: 'New Client Assignment',
        message: `You've been assigned as ${params.assignmentType} specialist for ${params.clientName}`,
        link: `/clients/${params.clientId}`,
        metadata: {
            clientId: params.clientId,
            clientName: params.clientName,
            assignmentType: params.assignmentType
        }
    });
}
