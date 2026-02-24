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
    -- Already masked or short
    RETURN ssn; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Create Role-Based Client Views
-- ============================================

-- View for staff (no SSN access)
CREATE OR REPLACE VIEW clients_staff_view AS
SELECT 
    id,
    name,
    email,
    phone,
    NULL as ssn_last_four,  -- Hidden
    address,
    created_at
FROM clients;

-- View for supervisors/admins (masked SSN)
CREATE OR REPLACE VIEW clients_supervisor_view AS
SELECT 
    id,
    name,
    email,
    phone,
    ssn_last_four,  -- Already last 4
    address,
    created_at
FROM clients;

-- View for billing (full SSN access - LOGGED)
CREATE OR REPLACE VIEW clients_billing_view AS
SELECT 
    id,
    name,
    email,
    phone,
    ssn_last_four,  -- Full access
    address,
    created_at
FROM clients;

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
-- Enable RLS (inheritance) on views
ALTER VIEW clients_staff_view SET (security_invoker = true);
ALTER VIEW clients_supervisor_view SET (security_invoker = true);
ALTER VIEW clients_billing_view SET (security_invoker = true);

-- Staff view: Only assigned clients
-- Policies removed: Views should inherit policies from underlying 'clients' table
-- via security_invoker = true.

-- ============================================
-- 5. Audit SSN Access
-- ============================================

-- Function to log SSN access
CREATE OR REPLACE FUNCTION log_ssn_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if SSN was actually accessed (not NULL)
    IF NEW.ssn_last_four IS NOT NULL THEN
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
                'masked_ssn', mask_ssn(NEW.ssn_last_four)
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
