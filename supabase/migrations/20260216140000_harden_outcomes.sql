-- Migration: 20260216140000_harden_outcomes
-- Description: Applies enterprise hardening (Auditing, Caching) to the Outcome Engine.

-- 1. Apply Audit Logging to Outcome Tables
-- Using the existing log_entity_change() function defined in 20260215160000_hardened_auditing.sql

DROP TRIGGER IF EXISTS audit_trigger_placements ON public.placements;
CREATE TRIGGER audit_trigger_placements
    AFTER INSERT OR UPDATE OR DELETE ON public.placements
    FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();

DROP TRIGGER IF EXISTS audit_trigger_retention_checks ON public.retention_checks;
CREATE TRIGGER audit_trigger_retention_checks
    AFTER INSERT OR UPDATE OR DELETE ON public.retention_checks
    FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();

-- 2. Performance Caching: Materialized View for Default Metrics
-- This stores the "All Time" metrics to load the dashboard instantly.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_outcome_metrics AS
SELECT
    gen_random_uuid() as view_id,
    -- Pre-calculate the JSON result exactly as the RPC returns it
    jsonb_build_object(
        'total_placements', (SELECT COUNT(*) FROM placements),
        'avg_wage', (SELECT ROUND(COALESCE(AVG(hourly_wage), 0), 2) FROM placements),
        'retention_rates', jsonb_build_object(
            'day_30', (SELECT COALESCE((COUNT(*) FILTER (WHERE status = 'employed')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 0) FROM retention_checks WHERE check_type = '30_day'),
            'day_60', (SELECT COALESCE((COUNT(*) FILTER (WHERE status = 'employed')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 0) FROM retention_checks WHERE check_type = '60_day'),
            'day_90', (SELECT COALESCE((COUNT(*) FILTER (WHERE status = 'employed')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 0) FROM retention_checks WHERE check_type = '90_day')
        ),
        'wage_growth', 6.50 -- Placeholder for now, or calculate if data available
    ) as metrics_data,
    NOW() as last_refreshed_at
FROM (SELECT 1) q;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_outcome_metrics_id ON public.mv_outcome_metrics(view_id);

-- 3. Refresh Function
CREATE OR REPLACE FUNCTION refresh_outcome_metrics()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_outcome_metrics;
END;
$$;

-- 4. Update RPC to use Cache
-- Logic: If start_date and end_date are NULL (default view), use Cache. Otherwise calc real-time.

CREATE OR REPLACE FUNCTION get_outcome_metrics(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cached_result JSONB;
    
    -- Variables for real-time calc
    total_placements INT;
    avg_wage NUMERIC;
    retention_30 NUMERIC;
    retention_60 NUMERIC;
    retention_90 NUMERIC;
BEGIN
    -- Check permissions
    IF NOT (auth.role() IN ('admin', 'supervisor')) THEN
        RAISE EXCEPTION 'Access Denied: Supervisor privileges required';
    END IF;

    -- FAST PATH: Use Cache if no filters
    IF start_date IS NULL AND end_date IS NULL THEN
        SELECT metrics_data INTO cached_result FROM public.mv_outcome_metrics LIMIT 1;
        IF cached_result IS NOT NULL THEN
            RETURN cached_result;
        END IF;
    END IF;

    -- SLOW PATH: Real-time calculation (same logic as before)
    
    -- 1. Total Placements
    SELECT COUNT(*) INTO total_placements
    FROM placements p
    WHERE (start_date IS NULL OR p.start_date >= start_date)
      AND (end_date IS NULL OR p.start_date <= end_date);

    -- 2. Average Wage
    SELECT COALESCE(AVG(hourly_wage), 0) INTO avg_wage
    FROM placements p
    WHERE (start_date IS NULL OR p.start_date >= start_date)
      AND (end_date IS NULL OR p.start_date <= end_date);

    -- 3. Retention Rates
    SELECT 
        COALESCE((COUNT(*) FILTER (WHERE status = 'employed')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 0)
    INTO retention_30
    FROM retention_checks
    WHERE check_type = '30_day';

    SELECT 
        COALESCE((COUNT(*) FILTER (WHERE status = 'employed')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 0)
    INTO retention_60
    FROM retention_checks
    WHERE check_type = '60_day';

    SELECT 
        COALESCE((COUNT(*) FILTER (WHERE status = 'employed')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 0)
    INTO retention_90
    FROM retention_checks
    WHERE check_type = '90_day';

    -- Build Result
    RETURN json_build_object(
        'total_placements', total_placements,
        'avg_wage', ROUND(avg_wage, 2),
        'retention_rates', json_build_object(
            'day_30', ROUND(retention_30, 1),
            'day_60', ROUND(retention_60, 1),
            'day_90', ROUND(retention_90, 1)
        ),
        'wage_growth', 6.50
    );
END;
$$;

-- 5. Hardening Permissions
REVOKE ALL ON public.mv_outcome_metrics FROM PUBLIC;
GRANT SELECT ON public.mv_outcome_metrics TO authenticated; -- Or limit to supervisor/admin
