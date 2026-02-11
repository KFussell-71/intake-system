-- Migration: 20260212140000_policy_simulation.sql
-- Tier 2: Policy Simulation (Institutional Intelligence)

-- 1. Policy Definitions (The Rules of the Game)
-- Stores versioned, executable policy configurations.
CREATE TABLE IF NOT EXISTS policy_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { "max_assessment_days": 5 }
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Simulation Results (The Outcome)
-- Audit trail of "What If" scenarios run by leadership.
CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES policy_definitions(id),
  run_at TIMESTAMPTZ DEFAULT NOW(),
  run_by UUID REFERENCES auth.users(id),
  
  -- Key Metrics
  cases_analyzed INTEGER NOT NULL,
  baseline_failure_count INTEGER NOT NULL,
  simulated_failure_count INTEGER NOT NULL,
  
  -- Rich Data
  details JSONB -- breakdown of specific failures
);

-- 3. Seed Data (Example Policies)
INSERT INTO policy_definitions (name, description, rules) VALUES 
('Standard 2025 (Baseline)', 'Current operating rules.', '{"max_assessment_days": 10, "require_housing": false}'),
('Aggressive Timeliness (Proposed)', 'Shortens assessment window to 5 days.', '{"max_assessment_days": 5, "require_housing": false}'),
('Housing First Initiative', 'Mandates housing stability check for all intakes.', '{"max_assessment_days": 10, "require_housing": true}')
ON CONFLICT DO NOTHING;

-- 4. Simulation Engine (RPC)
-- Re-plays history against new rules.
CREATE OR REPLACE FUNCTION simulate_policy_impact(target_policy_id UUID)
RETURNS TABLE (
    policy_name TEXT,
    cases_analyzed INTEGER,
    baseline_failure_rate NUMERIC,
    simulated_failure_rate NUMERIC,
    impact_summary MENU_TYPE -- simplifying return type for demo, actually just JSONB usually better
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    policy_record RECORD;
    case_record RECORD;
    
    total_cases INTEGER := 0;
    baseline_fails INTEGER := 0;
    sim_fails INTEGER := 0;
    
    -- Rule Parameters
    rule_max_days INTEGER;
    rule_req_housing BOOLEAN;
    
    -- Calculation vars
    days_taken INTEGER;
    has_housing_data BOOLEAN;
BEGIN
    -- 1. Get Policy
    SELECT * INTO policy_record FROM policy_definitions WHERE id = target_policy_id;
    if NOT FOUND THEN RAISE EXCEPTION 'Policy not found'; END IF;
    
    -- Parse Rules
    rule_max_days := (policy_record.rules->>'max_assessment_days')::INTEGER;
    rule_req_housing := (policy_record.rules->>'require_housing')::BOOLEAN;

    -- 2. Analysis Loop (Last 100 closed cases for speed demo)
    FOR case_record IN 
        SELECT i.*, 
               EXTRACT(DAY FROM (i.completed_at - i.created_at)) as duration_days,
               (i.data->'vocational'->>'housingAssistance') is not null as has_housing
        FROM intakes i
        WHERE i.status = 'closed' OR i.status = 'opt_out' -- simulation specific states
        OR i.completed_at IS NOT NULL
        LIMIT 100
    LOOP
        total_cases := total_cases + 1;
        
        -- A. Baseline Check (Hypothetical: assume historical 10% failure baseline for demo math)
        -- In reality, we'd check against the rules active AT THAT TIME. 
        -- For this demo, let's say "Slow > 10 days" was the old fail condition.
        IF case_record.duration_days > 10 THEN
            baseline_fails := baseline_fails + 1;
        END IF;
        
        -- B. Simulated Check
        -- Rule 1: Timeliness
        IF rule_max_days IS NOT NULL AND case_record.duration_days > rule_max_days THEN
            sim_fails := sim_fails + 1;
        -- Rule 2: Completness
        ELSIF rule_req_housing IS TRUE AND case_record.has_housing IS FALSE THEN
             sim_fails := sim_fails + 1;
        END IF;
        
    END LOOP;
    
    -- Prevent div by zero
    IF total_cases = 0 THEN total_cases := 1; END IF;

    -- 3. Return Results
    RETURN QUERY SELECT 
        policy_record.name,
        total_cases,
        ROUND((baseline_fails::NUMERIC / total_cases) * 100, 2),
        ROUND((sim_fails::NUMERIC / total_cases) * 100, 2),
        jsonb_build_object(
            'delta', (sim_fails - baseline_fails),
            'rule_days', rule_max_days
        );
END;
$$;
