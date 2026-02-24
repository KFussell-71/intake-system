-- ============================================================================
-- MIGRATION: 20260211_dashboard_analytics.sql
-- PURPOSE: Advanced Aggregation using Promoted Columns
-- ============================================================================

CREATE OR REPLACE FUNCTION get_intake_analytics()
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
    RETURN '{}'::jsonb;
  END IF;

  SELECT jsonb_build_object(
    -- 1. Referral Source Breakdown
    'referrals', (
      SELECT jsonb_agg(jsonb_build_object('name', coalesce(referral_source, 'Unknown'), 'value', count))
      FROM (
        SELECT referral_source, count(*) 
        FROM intakes 
        GROUP BY referral_source 
        ORDER BY count(*) DESC
      ) r
    ),
    -- 2. Employment Status
    'employment', (
      SELECT jsonb_agg(jsonb_build_object('name', coalesce(employment_status, 'Not Reported'), 'value', count))
      FROM (
        SELECT employment_status, count(*) 
        FROM intakes 
        GROUP BY employment_status 
        ORDER BY count(*) DESC
      ) e
    ),
    -- 3. Barriers Statistics
    'barriers', (
      SELECT jsonb_build_object(
        'avg', round(avg(barrier_count), 1),
        'max', max(barrier_count),
        'total_intakes', count(*)
      )
      FROM intakes
    ),
    -- 4. Readiness Distribution
    'readiness', (
      SELECT jsonb_agg(jsonb_build_object('score', readiness_scale, 'count', count))
      FROM (
        SELECT readiness_scale, count(*) 
        FROM intakes 
        WHERE readiness_scale IS NOT NULL
        GROUP BY readiness_scale 
        ORDER BY readiness_scale ASC
      ) rs
    )
  ) INTO result;

  RETURN result;
END;
$$;
