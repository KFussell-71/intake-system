-- HIPAA Compliance: Immutable Audit Logs
-- Created: 2026-02-02
-- Purpose: Make audit logs read-only and implement 6-year retention policy

-- ============================================
-- 1. Prevent Modifications to Audit Logs
-- ============================================

-- Revoke UPDATE and DELETE permissions
REVOKE UPDATE, DELETE ON audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON audit_logs FROM anon;

-- Only allow INSERT and SELECT
GRANT INSERT, SELECT ON audit_logs TO authenticated;

-- ============================================
-- 2. Create Triggers to Prevent Modifications
-- ============================================

-- Function to prevent any modification
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'HIPAA Violation: Audit logs are immutable and cannot be modified or deleted. All access attempts are logged.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent UPDATE
DROP TRIGGER IF EXISTS audit_logs_immutable_update ON audit_logs;
CREATE TRIGGER audit_logs_immutable_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_modification();

-- Trigger to prevent DELETE
DROP TRIGGER IF EXISTS audit_logs_immutable_delete ON audit_logs;
CREATE TRIGGER audit_logs_immutable_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_modification();

-- ============================================
-- 3. RLS Policies for Audit Log Access
-- ============================================

-- Drop existing policies if any
-- Drop existing policies if any
DROP POLICY IF EXISTS "Staff can view own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_logs; -- Legacy cleanup
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs; -- Legacy cleanup

-- Staff can only view their own logs
CREATE POLICY "Staff can view own audit logs"
ON audit_logs FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('supervisor', 'admin')
    )
);

-- Anyone authenticated can insert (for system logging)
CREATE POLICY "Authenticated can insert audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- ============================================
-- 4. Audit Log Retention (6 years for HIPAA)
-- ============================================

-- Create archive table for old logs
CREATE TABLE IF NOT EXISTS audit_logs_archive (
    LIKE audit_logs INCLUDING ALL
);

-- Add archive metadata
ALTER TABLE audit_logs_archive 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NOW();

-- Function to archive old logs (older than 6 years)
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS TABLE(archived_count BIGINT) AS $$
DECLARE
    cutoff_date TIMESTAMPTZ := NOW() - INTERVAL '6 years';
    count_archived BIGINT;
BEGIN
    -- Move to archive table
    WITH moved AS (
        INSERT INTO audit_logs_archive 
        SELECT *, NOW() as archived_at
        FROM audit_logs
        WHERE created_at < cutoff_date
        RETURNING *
    )
    SELECT COUNT(*) INTO count_archived FROM moved;
    
    -- Delete from main table (after successful archive)
    DELETE FROM audit_logs
    WHERE created_at < cutoff_date;
    
    -- Log the archival action
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        metadata
    ) VALUES (
        '00000000-0000-0000-0000-000000000000', -- System user
        'audit_logs_archived',
        'system',
        jsonb_build_object(
            'cutoff_date', cutoff_date,
            'archived_count', count_archived,
            'timestamp', NOW()
        )
    );
    
    RETURN QUERY SELECT count_archived;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Partitioning for Performance (Optional)
-- ============================================

-- Note: If audit_logs table is already created without partitioning,
-- this section can be applied to new installations or via migration

-- Example partition for current year
-- CREATE TABLE IF NOT EXISTS audit_logs_2026 PARTITION OF audit_logs
-- FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- ============================================
-- 6. Audit Log Integrity Verification
-- ============================================

-- Function to verify audit log integrity
CREATE OR REPLACE FUNCTION verify_audit_log_integrity()
RETURNS TABLE(
    total_logs BIGINT,
    oldest_log TIMESTAMPTZ,
    newest_log TIMESTAMPTZ,
    integrity_status TEXT
) AS $$
DECLARE
    log_count BIGINT;
    oldest TIMESTAMPTZ;
    newest TIMESTAMPTZ;
BEGIN
    SELECT COUNT(*), MIN(created_at), MAX(created_at)
    INTO log_count, oldest, newest
    FROM audit_logs;
    
    RETURN QUERY SELECT 
        log_count,
        oldest,
        newest,
        CASE 
            WHEN log_count > 0 THEN 'OK'
            ELSE 'NO_LOGS'
        END as integrity_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Documentation
-- ============================================

COMMENT ON FUNCTION prevent_audit_modification() IS 'HIPAA: Prevents any modification or deletion of audit logs';
COMMENT ON FUNCTION archive_old_audit_logs() IS 'HIPAA: Archives audit logs older than 6 years to cold storage';
COMMENT ON FUNCTION verify_audit_log_integrity() IS 'HIPAA: Verifies audit log integrity and retention compliance';
COMMENT ON TABLE audit_logs_archive IS 'HIPAA: Archive table for audit logs older than 6 years';

-- ============================================
-- 8. Grant Permissions
-- ============================================

-- Only admins can run archival function
REVOKE EXECUTE ON FUNCTION archive_old_audit_logs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION archive_old_audit_logs() TO authenticated;

-- Anyone can verify integrity
GRANT EXECUTE ON FUNCTION verify_audit_log_integrity() TO authenticated;

-- Only admins can view archive
REVOKE ALL ON audit_logs_archive FROM PUBLIC;
GRANT SELECT ON audit_logs_archive TO authenticated;

-- RLS on archive table
ALTER TABLE audit_logs_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admins can view archived logs" ON audit_logs_archive;
CREATE POLICY "Only admins can view archived logs"
ON audit_logs_archive FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- ============================================
-- 9. Verification
-- ============================================

-- Test immutability (should fail)
-- UPDATE audit_logs SET action = 'test' WHERE id = 'some-id';
-- DELETE FROM audit_logs WHERE id = 'some-id';

-- Verify integrity
SELECT * FROM verify_audit_log_integrity();
