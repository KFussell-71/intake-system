-- Migration: 20260215163000_analytics_optimization
-- Description: Introduces Materialized Views for high-performance supervisor metrics.

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_supervisor_metrics AS
SELECT 
    gen_random_uuid() as view_id,
    (data->>'stalled_cases')::jsonb as stalled_cases,
    (data->>'compliance_gaps')::jsonb as compliance_gaps,
    (data->>'goal_drift')::jsonb as goal_drift,
    (data->>'upcoming_exits')::jsonb as upcoming_exits,
    (data->>'pipeline_velocity')::jsonb as pipeline_velocity,
    (data->>'caseload_stats')::jsonb as caseload_stats,
    NOW() as last_refreshed_at
FROM (SELECT get_supervisor_metrics() as data) s;

-- Index for rapid retrieval
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_supervisor_metrics_id ON mv_supervisor_metrics (view_id);

CREATE INDEX IF NOT EXISTS idx_mv_supervisor_metrics_caseload ON mv_supervisor_metrics USING gin (caseload_stats);


-- 2. Logic to refresh the view
-- In a real prod env, this would be a CRON job or a trigger on dependent tables.
-- For now, we provide a refresh function.
CREATE OR REPLACE FUNCTION refresh_supervisor_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_supervisor_metrics;
END;
$$;
