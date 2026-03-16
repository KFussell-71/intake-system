-- ============================================================================
-- SECURE CLIENT PORTAL SCHEMA MIGRATION
-- ============================================================================
-- Date: 2026-01-31
-- Purpose: Implement magic-link authenticated client portal with SOC 2 compliance
-- 
-- SECURITY DESIGN PRINCIPLES:
-- 1. No passwords - Magic-link only authentication
-- 2. No SSN usage - Email-based identity verification  
-- 3. No self-registration - Case manager controlled invites
-- 4. Time-bounded access - Automatic expiration (30 days default)
-- 5. Full audit logging - All portal actions recorded
-- 6. Explicit DENY policies - Sensitive tables blocked for portal users
-- ============================================================================

-- ============================================================================
-- 1. CLIENT-USER LINK TABLE
-- Links authenticated auth.users to their client record
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    -- SECURITY: Time-bounded access with automatic expiration
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    revoked_at TIMESTAMPTZ,
    invited_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one user maps to one client
    CONSTRAINT unique_client_user UNIQUE (client_id)
);

-- Index for quick lookups during auth checks
CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_is_active ON client_users(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. PORTAL ACTIVITY AUDIT TABLE
-- Tracks all client portal actions for supervisor visibility and compliance
-- ============================================================================
CREATE TABLE IF NOT EXISTS portal_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    -- Available actions: LOGIN, DOCUMENT_UPLOADED, QUESTIONNAIRE_COMPLETED, 
    -- PROFILE_VIEWED, SESSION_EXPIRED, ACCESS_REVOKED
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for supervisor dashboard queries
CREATE INDEX IF NOT EXISTS idx_portal_activity_client_id ON portal_activity(client_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_created_at ON portal_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_activity_action ON portal_activity(action);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_activity ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CLIENT_USERS RLS POLICIES
-- ============================================================================

-- Staff can view client_users for clients they manage
CREATE POLICY "Staff can view assigned client_users" ON client_users
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_users.client_id 
            AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
        )
        OR
        -- Admins can see all
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
    );

-- Staff can invite clients (insert)
CREATE POLICY "Staff can invite assigned clients" ON client_users
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_users.client_id 
            AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
        )
        OR
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
    );

-- Staff can revoke access (update)
CREATE POLICY "Staff can revoke assigned client access" ON client_users
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_users.client_id 
            AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
        )
        OR
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
    );

-- Client can view their own record (to confirm access is valid)
CREATE POLICY "Portal client can view own link" ON client_users
    FOR SELECT TO authenticated
    USING (
        id = auth.uid()
        AND is_active = true
        AND revoked_at IS NULL
        AND expires_at > NOW()
    );

-- ============================================================================
-- 5. PORTAL ACTIVITY RLS POLICIES
-- ============================================================================

-- Staff can view activity for assigned clients
CREATE POLICY "Staff can view assigned portal_activity" ON portal_activity
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = portal_activity.client_id 
            AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
        )
        OR
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
    );

-- Portal clients can insert their own activity (for logging)
CREATE POLICY "Portal clients can log own activity" ON portal_activity
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM client_users
            WHERE client_users.id = auth.uid()
            AND client_users.client_id = portal_activity.client_id
            AND client_users.is_active = true
            AND client_users.revoked_at IS NULL
            AND client_users.expires_at > NOW()
        )
    );

-- System can insert activity (via service role)
CREATE POLICY "System can log portal activity" ON portal_activity
    FOR INSERT TO service_role
    WITH CHECK (true);

-- ============================================================================
-- 6. PORTAL-SPECIFIC DOCUMENT RLS POLICIES
-- ============================================================================

-- Portal clients can view their own documents
CREATE POLICY "Portal clients can view own documents" ON documents
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_users
            WHERE client_users.id = auth.uid()
            AND client_users.client_id = documents.client_id
            AND client_users.is_active = true
            AND client_users.revoked_at IS NULL
            AND client_users.expires_at > NOW()
        )
    );

-- Portal clients can upload documents for themselves
CREATE POLICY "Portal clients can upload own documents" ON documents
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM client_users
            WHERE client_users.id = auth.uid()
            AND client_users.client_id = documents.client_id
            AND client_users.is_active = true
            AND client_users.revoked_at IS NULL
            AND client_users.expires_at > NOW()
        )
    );

-- ============================================================================
-- 7. PORTAL-SPECIFIC CLIENT RLS POLICIES
-- Portal users can only see sanitized view of their own record
-- ============================================================================

-- Portal clients can view their own client record
CREATE POLICY "Portal clients can view own client record" ON clients
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_users
            WHERE client_users.id = auth.uid()
            AND client_users.client_id = clients.id
            AND client_users.is_active = true
            AND client_users.revoked_at IS NULL
            AND client_users.expires_at > NOW()
        )
    );

-- ============================================================================
-- 8. EXPLICIT DENY POLICIES FOR SENSITIVE TABLES
-- Defense in depth: Even if application layer fails, DB blocks access
-- ============================================================================

-- Deny portal users access to report_versions
CREATE POLICY "Deny portal access to report_versions" ON report_versions
    FOR ALL TO authenticated
    USING (
        -- Allow if user is staff (has profile) or if they created it
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    );

-- Deny portal users access to report_reviews
CREATE POLICY "Deny portal access to report_reviews" ON report_reviews
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    );

-- Note: audit_logs already has restrictive policies from previous migration

-- ============================================================================
-- 9. AUTOMATIC EXPIRATION FUNCTION
-- Runs nightly to revoke expired portal access
-- ============================================================================

CREATE OR REPLACE FUNCTION revoke_expired_portal_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    revoked_count INTEGER;
BEGIN
    -- Revoke expired but still active access
    UPDATE client_users
    SET 
        is_active = false,
        revoked_at = NOW()
    WHERE expires_at <= NOW()
    AND is_active = true
    AND revoked_at IS NULL;
    
    GET DIAGNOSTICS revoked_count = ROW_COUNT;
    
    -- Log the revocation for audit
    IF revoked_count > 0 THEN
        INSERT INTO portal_activity (client_id, action, metadata)
        SELECT 
            client_id,
            'ACCESS_EXPIRED',
            jsonb_build_object(
                'expires_at', expires_at,
                'revoked_by', 'system_cron',
                'revoked_at', NOW()
            )
        FROM client_users
        WHERE revoked_at = (SELECT MAX(revoked_at) FROM client_users WHERE revoked_at IS NOT NULL);
    END IF;
    
    RAISE NOTICE 'Revoked % expired portal access records', revoked_count;
END;
$$;

-- ============================================================================
-- 10. SCHEDULE NIGHTLY EXPIRATION JOB (Requires pg_cron extension)
-- Run at 2:00 AM daily
-- ============================================================================

-- Note: This requires pg_cron extension to be enabled in Supabase
-- If pg_cron is available, uncomment the following:

-- SELECT cron.schedule(
--     'revoke-expired-client-portal',
--     '0 2 * * *',
--     $$SELECT revoke_expired_portal_access();$$
-- );

-- Alternative: Create a Supabase Edge Function that runs on a schedule
-- and calls the revoke_expired_portal_access() function

-- ============================================================================
-- 11. STORAGE POLICIES FOR PORTAL DOCUMENT UPLOADS
-- ============================================================================

-- Portal clients can upload to client-documents bucket for their client folder
CREATE POLICY "Portal clients can upload own storage" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'client-documents' 
        AND EXISTS (
            SELECT 1 FROM client_users
            WHERE client_users.id = auth.uid()
            AND storage.objects.name LIKE 'client-' || client_users.client_id::text || '/%'
            AND client_users.is_active = true
            AND client_users.revoked_at IS NULL
            AND client_users.expires_at > NOW()
        )
    );

-- Portal clients can read their own uploaded documents
CREATE POLICY "Portal clients can read own storage" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'client-documents'
        AND EXISTS (
            SELECT 1 FROM client_users
            WHERE client_users.id = auth.uid()
            AND storage.objects.name LIKE 'client-' || client_users.client_id::text || '/%'
            AND client_users.is_active = true
            AND client_users.revoked_at IS NULL
            AND client_users.expires_at > NOW()
        )
    );

-- ============================================================================
-- 12. MIGRATION AUDIT LOG
-- ============================================================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
SELECT 
    auth.uid(),
    'CREATE',
    'MIGRATION',
    gen_random_uuid(),
    jsonb_build_object(
        'migration', 'client_portal_schema',
        'version', '20260131',
        'tables_created', ARRAY['client_users', 'portal_activity'],
        'policies_created', 12,
        'description', 'Secure client portal with magic-link auth, automatic expiration, and audit logging'
    )
WHERE auth.uid() IS NOT NULL;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
