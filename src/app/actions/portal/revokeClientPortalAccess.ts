'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import { revalidatePath } from 'next/cache';

/**
 * SECURITY: Revoke Client Portal Access
 * 
 * This action immediately revokes a client's portal access.
 * 
 * SECURITY CONTROLS:
 * 1. Only staff assigned to the client can revoke access
 * 2. Sets is_active = false and revoked_at = now()
 * 3. Full audit logging
 * 
 * @param clientId - The client whose access to revoke
 * @param reason - Optional reason for revocation
 */
export async function revokeClientPortalAccess(
    clientId: string,
    reason?: string
) {
    const supabase = await createClient();

    // 1. SECURITY: Verify current user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized: Authentication required' };
    }

    // 2. SECURITY: Verify user has access to this client
    // We try to fetch the client first. If it fails, we check if the user is an admin.
    let { data: clientAccess, error: accessError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', clientId)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .single();

    if (accessError || !clientAccess) {
        // Check for admin/supervisor role override
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'supervisor'].includes(profile.role || '')) {
            return {
                success: false,
                error: 'Access denied: You are not authorized to revoke this client\'s access'
            };
        }

        // If admin, we still need client details for logging
        // Fetch them using the specific ID without the 'or' filter
        const { data: adminClientView } = await supabase
            .from('clients')
            .select('id, name')
            .eq('id', clientId)
            .single();

        if (adminClientView) {
            clientAccess = adminClientView;
        }
    }

    // 3. Use admin client for the update
    const adminSupabase = createAdminClient();

    // 4. Revoke access
    const { data: revokedAccess, error: revokeError } = await adminSupabase
        .from('client_users')
        .update({
            is_active: false,
            revoked_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('is_active', true)
        .select()
        .single();

    if (revokeError) {
        if (revokeError.code === 'PGRST116') {
            return { success: false, error: 'No active portal access found for this client' };
        }
        console.error('[PORTAL] Failed to revoke access:', revokeError);
        return { success: false, error: 'Failed to revoke access' };
    }

    // 5. Log portal activity
    await adminSupabase.from('portal_activity').insert({
        client_id: clientId,
        user_id: revokedAccess.id,
        action: 'ACCESS_REVOKED',
        metadata: {
            revoked_by: user.id,
            reason: reason || 'Manual revocation by staff',
            revoked_at: new Date().toISOString()
        }
    });

    // 6. AUDIT: Log the revocation
    await logAuditEvent({
        action: 'UPDATE',
        entityType: 'client_portal_access',
        entityId: clientId,
        details: {
            client_name: clientAccess?.name,
            action: 'revoked',
            reason: reason || 'Manual revocation by staff',
            revoked_by: user.id
        }
    });

    revalidatePath('/directory');
    revalidatePath(`/clients/${clientId}`);

    return {
        success: true,
        message: `Portal access revoked for ${clientAccess?.name || 'client'}.`
    };
}
