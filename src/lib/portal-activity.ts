import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Portal Activity Logger
 * 
 * Utility for logging portal client actions for audit and supervisor visibility.
 */

export type PortalAction =
    | 'LOGIN'
    | 'LOGOUT'
    | 'DOCUMENT_UPLOADED'
    | 'DOCUMENT_VIEWED'
    | 'QUESTIONNAIRE_COMPLETED'
    | 'PROFILE_VIEWED'
    | 'STATUS_VIEWED'
    | 'SESSION_EXPIRED'
    | 'ACCESS_REVOKED'
    | 'INVITE_SENT';

export interface PortalActivityEntry {
    clientId: string;
    userId?: string;
    action: PortalAction;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Log a portal activity event
 * 
 * @param entry - The activity to log
 * @returns Promise<boolean> - Returns true if logging succeeded
 */
export async function logPortalActivity(entry: PortalActivityEntry): Promise<boolean> {
    try {
        // Use regular client if user context is available
        const supabase = entry.userId ? await createClient() : createAdminClient();

        const { error } = await supabase
            .from('portal_activity')
            .insert({
                client_id: entry.clientId,
                user_id: entry.userId || null,
                action: entry.action,
                metadata: entry.metadata || {},
                ip_address: entry.ipAddress || null,
                user_agent: entry.userAgent || null
            });

        if (error) {
            console.error('[PORTAL_ACTIVITY] Failed to log:', error);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[PORTAL_ACTIVITY] Exception:', err);
        return false;
    }
}

/**
 * Get recent portal activity for a client
 * 
 * @param clientId - The client to get activity for
 * @param limit - Maximum number of records to return
 */
export async function getPortalActivityForClient(
    clientId: string,
    limit: number = 20
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('portal_activity')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[PORTAL_ACTIVITY] Failed to fetch:', error);
        return [];
    }

    return data || [];
}

/**
 * Get recent portal activity across all clients
 * For supervisor dashboard
 * 
 * @param limit - Maximum number of records to return
 */
export async function getRecentPortalActivity(limit: number = 50) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('portal_activity')
        .select(`
            *,
            clients (name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[PORTAL_ACTIVITY] Failed to fetch:', error);
        return [];
    }

    return data || [];
}
