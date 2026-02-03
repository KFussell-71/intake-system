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
COMMENT ON TRIGGER audit_logs_immutable_trigger ON audit_logs IS 
'HIPAA: Prevents UPDATE or DELETE of audit logs to ensure non-repudiation.';

COMMENT ON FUNCTION prevent_audit_log_modification() IS 
'Security: Rejects any modification attempts on audit_logs table.';

-- ============================================================================
-- 3. ARCHIVAL FUNCTIONS
-- ============================================================================
COMMENT ON FUNCTION archive_old_audit_logs(integer) IS 
'Maintenance: Moves audit logs older than the specified days (default 90) to audit_logs_archive.';
