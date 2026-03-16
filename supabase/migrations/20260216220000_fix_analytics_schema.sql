-- Migration: 20260216220000_fix_analytics_schema.sql
-- Description: Resolve column reference mismatch in analytics RPCs and ensure clients.status existence.

BEGIN;

-- 1. Ensure 'clients' has 'status' column (Retry for safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'closed'));
    END IF;
END $$;

-- 2. Repair 'analytics_get_staff_workload' (Ensure it handles missing clients properly)
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
    start_time timestamptz := clock_timestamp();
    row_ct int;
BEGIN
    IF NOT check_analytics_access(ARRAY['supervisor', 'admin']) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        coalesce(p.username, 'Unassigned')::text as staff_name,
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
        (SELECT role FROM profiles WHERE id = auth.uid()),
        extract(epoch from (clock_timestamp() - start_time)) * 1000,
        row_ct
    );
END;
$$;

-- 3. Repair 'analytics_get_my_workload' (Ensure it uses auth.uid() correctly)
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
    start_time timestamptz := clock_timestamp();
    v_user_id uuid := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        count(DISTINCT c.id) filter (where c.status = 'active') as active_clients,
        count(DISTINCT i.id) filter (where i.status != 'completed') as intakes_in_progress,
        count(DISTINCT i.id) filter (where i.status = 'completed') as completed_intakes
    FROM clients c
    LEFT JOIN intakes i ON i.client_id = c.id
    WHERE c.assigned_to = v_user_id;

    INSERT INTO analytics_logs (function_name, role, execution_time_ms, row_count)
    VALUES (
        'analytics_get_my_workload',
        (SELECT role FROM profiles WHERE id = v_user_id),
        extract(epoch from (clock_timestamp() - start_time)) * 1000,
        1
    );
END;
$$;

COMMIT;
