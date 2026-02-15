-- Migration: 20260215_supervisor_metrics_v2
-- Description: Updates get_supervisor_metrics RPC to include Management Control metrics.

CREATE OR REPLACE FUNCTION get_supervisor_metrics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check permission: Supervisor or Admin only
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('supervisor', 'admin')
  ) THEN
    RETURN '{"error": "Unauthorized"}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    -- 1. Risk Radar: Stalled Cases ("Ghost Clients")
    -- Logic: No contact in > 14 days (was 30)
    'stalled_cases', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'client_name', c.first_name || ' ' || c.last_name,
          'case_id', ca.id,
          'days_since_contact', EXTRACT(DAY FROM (NOW() - 
            COALESCE(
              GREATEST(
                ca.updated_at,
                (SELECT MAX(created_at) FROM notes WHERE client_id = c.id),
                (SELECT MAX(performed_at) FROM service_logs WHERE case_id = ca.id)
              ),
              ca.created_at
            )
          ))::int,
          'last_contact_date', COALESCE(
              GREATEST(
                ca.updated_at,
                (SELECT MAX(created_at) FROM notes WHERE client_id = c.id),
                (SELECT MAX(performed_at) FROM service_logs WHERE case_id = ca.id)
              ),
              ca.created_at
          ),
          'assigned_to', (SELECT email FROM auth.users WHERE id = ca.assigned_to)
        )
      )
      FROM cases ca
      JOIN clients c ON c.id = ca.client_id
      WHERE ca.status = 'active'
      AND EXTRACT(DAY FROM (NOW() - 
        COALESCE(
          GREATEST(
            ca.updated_at,
            (SELECT MAX(created_at) FROM notes WHERE client_id = c.id),
            (SELECT MAX(performed_at) FROM service_logs WHERE case_id = ca.id)
          ),
          ca.created_at
        )
      )) > 14 -- UPDATED to 14 days
    ),

    -- 2. Compliance Heatmap (Existing + Paperwork Debt)
    'compliance_gaps', (
      SELECT jsonb_build_object(
        'unsigned_intakes', (SELECT count(*) FROM intakes WHERE status != 'draft' AND client_signature IS NULL),
        'overdue_reviews', (SELECT count(*) FROM care_plans WHERE review_date < CURRENT_DATE AND status = 'active'),
        'missing_docs', (
           -- Count active cases that don't have at least one document for their current stage
           -- Simplified logic for MVP: just count cases in 'intake' or 'assessment' with 0 documents
           SELECT count(*) 
           FROM cases c
           LEFT JOIN case_documents cd ON cd.case_id = c.id
           WHERE c.status = 'active'
           AND c.stage IN ('intake', 'assessment')
           GROUP BY c.id
           HAVING count(cd.id) = 0
        )
      )
    ),

    -- 3. Goal Drift
    -- Count of active goals past their target date
    'goal_drift', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'client_name', cl.first_name || ' ' || cl.last_name,
                'goal_description', g.description,
                'target_date', g.target_date,
                'days_overdue', EXTRACT(DAY FROM (NOW() - g.target_date::timestamp))::int
            )
        )
        FROM care_plan_goals g
        JOIN care_plans p ON p.id = g.plan_id
        JOIN cases c ON c.id = p.case_id
        JOIN clients cl ON cl.id = c.client_id
        WHERE g.status IN ('not_started', 'in_progress')
        AND g.target_date < CURRENT_DATE
        LIMIT 10 -- Top 10 most overdue
    ),

    -- 4. Upcoming Exits
    -- Cases with estimated_exit_date within 30 days
    'upcoming_exits', (
        SELECT jsonb_agg(
            jsonb_build_object(
                'client_name', cl.first_name || ' ' || cl.last_name,
                'exit_date', c.estimated_exit_date,
                'days_remaining', EXTRACT(DAY FROM (c.estimated_exit_date::timestamp - NOW()))::int
            )
        )
        FROM cases c
        JOIN clients cl ON cl.id = c.client_id
        WHERE c.status = 'active'
        AND c.estimated_exit_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
    ),

    -- 5. Caseload Distribution (Existing)
    'caseload_stats', (
      SELECT jsonb_agg(jsonb_build_object(
        'staff_email', (SELECT email FROM auth.users WHERE id = s.staff_id),
        'active_cases', s.case_count
      ))
      FROM (
        SELECT assigned_to as staff_id, count(*) as case_count 
        FROM cases 
        WHERE status = 'active' 
        AND assigned_to IS NOT NULL 
        GROUP BY assigned_to
      ) s
    )
  ) INTO result;

  RETURN result;
END;
$$;
