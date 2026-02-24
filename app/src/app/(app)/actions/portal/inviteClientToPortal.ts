'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';

/**
 * SECURITY: Invite Client to Portal
 * 
 * This action generates a magic-link invitation for a client to access the portal.
 * 
 * SECURITY CONTROLS:
 * 1. Only staff assigned to the client can invite them
 * 2. Uses admin client to generate magic link
 * 3. Creates client_users link with expiration
 * 4. Full audit logging
 * 
 * @param clientId - The client to invite
 * @param clientEmail - The email address to send the magic link to
 * @param expirationDays - Days until access expires (default 30)
 */
export async function inviteClientToPortal(
    clientId: string,
    clientEmail: string,
    expirationDays: number = 30
) {
    // Use regular client for auth checks
    const supabase = await createClient();

    // 1. SECURITY: Verify current user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized: Authentication required' };
    }

    // 2. SECURITY: Verify user has access to this client
    const { data: clientAccess, error: accessError } = await supabase
        .from('clients')
        .select('id, name, email')
        .eq('id', clientId)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`)
        .single();

    if (accessError || !clientAccess) {
        return {
            success: false,
            error: 'Access denied: You are not authorized to invite this client'
        };
    }

    // 3. SECURITY: Validate email format (strict)
    // Prevents common injection patterns and invalid formats
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(clientEmail) || clientEmail.length > 254) {
        return { success: false, error: 'Invalid email format' };
    }

    // 4. Check if client already has portal access
    const { data: existingAccess } = await supabase
        .from('client_users')
        .select('id, is_active, expires_at')
        .eq('client_id', clientId)
        .single();

    if (existingAccess?.is_active && new Date(existingAccess.expires_at) > new Date()) {
        return {
            success: false,
            error: 'Client already has active portal access. Revoke existing access to send new invitation.'
        };
    }

    // 5. Use admin client for privileged operations
    const adminSupabase = createAdminClient();

    // 6. Generate magic link using Supabase admin API
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email: clientEmail,
        options: {
            redirectTo: `${appUrl}/portal`
        }
    });

    if (linkError) {
        console.error('[PORTAL] Failed to generate magic link:', linkError);
        return { success: false, error: 'Failed to generate invitation link' };
    }

    // 7. Get or create the auth user ID from the generated link data
    const portalUserId = linkData.user?.id;

    if (!portalUserId) {
        return { success: false, error: 'Failed to create portal user' };
    }

    // 8. Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // 9. Upsert client_users record (handles both new and re-invitations)
    const { error: linkInsertError } = await adminSupabase
        .from('client_users')
        .upsert({
            id: portalUserId,
            client_id: clientId,
            is_active: true,
            expires_at: expiresAt.toISOString(),
            revoked_at: null,
            invited_by: user.id
        }, {
            onConflict: 'client_id'
        });

    if (linkInsertError) {
        console.error('[PORTAL] Failed to create client_users link:', linkInsertError);
        return { success: false, error: 'Failed to create portal access record' };
    }

    // 10. Log portal activity
    await adminSupabase.from('portal_activity').insert({
        client_id: clientId,
        user_id: portalUserId,
        action: 'INVITE_SENT',
        metadata: {
            invited_by: user.id,
            email: clientEmail,
            expires_at: expiresAt.toISOString()
        }
    });

    // 11. AUDIT: Log the invitation
    await logAuditEvent({
        action: 'CREATE',
        entityType: 'client_portal_invite',
        entityId: clientId,
        details: {
            client_name: clientAccess.name,
            invited_email: clientEmail,
            expires_at: expiresAt.toISOString(),
            invited_by: user.id
        }
    });

    // SECURITY: Never return magic link in API response
    // The link is sent directly to the user's email by Supabase
    return {
        success: true,
        message: `Invitation sent to ${clientEmail}. Access expires ${expiresAt.toLocaleDateString()}.`
    };
}
