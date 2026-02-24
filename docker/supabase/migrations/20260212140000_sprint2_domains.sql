-- Migration: 20260212140000_sprint2_domains.sql
-- Purpose: Create relational tables for Medical and Employment domains (Sprint 2)

-- 1. Intake Medical (Health, Mental Health, Substance Use)
CREATE TABLE IF NOT EXISTS intake_medical (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  -- Clinical Evals
  medical_eval_needed BOOLEAN,
  psych_eval_needed BOOLEAN,
  -- General Health
  medical_condition_current BOOLEAN,
  medical_condition_description TEXT,
  medical_prior_history TEXT,
  medical_meds_current BOOLEAN,
  medical_meds_details TEXT,
  primary_care_physician TEXT,
  primary_care_physician_contact TEXT,
  medical_comments TEXT,
  medical_employment_impact TEXT,
  -- Mental Health
  mh_history BOOLEAN,
  mh_history_details TEXT,
  mh_prior_counseling BOOLEAN,
  mh_prior_counseling_details TEXT,
  mh_prior_counseling_dates TEXT,
  mh_prior_diagnosis BOOLEAN,
  mh_prior_diagnosis_details TEXT,
  mh_prior_helpful_activities TEXT,
  mh_prior_meds BOOLEAN,
  mh_prior_meds_details TEXT,
  -- Substance Use
  tobacco_use BOOLEAN,
  tobacco_duration TEXT,
  tobacco_quit_interest TEXT,
  tobacco_products TEXT[], -- Array
  tobacco_other TEXT,
  alcohol_history BOOLEAN,
  alcohol_current BOOLEAN,
  alcohol_frequency TEXT,
  alcohol_quit_interest TEXT,
  alcohol_products TEXT[], -- Array
  alcohol_other TEXT,
  alcohol_prior_tx BOOLEAN,
  alcohol_prior_tx_details TEXT,
  alcohol_prior_tx_duration TEXT,
  drug_history BOOLEAN,
  drug_current BOOLEAN,
  drug_frequency TEXT,
  drug_quit_interest TEXT,
  drug_products TEXT[], -- Array
  drug_other TEXT,
  drug_prior_tx BOOLEAN,
  drug_prior_tx_details TEXT,
  substance_comments TEXT,
  substance_employment_impact TEXT,
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(intake_id)
);

COMMENT ON TABLE intake_medical IS 'Relational storage for Medical, Mental Health, and Substance Use data.';

-- 2. Intake Employment (Vocational, Education, Goals)
CREATE TABLE IF NOT EXISTS intake_employment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  -- Goals
  employment_goals TEXT,
  education_goals TEXT,
  housing_needs TEXT,
  -- History & Skills
  education_level TEXT,
  employment_type TEXT[], -- Array
  desired_job_titles TEXT,
  target_pay TEXT,
  work_experience_summary TEXT,
  transferable_skills TEXT[], -- Array
  transferable_skills_other TEXT,
  industry_preferences TEXT[], -- Array
  industry_other TEXT,
  -- Readiness & Barriers (Booleans)
  resume_complete BOOLEAN,
  interview_skills BOOLEAN,
  job_search_assistance BOOLEAN,
  transportation_assistance BOOLEAN,
  childcare_assistance BOOLEAN,
  housing_assistance BOOLEAN,
  -- Placement Details
  placement_date DATE,
  company_name TEXT,
  job_title TEXT,
  wage TEXT,
  hours_per_week TEXT,
  supervisor_name TEXT,
  supervisor_phone TEXT,
  probation_ends DATE,
  benefits TEXT,
  transportation_type TEXT,
  commute_time TEXT,
  -- Prep Curriculum
  class1_date DATE,
  class2_date DATE,
  class3_date DATE,
  class4_date DATE,
  master_app_complete BOOLEAN,
  -- Job Search
  job_search_commitment_count TEXT, -- Keeping as text to match strict TS type if needed, or convert to int
  job_search_commitments TEXT[],
  -- ISP Goals (JSONB for now as it is a structured list)
  isp_goals JSONB,
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(intake_id)
);

COMMENT ON TABLE intake_employment IS 'Relational storage for Vocational, Education, and Employment History.';

-- 3. RLS Policies

-- Medical
ALTER TABLE intake_medical ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view medical for own cases" ON intake_medical
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
);

CREATE POLICY "Staff update medical for own cases" ON intake_medical
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
);

-- Employment
ALTER TABLE intake_employment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view employment for own cases" ON intake_employment
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
);

CREATE POLICY "Staff update employment for own cases" ON intake_employment
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
);
