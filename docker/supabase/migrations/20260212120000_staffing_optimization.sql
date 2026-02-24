-- Migration: 20260212120000_staffing_optimization.sql
-- Tier 1: Staffing Optimization (Institutional Intelligence)

-- 1. Staffing Load Models (The Physics of Work)
-- Defines how much time (FTE load) each unit of work consumes.
CREATE TABLE IF NOT EXISTS staffing_load_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_name TEXT NOT NULL, -- e.g., 'intake_specialist', 'clinician'
  base_minutes_per_case INTEGER NOT NULL DEFAULT 60,
  complexity_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00, -- e.g. 1.25 for complex cases
  admin_overhead_percent INTEGER NOT NULL DEFAULT 20, -- % of time spent on non-case work
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE staffing_load_models IS 'Configuration for FTE forecasting. Defines workload physics.';

-- 2. Seed Data (Industry Standards)
INSERT INTO staffing_load_models (unit_name, base_minutes_per_case, complexity_multiplier, admin_overhead_percent)
VALUES 
('intake_specialist', 90, 1.20, 25), -- 90 mins/case, 25% admin time
('nurse_practitioner', 45, 1.50, 15),
('housing_coordinator', 120, 1.10, 30)
ON CONFLICT DO NOTHING;

-- 3. RLS Policies
ALTER TABLE staffing_load_models ENABLE ROW LEVEL SECURITY;

-- Everyone can read models (for transparency)
CREATE POLICY "Staff can view staffing models" ON staffing_load_models
FOR SELECT TO authenticated USING (true);

-- Only Admins can update models
CREATE POLICY "Admins can manage staffing models" ON staffing_load_models
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
);

-- 4. Forecasting Function (The Crystal Ball)
-- Calculates FTE needs based on active case volume and the relevant model.
-- Returns: { unit, current_load_hours, required_ftes, deficit }
CREATE OR REPLACE FUNCTION get_staffing_forecast(
    target_unit TEXT,
    active_case_count INTEGER
)
RETURNS TABLE (
    unit TEXT,
    projected_load_hours NUMERIC,
    required_ftes NUMERIC,
    details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    model RECORD;
    output_load NUMERIC;
    output_ftes NUMERIC;
    weekly_work_hours CONSTANT INTEGER := 40;
BEGIN
    -- Get the active model for the unit
    SELECT * INTO model 
    FROM staffing_load_models 
    WHERE unit_name = target_unit AND active = true 
    ORDER BY effective_date DESC 
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active staffing model found for unit: %', target_unit;
    END IF;

    -- Calculation Logic:
    -- 1. Raw Minutes = Cases * Mins/Case * Complexity
    -- 2. Adjusted for Overhead = Raw / (1 - Overhead%)
    -- 3. FTEs = Total Weekly Hours / 40
    
    -- Assuming 'active_case_count' represents WEEKLY volume for this simple projection.
    -- In a real system, we might look at Monthly patterns, but let's stick to a Weekly cycle.
    
    output_load := (active_case_count * model.base_minutes_per_case * model.complexity_multiplier) / 60.0;
    
    -- Adjust for Admin Overhead (e.g. if 20% overhead, you only have 80% effective time)
    output_load := output_load / ((100 - model.admin_overhead_percent) / 100.0);
    
    output_ftes := output_load / weekly_work_hours;

    RETURN QUERY SELECT 
        model.unit_name,
        ROUND(output_load, 2),
        ROUND(output_ftes, 2),
        jsonb_build_object(
            'cases', active_case_count,
            'base_mins', model.base_minutes_per_case,
            'complexity', model.complexity_multiplier,
            'overhead_pct', model.admin_overhead_percent
        );
END;
$$;
