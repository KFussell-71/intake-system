-- ============================================================================
-- SUPERVISOR ANALYTICS MIGRATION
-- ============================================================================
-- Date: 2026-02-15
-- Purpose: Provide high-performance analytics for the Supervisor Dashboard
--          (Risk Radar, Compliance Gaps, Workload Distribution)
-- ============================================================================

-- Function: get_supervisor_metrics
-- Returns a JSON object with:
--   stalled_cases: Clients with no activity > 30 days
--   compliance_gaps: Counts of missing signatures, overdue reviews, missing outcomes
--   caseload_distribution: Active case counts per staff member

CREATE OR REPLACE FUNCTION get_supervisor_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  threshold_date TIMESTAMPTZ := NOW() - INTERVAL '30 days';
BEGIN
  -- 1. Security Check: Supervisor or Admin only
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  ) THEN
    -- Return empty structure/error indicator rather than hard fail 
    -- to allow UI to handle gracefully if needed, or row-level security style.
    -- But for strict Dashboard access, return specific error or empty.
    RETURN '{"error": "Unauthorized"}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    -- 2. Stalled Cases (Risk Radar)
    -- Clients with NO activity (Intake, Note, Service) in the last 30 days
    'stalled_cases', (
        SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) FROM (
            SELECT 
                c.id,
                c.name,
                c.assigned_to,
                p.username as assigned_worker_name,
                -- Calculate "Last Activity" across all domains
                GREATEST(
                    COALESCE(MAX(i.report_date::timestamptz), '2000-01-01'::timestamptz),
                    COALESCE(MAX(n.created_at), '2000-01-01'::timestamptz),
                    COALESCE(MAX(s.performed_at), '2000-01-01'::timestamptz),
                    c.created_at -- Fallback to profile creation
                ) as last_activity
            FROM clients c
            LEFT JOIN intakes i ON i.client_id = c.id
            LEFT JOIN case_notes n ON n.client_id = c.id
            LEFT JOIN cases ca ON ca.client_id = c.id AND ca.status = 'active'
            LEFT JOIN service_logs s ON s.case_id = ca.id
            LEFT JOIN profiles p ON c.assigned_to = p.id
            WHERE c.created_at < threshold_date -- Only consider old enough clients
            GROUP BY c.id, c.name, c.assigned_to, p.username, c.created_at
            HAVING GREATEST(
                COALESCE(MAX(i.report_date::timestamptz), '2000-01-01'::timestamptz),
                COALESCE(MAX(n.created_at), '2000-01-01'::timestamptz),
                COALESCE(MAX(s.performed_at), '2000-01-01'::timestamptz),
                c.created_at
            ) < threshold_date
            ORDER BY last_activity ASC
            LIMIT 20
        ) t
    ),
    
    -- 3. Compliance Gaps
    'compliance_gaps', (
        SELECT jsonb_build_object(
            'unsigned_intakes', (
                SELECT COUNT(*) 
                FROM intakes 
                WHERE status NOT IN ('draft') 
                AND (data->>'signature') IS NULL -- Check JSONB or separate column if added later
            ),
            'overdue_reviews', (
                SELECT COUNT(*) 
                FROM care_plans 
                WHERE status = 'active' 
                AND review_date < CURRENT_DATE
            ),
            'missing_outcomes', (
                -- Active cases > 60 days old with NO outcome records
                SELECT COUNT(*) 
                FROM cases c
                WHERE c.status = 'active'
                AND c.created_at < (NOW() - INTERVAL '60 days')
                AND NOT EXISTS (
                    SELECT 1 FROM outcome_records o WHERE o.case_id = c.id
                )
            )
        )
    ),

    -- 4. Caseload Distribution
    'caseload_distribution', (
        SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb) FROM (
             SELECT 
                p.username as staff_name,
                COUNT(c.id) as case_count
             FROM profiles p
             LEFT JOIN clients c ON c.assigned_to = p.id 
             -- Consider filtering for active clients only if `status` column exists on clients
             -- Since clients table doesn't formally have status in partial definition, we use existence of active case
             -- OR just raw assignment count for now.
             WHERE p.role IN ('staff', 'case_worker', 'intake_worker', 'specialist')
             GROUP BY p.id, p.username
             ORDER BY case_count DESC
        ) d
    )

  ) INTO result;

  RETURN result;
END;
$$;
