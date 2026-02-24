-- Audit Comments Migration
-- Created: 2026-02-03
-- Purpose: Add auditor-friendly comments to security-critical objects

-- ============================================================================
-- 1. SECURITY VIEWS
-- ============================================================================
COMMENT ON VIEW clients_staff_view IS 
'HIPAA: SSN hidden, staff-safe projection of client data. Used for general staff access.';

-- ============================================================================
-- 2. IMMUTABILITY TRIGGERS
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_logs_immutable_update') THEN
        COMMENT ON TRIGGER audit_logs_immutable_update ON audit_logs IS 
        'HIPAA: Prevents UPDATE of audit logs to ensure non-repudiation.';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_logs_immutable_delete') THEN
        COMMENT ON TRIGGER audit_logs_immutable_delete ON audit_logs IS 
        'HIPAA: Prevents DELETE of audit logs to ensure non-repudiation.';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_audit_modification') THEN
        COMMENT ON FUNCTION prevent_audit_modification() IS 
        'Security: Rejects any modification attempts on audit_logs table.';
    END IF;
END $$;

-- ============================================================================
-- 3. ARCHIVAL FUNCTIONS
-- ============================================================================
COMMENT ON FUNCTION archive_old_audit_logs(integer) IS 
'Maintenance: Moves audit logs older than the specified days (default 90) to audit_logs_archive.';
