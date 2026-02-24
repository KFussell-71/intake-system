-- Performance Polish Migration
-- Created: 2026-02-03
-- Purpose: Advanced database tuning (Composite Indexes, JSONB Optimization, Audit Archival)

-- ============================================================================
-- 1. COMPOSITE INDEXES (Optimize Filtering + Sorting)
-- ============================================================================
-- Intakes: Frequent query pattern: client_id + date sort
CREATE INDEX IF NOT EXISTS idx_intakes_client_created 
ON public.intakes (client_id, created_at DESC);

-- Documents: Frequent query pattern: client_id + date sort
CREATE INDEX IF NOT EXISTS idx_documents_client_uploaded 
ON public.documents (client_id, uploaded_at DESC);

-- Follow Ups: Frequent query pattern: client_id + contact_date sort
CREATE INDEX IF NOT EXISTS idx_follow_ups_client_date 
ON public.follow_ups (client_id, contact_date DESC);

-- Portal Activity: Frequent query pattern: user_id + date sort
CREATE INDEX IF NOT EXISTS idx_portal_activity_user_created 
ON public.portal_activity (user_id, created_at DESC);

-- Audit Logs: Frequent query pattern: user_id + date sort
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
ON public.audit_logs (user_id, created_at DESC);

-- ============================================================================
-- 2. JSONB OPTIMIZATION (Targeted vs GIN)
-- ============================================================================
-- Drop generic GIN index if it exists (it was created in initial_schema.sql)
DROP INDEX IF EXISTS idx_intakes_data_gin;

-- Create targeted expression index for 'status' which is commonly filtered
CREATE INDEX IF NOT EXISTS idx_intakes_data_status 
ON public.intakes ((data->>'status'));

-- ============================================================================
-- 3. RLS SUPPORT INDEXES
-- ============================================================================
-- Optimizes "auth.uid() = id AND role = 'admin'" checks
CREATE INDEX IF NOT EXISTS idx_profiles_id_role 
ON public.profiles (id, role);

-- ============================================================================
-- 4. AUDIT ARCHIVAL FUNCTION
-- ============================================================================
-- Function to move old audit logs to archive table
CREATE OR REPLACE FUNCTION archive_old_audit_logs(days_to_keep int DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  moved_count integer;
BEGIN
  -- 1. Insert into archive
  INSERT INTO audit_logs_archive (id, user_id, action, entity_type, entity_id, details, created_at)
  SELECT id, user_id, action, entity_type, entity_id, details, created_at
  FROM audit_logs
  WHERE created_at < current_date - (days_to_keep || ' days')::interval;
  
  -- 2. Delete from main table
  WITH deleted_rows AS (
    DELETE FROM audit_logs
    WHERE created_at < current_date - (days_to_keep || ' days')::interval
    RETURNING 1
  )
  SELECT count(*) INTO moved_count FROM deleted_rows;
  
  RETURN moved_count;
END;
$$;
