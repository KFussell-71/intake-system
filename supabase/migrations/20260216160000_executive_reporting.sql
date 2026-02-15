-- Migration: 20260216160000_executive_reporting
-- Description: RPC to aggregate agency-wide metrics for the Executive Report Generator.

CREATE OR REPLACE FUNCTION get_weekly_agency_metrics(
    days_lookback INT DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_date DATE := CURRENT_DATE - days_lookback;
    
    -- Metric Variables
    total_active_cases INT;
    new_intakes INT;
    placements_count INT;
    avg_wage NUMERIC;
    retention_rate_30 NUMERIC;
    compliance_score NUMERIC; -- Simplified proxy: % of cases with NO missing docs
    high_risk_count INT;
    
    result JSONB;
BEGIN
    -- Check permissions
    IF NOT (auth.role() IN ('admin', 'supervisor')) THEN
        RAISE EXCEPTION 'Access Denied: Executive privileges required';
    END IF;

    -- 1. Active Cases (Snapshot)
    SELECT COUNT(*) INTO total_active_cases
    FROM cases
    WHERE status NOT IN ('closed', 'archived');

    -- 2. New Intakes (in lookback period)
    SELECT COUNT(*) INTO new_intakes
    FROM intakes
    WHERE created_at >= start_date;

    -- 3. Placements (in lookback period)
    -- Note: dependent on 'placements' table from Phase 5
    -- We use a safe check in case table doesn't exist yet (though it should)
    BEGIN
        SELECT COUNT(*), COALESCE(AVG(hourly_wage), 0)
        INTO placements_count, avg_wage
        FROM placements
        WHERE start_date >= start_date;
    EXCEPTION WHEN undefined_table THEN
        placements_count := 0;
        avg_wage := 0;
    END;

    -- 4. Retention Rate (30 day checks due in lookback period that were successful)
    -- Simplified: Successes / Total Due
    BEGIN
        SELECT 
            COALESCE((COUNT(*) FILTER (WHERE status = 'employed')::NUMERIC / NULLIF(COUNT(*), 0) * 100), 0)
        INTO retention_rate_30
        FROM retention_checks
        WHERE check_type = '30_day'
          AND checked_at >= start_date;
    EXCEPTION WHEN undefined_table THEN
        retention_rate_30 := 0;
    END;

    -- 5. High Risk Count (Ghost Clients > 14 days)
    -- Re-using logic from get_supervisor_metrics ideally, but for now re-calculating
    SELECT COUNT(*) INTO high_risk_count
    FROM cases c
    WHERE c.status = 'active'
    AND c.last_contact_at < (CURRENT_DATE - INTERVAL '14 days');

    -- 6. Compliance Score
    -- Defined as: Percentage of active cases that have 0 entries in the 'missing_documents' array (if we had one)
    -- For now, let's use a simpler proxy: 100 - (High Risk / Total * 100)
    compliance_score := GREATEST(0, 100 - ((high_risk_count::NUMERIC / NULLIF(total_active_cases,0)) * 100));


    -- Build Result
    result := json_build_object(
        'period_days', days_lookback,
        'generated_at', NOW(),
        'metrics', json_build_object(
            'total_active_cases', total_active_cases,
            'new_intakes', new_intakes,
            'placements_count', placements_count,
            'avg_wage', ROUND(avg_wage, 2),
            'retention_rate_30', ROUND(retention_rate_30, 1),
            'high_risk_count', high_risk_count,
            'compliance_score', ROUND(compliance_score, 1)
        )
    );

    RETURN result;
END;
$$;
