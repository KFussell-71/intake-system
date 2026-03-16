-- Analytics Functions Migration
-- Created: 2026-02-03
-- Purpose: Implement server-side aggregation for Analytics Dashboard

-- ============================================================================
-- 1. Intake Trends (Daily Counts)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_intake_trends(range_days int DEFAULT 30)
RETURNS TABLE (
  date date,
  count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check permission: Supervisor or Admin only
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('supervisor', 'admin')
  ) THEN
    RETURN; -- Return empty set for unauthorized users
  END IF;

  RETURN QUERY
  SELECT
    created_at::date as date,
    count(*) as count
  FROM intakes
  WHERE created_at > current_date - (range_days || ' days')::interval
  GROUP BY created_at::date
  ORDER BY created_at::date ASC;
END;
$$;

-- ============================================================================
-- 2. Staff Workload (Supervisor View)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_staff_workload()
RETURNS TABLE (
  staff_name text,
  active_clients bigint,
  intakes_in_progress bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check permission: Supervisor or Admin only
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('supervisor', 'admin')
  ) THEN
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
END;
$$;

-- ============================================================================
-- 3. My Workload (Personal View)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_my_workload()
RETURNS TABLE (
  active_clients bigint,
  intakes_in_progress bigint,
  completed_intakes bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    count(DISTINCT c.id) filter (where c.status = 'active') as active_clients,
    count(DISTINCT i.id) filter (where i.status != 'completed') as intakes_in_progress,
    count(DISTINCT i.id) filter (where i.status = 'completed') as completed_intakes
  FROM clients c
  LEFT JOIN intakes i ON i.client_id = c.id
  WHERE c.assigned_to = (select auth.uid());
END;
$$;

-- ============================================================================
-- 4. Unified Activity Feed
-- ============================================================================
CREATE OR REPLACE FUNCTION get_recent_activity_feed(limit_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  event_type text, -- 'intake', 'document', 'note'
  description text,
  created_at timestamptz,
  client_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = (select auth.uid());
    
    RETURN QUERY
    WITH merged_activity AS (
        -- New Intakes
        SELECT
            i.id,
            'intake' as event_type,
            'New intake started' as description,
            i.created_at,
            c.name as client_name,
            c.assigned_to,
            c.created_by
        FROM intakes i
        JOIN clients c ON i.client_id = c.id

        UNION ALL

        -- New Documents
        SELECT
            d.id,
            'document' as event_type,
            'Document uploaded: ' || d.name as description,
            d.uploaded_at as created_at,
            c.name as client_name,
            c.assigned_to,
            c.created_by
        FROM documents d
        JOIN clients c ON d.client_id = c.id

        UNION ALL

        -- Follow Ups
        SELECT
            f.id,
            'follow_up' as event_type,
            'Follow-up completed: ' || f.method as description,
            f.created_at,
            c.name as client_name,
            c.assigned_to,
            c.created_by
        FROM follow_ups f
        JOIN clients c ON f.client_id = c.id
    )
    SELECT
        ma.id,
        ma.event_type,
        ma.description,
        ma.created_at,
        ma.client_name
    FROM merged_activity ma
    WHERE
        -- Supervisors see all, Staff see assigned
        (user_role IN ('supervisor', 'admin'))
        OR
        (ma.assigned_to = (select auth.uid()) OR ma.created_by = (select auth.uid()))
    ORDER BY ma.created_at DESC
    LIMIT limit_count;
END;
$$;
