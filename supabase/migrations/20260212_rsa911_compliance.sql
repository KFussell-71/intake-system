-- Migration: 20260212_rsa911_compliance
-- Description: Adds RSA-911 required fields to intakes and supportive_services tables to support federal reporting.

-- 1. Add RSA-911 Date & Status Fields to `intakes`
-- These fields track the critical timeline for VR cases.
ALTER TABLE intakes
ADD COLUMN IF NOT EXISTS application_date DATE, -- Distinct from report_date (often same, but can differ)
ADD COLUMN IF NOT EXISTS eligibility_date DATE, -- Critical for 60-day compliance
ADD COLUMN IF NOT EXISTS ipe_date DATE,         -- Individualized Plan for Employment date (90-day compliance)
ADD COLUMN IF NOT EXISTS closure_date DATE,     -- Case closure
ADD COLUMN IF NOT EXISTS closure_reason TEXT,   -- RSA closure code/reason
ADD COLUMN IF NOT EXISTS disability_significance TEXT CHECK (disability_significance IN ('most_significant', 'significant', 'not_significant'));

-- 2. Add RSA Service Categorization to `supportive_services`
-- Required to map generic services (e.g., 'transportation') to federal reporting codes.
ALTER TABLE supportive_services
ADD COLUMN IF NOT EXISTS rsa_service_category TEXT, -- e.g., 'career_services', 'training_services', 'pre_ets'
ADD COLUMN IF NOT EXISTS rsa_service_code TEXT;     -- Specific RSA-911 code (e.g., '100', '200')

-- 3. Add Index for Reporting Performance
CREATE INDEX IF NOT EXISTS idx_intakes_dates ON intakes(application_date, eligibility_date, ipe_date, closure_date);

-- 4. Update Trigger to Auto-Populate application_date
-- If application_date is NULL on insert, default to report_date
CREATE OR REPLACE FUNCTION public.set_default_application_date()
RETURNS trigger AS $$
BEGIN
  IF NEW.application_date IS NULL THEN
    NEW.application_date := NEW.report_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_intake_insert_set_app_date
  BEFORE INSERT ON intakes
  FOR EACH ROW EXECUTE FUNCTION public.set_default_application_date();
