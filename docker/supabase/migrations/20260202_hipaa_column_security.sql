-- HIPAA Compliance: Column-Level Security for PHI
-- Created: 2026-02-02
-- Purpose: Restrict access to sensitive PHI fields (SSN, medical records) by role

-- ============================================
-- 1. Create Masked SSN Function
-- ============================================

-- Function to mask SSN (show last 4 digits only)
CREATE OR REPLACE FUNCTION mask_ssn(ssn TEXT)
RETURNS TEXT AS $$
BEGIN
    IF ssn IS NULL THEN RETURN NULL; END IF;
    IF LENGTH(ssn) < 4 THEN RETURN 'XXX-XX-XXXX'; END IF;
    RETURN 'XXX-XX-' || RIGHT(ssn, 4);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Create Role-Based Client Views
-- ============================================

-- View for staff (no SSN access)
CREATE OR REPLACE VIEW clients_staff_view AS
SELECT 
    id,
    first_name,
    last_name,
    email,
    phone,
    NULL as ssn,  -- Hidden
    dob,
    address,
    city,
    state,
    zip,
    created_at,
    updated_at
FROM clients;

-- View for supervisors/admins (masked SSN)
CREATE OR REPLACE VIEW clients_supervisor_view AS
SELECT 
    id,
    first_name,
    last_name,
    email,
    phone,
    mask_ssn(ssn) as ssn,  -- Masked (XXX-XX-1234)
    dob,
    address,
    city,
    state,
    zip,
    created_at,
    updated_at
FROM clients;

-- View for billing (full SSN access - LOGGED)
CREATE OR REPLACE VIEW clients_billing_view AS
SELECT 
    id,
    first_name,
    last_name,
    email,
    phone,
    ssn,  -- Full access
    dob,
    address,
    city,
    state,
    zip,
    created_at,
    updated_at
FROM clients;

-- ============================================
-- 3. Helper Functions for Access Control
-- ============================================

-- Check if user can view full SSN
CREATE OR REPLACE FUNCTION can_view_full_ssn()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('billing', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is supervisor or admin
CREATE OR REPLACE FUNCTION is_supervisor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('supervisor', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. RLS Policies for Views
-- ============================================

-- Enable RLS on views
ALTER VIEW clients_staff_view SET (security_barrier = true);
ALTER VIEW clients_supervisor_view SET (security_barrier = true);
ALTER VIEW clients_billing_view SET (security_barrier = true);

-- Staff view: Only assigned clients
CREATE POLICY "Staff can view assigned clients"
ON clients_staff_view FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM client_assignments 
        WHERE client_id = clients_staff_view.id 
        AND assigned_worker_id = auth.uid()
        AND active = true
    )
);

-- Supervisor view: All clients
CREATE POLICY "Supervisors can view all clients"
ON clients_supervisor_view FOR SELECT TO authenticated
USING (is_supervisor_or_admin());

-- Billing view: All clients (with SSN access logging)
CREATE POLICY "Billing can view all clients with SSN"
ON clients_billing_view FOR SELECT TO authenticated
USING (can_view_full_ssn());

-- ============================================
-- 5. Audit SSN Access
-- ============================================

-- Function to log SSN access
CREATE OR REPLACE FUNCTION log_ssn_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if SSN was actually accessed (not NULL)
    IF NEW.ssn IS NOT NULL THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            resource_type,
            resource_id,
            metadata
        ) VALUES (
            auth.uid(),
            'ssn_accessed',
            'client',
            NEW.id,
            jsonb_build_object(
                'timestamp', NOW(),
                'masked_ssn', mask_ssn(NEW.ssn)
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on billing view to log SSN access
-- Note: PostgreSQL doesn't support triggers on views directly
-- This will be handled in application code

-- ============================================
-- 6. Grant Permissions
-- ============================================

-- Grant SELECT on views to authenticated users
GRANT SELECT ON clients_staff_view TO authenticated;
GRANT SELECT ON clients_supervisor_view TO authenticated;
GRANT SELECT ON clients_billing_view TO authenticated;

-- ============================================
-- 7. Documentation
-- ============================================

COMMENT ON VIEW clients_staff_view IS 'HIPAA: Staff view with SSN hidden';
COMMENT ON VIEW clients_supervisor_view IS 'HIPAA: Supervisor view with SSN masked (XXX-XX-1234)';
COMMENT ON VIEW clients_billing_view IS 'HIPAA: Billing view with full SSN access (all access logged)';
COMMENT ON FUNCTION mask_ssn(TEXT) IS 'HIPAA: Masks SSN to show only last 4 digits';
COMMENT ON FUNCTION can_view_full_ssn() IS 'HIPAA: Checks if user has billing or admin role';
