-- Migration: Outcome Justification Engine (Economic Impact)
-- Date: 2026-02-16

-- 1. Create placements table
CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    employer_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    start_date DATE NOT NULL,
    hourly_wage NUMERIC(10, 2) NOT NULL CHECK (hourly_wage > 0),
    hours_per_week NUMERIC(4, 1) NOT NULL CHECK (hours_per_week > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create retention_checks table
CREATE TYPE retention_check_type AS ENUM ('30_day', '60_day', '90_day', '180_day');
CREATE TYPE employment_status AS ENUM ('employed', 'unemployed', 'unknown');

CREATE TABLE IF NOT EXISTS public.retention_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    check_type retention_check_type NOT NULL,
    status employment_status NOT NULL DEFAULT 'unknown',
    checked_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(placement_id, check_type)
);

-- 3. Enable RLS
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_checks ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Standard Access)
CREATE POLICY "Enable read access for authenticated users" ON public.placements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for staff and admins" ON public.placements
    FOR ALL TO authenticated USING (
        auth.jwt() ->> 'role' IN ('staff', 'supervisor', 'admin')
    );

CREATE POLICY "Enable read access for authenticated users" ON public.retention_checks
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for staff and admins" ON public.retention_checks
    FOR ALL TO authenticated USING (
        auth.jwt() ->> 'role' IN ('staff', 'supervisor', 'admin')
    );

-- 5. Create Metric Calculation RPC
CREATE OR REPLACE FUNCTION get_outcome_metrics(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_placements INT;
    avg_wage NUMERIC;
    retention_30 NUMERIC;
    retention_60 NUMERIC;
    retention_90 NUMERIC;
    result JSONB;
BEGIN
    -- Check permissions
    IF NOT (auth.role() IN ('admin', 'supervisor')) THEN
        RAISE EXCEPTION 'Access Denied: Supervisor privileges required';
    END IF;

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

    -- 3. Retention Rates (Simplified: status = 'employed' / total checks of that type)
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
    result := json_build_object(
        'total_placements', total_placements,
        'avg_wage', ROUND(avg_wage, 2),
        'retention_rates', json_build_object(
            'day_30', ROUND(retention_30, 1),
            'day_60', ROUND(retention_60, 1),
            'day_90', ROUND(retention_90, 1)
        )
    );

    RETURN result;
END;
$$;
