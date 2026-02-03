-- Analytics Refinement Migration
-- Created: 2026-02-03
-- Purpose: Harden analytics architecture with strict naming, stability, security, and logging.

-- ============================================================================
-- 1. Observability: RPC Usage Logging
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    role text NOT NULL,
    execution_time_ms double precision,
    row_count int,
    created_at timestamptz DEFAULT now()
);

-- Separate from main audit logs to keep high-velocity analytics noise out of compliance trail
ALTER TABLE analytics_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can see analytics logs
CREATE POLICY view_analytics_logs ON analytics_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = (select auth.uid()) 
            AND role = 'admin'
        )
    );

-- ============================================================================
-- 2. Performance: Sliding Window Index
-- ============================================================================

-- Optimized for "Last 30/45 Days" trend queries
-- Condition matches the RPC default range plus buffer
CREATE INDEX IF NOT EXISTS idx_intakes_created_at_recent 
ON intakes (created_at)
WHERE created_at > (now() - interval '45 days');

-- ============================================================================
-- 3. Security: Centralized Role Check
-- ============================================================================

CREATE OR REPLACE FUNCTION check_analytics_access(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = (select auth.uid());
    
    -- If user has one of the required roles, return true
    IF user_role = ANY(required_roles) THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- ============================================================================
-- 4. Refined RPCs (Renamed, Stable, Logging)
-- ============================================================================

-- Drop old functions
DROP FUNCTION IF EXISTS get_intake_trends(int);
DROP FUNCTION IF EXISTS get_staff_workload();
DROP FUNCTION IF EXISTS get_my_workload();
DROP FUNCTION IF EXISTS get_recent_activity_feed(int);

-- A. Trends
CREATE OR REPLACE FUNCTION analytics_get_intake_trends(range_days int DEFAULT 30)
RETURNS TABLE (
  date date,
  count bigint
)
LANGUAGE plpgsql
STABLE -- Performance optimization
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    start_time timestamptz;
    row_ct int;
BEGIN
    start_time := clock_timestamp();

    -- Security Check: Supervisor/Admin only
    IF NOT check_analytics_access(ARRAY['supervisor', 'admin']) THEN
        -- Return empty result structure (don't leak existence or error)
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        created_at::date as date,
        count(*) as count
    FROM intakes
    WHERE created_at > current_date - (range_days || ' days')::interval
    GROUP BY created_at::date
    ORDER BY created_at::date ASC;

    GET DIAGNOSTICS row_ct = ROW_COUNT;

    -- Log usage (fire and forget insert)
    INSERT INTO analytics_logs (function_name, role, execution_time_ms, row_count)
    VALUES (
        'analytics_get_intake_trends', 
        (SELECT role FROM profiles WHERE id = (select auth.uid())),
        extract(epoch from (clock_timestamp() - start_time)) * 1000,
        row_ct
    );
END;
$$;

-- B. Staff Workload
CREATE OR REPLACE FUNCTION analytics_get_staff_workload()
RETURNS TABLE (
  staff_name text,
  active_clients bigint,
  intakes_in_progress bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    start_time timestamptz;
    row_ct int;
BEGIN
    start_time := clock_timestamp();

    -- Security Check: Supervisor/Admin only
    IF NOT check_analytics_access(ARRAY['supervisor', 'admin']) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        coalesce(p.username, 'Unassigned') as staff_name,
        count(DISTINCT c.id) filter (where c.status = 'active') as active_clients,
        count(DISTINCT i.id) filter (where i.status != 'completed') as intakes_in_progress
    FROM profiles p
    LEFT JOIN clients c ON c.assigned_to = p.id
    LEFT JOIN intakes i ON i.client_id = c.id
    WHERE p.role = 'staff'
    GROUP BY p.username
    ORDER BY active_clients DESC;

    GET DIAGNOSTICS row_ct = ROW_COUNT;

    INSERT INTO analytics_logs (function_name, role, execution_time_ms, row_count)
    VALUES (
        'analytics_get_staff_workload',
        (SELECT role FROM profiles WHERE id = (select auth.uid())),
        extract(epoch from (clock_timestamp() - start_time)) * 1000,
        row_ct
    );
END;
$$;

-- C. My Workload (Renamed for consistency, accessible by all)
CREATE OR REPLACE FUNCTION analytics_get_my_workload()
RETURNS TABLE (
  active_clients bigint,
  intakes_in_progress bigint,
  completed_intakes bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    start_time timestamptz;
BEGIN
    -- Accessible by everyone, always returns THEIR stats
    start_time := clock_timestamp();

    RETURN QUERY
    SELECT
        count(DISTINCT c.id) filter (where c.status = 'active') as active_clients,
        count(DISTINCT i.id) filter (where i.status != 'completed') as intakes_in_progress,
        count(DISTINCT i.id) filter (where i.status = 'completed') as completed_intakes
    FROM clients c
    LEFT JOIN intakes i ON i.client_id = c.id
    WHERE c.assigned_to = (select auth.uid());

    -- Logging optional for high-frequency user endpoints to save DB writes
    -- keeping strictly for "supervisor/admin" heavy queries is usually enough
    -- but user asked for "Log Analytics RPC Usage", so we log roughly.
    INSERT INTO analytics_logs (function_name, role, execution_time_ms, row_count)
    VALUES (
        'analytics_get_my_workload',
        (SELECT role FROM profiles WHERE id = (select auth.uid())),
        extract(epoch from (clock_timestamp() - start_time)) * 1000,
        1
    );
END;
$$;

-- D. Activity Feed (Unified)
CREATE OR REPLACE FUNCTION analytics_get_recent_activity(limit_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  event_type text,
  description text,
  created_at timestamptz,
  client_name text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    start_time timestamptz;
    user_role text;
    row_ct int;
BEGIN
    start_time := clock_timestamp();
    SELECT role INTO user_role FROM profiles WHERE id = (select auth.uid());
    
    RETURN QUERY
    WITH merged_activity AS (
        SELECT i.id, 'intake' as event_type, 'New intake started' as description, i.created_at, c.name as client_name, c.assigned_to, c.created_by
        FROM intakes i JOIN clients c ON i.client_id = c.id
        UNION ALL
        SELECT d.id, 'document' as event_type, 'Document uploaded: ' || d.name, d.uploaded_at, c.name, c.assigned_to, c.created_by
        FROM documents d JOIN clients c ON d.client_id = c.id
        UNION ALL
        SELECT f.id, 'follow_up' as event_type, 'Follow-up: ' || f.method, f.created_at, c.name, c.assigned_to, c.created_by
        FROM follow_ups f JOIN clients c ON f.client_id = c.id
    )
    SELECT ma.id, ma.event_type, ma.description, ma.created_at, ma.client_name
    FROM merged_activity ma
    WHERE
        (user_role IN ('supervisor', 'admin')) -- Supervisors see all
        OR
        (ma.assigned_to = (select auth.uid()) OR ma.created_by = (select auth.uid())) -- Staff see own
    ORDER BY ma.created_at DESC
    LIMIT limit_count;

    GET DIAGNOSTICS row_ct = ROW_COUNT;

    INSERT INTO analytics_logs (function_name, role, execution_time_ms, row_count)
    VALUES (
        'analytics_get_recent_activity',
        user_role,
        extract(epoch from (clock_timestamp() - start_time)) * 1000,
        row_ct
    );
END;
$$;
