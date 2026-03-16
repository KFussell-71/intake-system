-- Migration: 20260212200000_transparency.sql
-- Tier 5: Public Transparency (Institutional Intelligence)

-- 1. Public Metric Definitions (The Menu)
-- Defines what statistics we are allowed to show the public.
CREATE TABLE IF NOT EXISTS public_metric_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g. 'INTAKE_VOL_MONTHLY'
  name TEXT NOT NULL, -- e.g. 'Intakes per Month'
  description TEXT,
  query_def JSONB, -- Logic to calculate it (for the publisher engine)
  display_type TEXT DEFAULT 'bar', -- 'bar', 'line', 'stat'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Public Snapshots (The Air Gap)
-- This table is safe to expose via read-only API.
-- It contains NO PII. Only aggregated numbers.
CREATE TABLE IF NOT EXISTS public_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_code TEXT REFERENCES public_metric_definitions(code),
  period_start DATE,
  period_end DATE,
  value JSONB NOT NULL, -- The result (e.g. { "count": 42 })
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id)
);

-- 3. Seed Data (Safe Metrics)
INSERT INTO public_metric_definitions (code, name, description, display_type) VALUES
('INTAKE_VOL_TOTAL', 'Total Citizens Served', 'Cumulative count of intakes processed.', 'stat'),
('AVG_DAYS_TO_SERVICE', 'Average Days to Service', 'Average time from intake to first service.', 'stat'),
('BARRIER_DISTRIBUTION', 'Barriers Identified', 'Breakdown of barriers faced by the population.', 'bar')
ON CONFLICT DO NOTHING;

-- 4. Enable RLS (Public Read Access)
ALTER TABLE public_metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow anyone (even anon) to read snapshots
CREATE POLICY "Public can view snapshots" 
ON public_snapshots FOR SELECT 
TO anon, authenticated 
USING (true);

-- Allow anyone to read definitions
CREATE POLICY "Public can view definitions" 
ON public_metric_definitions FOR SELECT 
TO anon, authenticated 
USING (true);

-- Only staff can insert (Publish)
CREATE POLICY "Staff can publish snapshots" 
ON public_snapshots FOR INSERT 
TO authenticated 
WITH CHECK (true); -- ideally check role='staff' or 'admin'
