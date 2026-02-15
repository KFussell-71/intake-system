'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * SECURITY: Get Portal Client Data
 * 
 * Returns a SANITIZED view of the client's own data.
 * This function is called from portal pages to display client information.
 * 
 * SECURITY CONTROLS:
 * 1. Only returns data for the authenticated portal user's linked client
 * 2. Excludes sensitive fields (SSN, internal notes, etc.)
 * 3. Validates active portal access before returning data
 * 
 * @returns Sanitized client data or null if not authorized
 */
export async function getPortalClientData() {
    const supabase = await createClient();

    // 1. SECURITY: Verify current user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized', data: null };
    }

    // 2. Get the client_users link to verify portal access
    const { data: clientLink, error: linkError } = await supabase
        .from('client_users')
        .select('client_id, is_active, expires_at, revoked_at')
        .eq('id', user.id)
        .single();

    if (linkError || !clientLink) {
        return { success: false, error: 'Portal access not found', data: null };
    }

    // 3. SECURITY: Verify access is active and not expired
    if (!clientLink.is_active) {
        return { success: false, error: 'Portal access has been revoked', data: null };
    }

    if (clientLink.revoked_at) {
        return { success: false, error: 'Portal access has been revoked', data: null };
    }

    if (new Date(clientLink.expires_at) < new Date()) {
        return { success: false, error: 'Portal access has expired. Please contact your Case Manager.', data: null };
    }

    // 4. Fetch SANITIZED client data (no SSN, no internal notes)
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
            id,
            name,
            email,
            phone,
            address,
            created_at
        `)
        .eq('id', clientLink.client_id)
        .single();

    if (clientError || !client) {
        return { success: false, error: 'Client record not found', data: null };
    }

    // 5. Fetch latest intake summary (sanitized)
    const { data: intake } = await supabase
        .from('intakes')
        .select(`
            id,
            status,
            report_date,
            created_at
        `)
        .eq('client_id', clientLink.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    // 6. Fetch milestones (Visual Journey)
    const { data: milestones } = await supabase
        .from('tracking_milestones')
        .select(`
            id,
            milestone_name,
            completion_date,
            step_order,
            description,
            created_at
        `)
        .eq('client_id', clientLink.client_id)
        .order('step_order', { ascending: true })
        .order('created_at', { ascending: true });

    // 7. Fetch documents (metadata only, not content)
    // Use actual column names from schema (type, not document_type)
    const { data: documents } = await supabase
        .from('documents')
        .select(`
            id,
            name,
            type,
            uploaded_at
        `)
        .eq('client_id', clientLink.client_id)
        .order('uploaded_at', { ascending: false });

    // 8. Fetch document requests
    const { data: documentRequests } = await supabase
        .from('document_requests')
        .select(`
            id,
            name,
            description,
            status,
            requested_at
        `)
        .eq('client_id', clientLink.client_id)
        .order('requested_at', { ascending: false });

    // 9. Return sanitized data
    return {
        success: true,
        error: null,
        data: {
            client: {
                id: client.id,
                name: client.name,
                // Only show partial email for privacy
                email: client.email ? maskEmail(client.email) : null,
                phone: client.phone ? maskPhone(client.phone) : null,
                address: client.address,
                memberSince: client.created_at
            },
            intake: intake ? {
                status: intake.status,
                reportDate: intake.report_date,
                submittedAt: intake.created_at
            } : null,
            milestones: milestones || [],
            documents: documents || [],
            documentRequests: documentRequests || [],
            accessInfo: {
                expiresAt: clientLink.expires_at
            }
        }
    };
}

/**
 * Mask email for privacy display
 */
function maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
        return '***@***';
    }
    const [local, domain] = email.split('@');
    if (!local || local.length <= 2) {
        return `${local?.[0] || '*'}***@${domain || '***'}`;
    }
    return `${local[0]}${local[1]}***@${domain}`;
}

/**
 * Mask phone for privacy display
 */
function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) return '***';
    return `***-***-${digits.slice(-4)}`;
}
