-- Migration: 20260216210000_schema_stabilization.sql
-- Description: Final stabilization of clinical schema and transactional functions.

BEGIN;

-- 1. Ensure 'clients' has 'status' column (Required for Dashboard Analytics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'closed'));
    END IF;
END $$;

-- 2. Ensure 'intake_assessments' table exists (Required for transactional RPCs)
CREATE TABLE IF NOT EXISTS intake_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES profiles(id),
    verified_barriers TEXT[] DEFAULT '{}'::TEXT[],
    clinical_narrative TEXT,
    recommended_priority_level INTEGER,
    eligibility_status TEXT,
    eligibility_rationale TEXT,
    verification_evidence JSONB DEFAULT '{}'::jsonb,
    ai_discrepancy_notes TEXT,
    ai_risk_score NUMERIC,
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(intake_id)
);

-- RLS for intake_assessments
ALTER TABLE intake_assessments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intake_assessments' AND policyname = 'Staff can manage assigned assessments') THEN
        CREATE POLICY "Staff can manage assigned assessments" ON intake_assessments
        FOR ALL TO authenticated
        USING (
            EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.prepared_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
            OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
        );
    END IF;
END $$;

-- 3. Ensure 'intake_versions' table exists
CREATE TABLE IF NOT EXISTS intake_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intake_versions ENABLE ROW LEVEL SECURITY;

-- 4. Re-apply Transactional RPCs (Hardened with search_path and auth.uid())

-- A. save_intake_progress_atomic
CREATE OR REPLACE FUNCTION save_intake_progress_atomic(
  p_intake_id uuid,
  p_data jsonb,
  p_summary text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  new_version_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  
  SELECT prepared_by INTO v_owner_id FROM intakes WHERE id = p_intake_id FOR UPDATE;
  
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Intake not found'; END IF;
  IF v_owner_id <> v_user_id AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND role IN ('admin','supervisor')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE intakes SET data = COALESCE(p_data, data), updated_at = NOW(), updated_by = v_user_id WHERE id = p_intake_id;
  INSERT INTO intake_versions (intake_id, data, change_summary, created_by) VALUES (p_intake_id, COALESCE(p_data, '{}'::jsonb), p_summary, v_user_id) RETURNING id INTO new_version_id;

  RETURN jsonb_build_object('success', true, 'intake_id', p_intake_id, 'version_id', new_version_id);
END;
$func$;

-- B. upsert_intake_assessment_atomic
CREATE OR REPLACE FUNCTION upsert_intake_assessment_atomic(
  p_intake_id uuid,
  p_assessment_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner_id uuid;
  v_result_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  
  SELECT prepared_by INTO v_owner_id FROM intakes WHERE id = p_intake_id FOR UPDATE;
  IF v_owner_id IS NULL THEN RAISE EXCEPTION 'Intake not found'; END IF;

  INSERT INTO intake_assessments (
    intake_id, counselor_id, clinical_narrative, eligibility_status, updated_at
  ) VALUES (
    p_intake_id, v_user_id, p_assessment_data->>'clinical_narrative', p_assessment_data->>'eligibility_status', NOW()
  ) ON CONFLICT (intake_id) DO UPDATE SET
    clinical_narrative = EXCLUDED.clinical_narrative,
    eligibility_status = EXCLUDED.eligibility_status,
    updated_at = NOW()
  WHERE intake_assessments.is_locked = false
  RETURNING id INTO v_result_id;

  RETURN jsonb_build_object('success', true, 'id', v_result_id);
END;
$func$;

-- C. save_intake_draft
CREATE OR REPLACE FUNCTION save_intake_draft(
  p_intake_id uuid,
  p_intake_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id uuid := auth.uid();
  v_result_id uuid;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF p_intake_id IS NOT NULL THEN
    UPDATE intakes SET data = COALESCE(p_intake_data, '{}'::jsonb), status = 'draft', updated_at = NOW(), updated_by = v_user_id WHERE id = p_intake_id RETURNING id INTO v_result_id;
  ELSE
    INSERT INTO intakes (data, status, prepared_by, updated_by, updated_at, report_date) 
    VALUES (COALESCE(p_intake_data, '{}'::jsonb), 'draft', v_user_id, v_user_id, NOW(), CURRENT_DATE) RETURNING id INTO v_result_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'intake_id', v_result_id);
END;
$func$;

-- D. get_latest_user_draft
CREATE OR REPLACE FUNCTION get_latest_user_draft()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_user_id uuid := auth.uid();
  v_intake_id uuid;
  v_data jsonb;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT id, data INTO v_intake_id, v_data FROM intakes WHERE updated_by = v_user_id AND status = 'draft' ORDER BY updated_at DESC LIMIT 1;
  IF v_intake_id IS NULL THEN RETURN jsonb_build_object('found', false); END IF;
  RETURN jsonb_build_object('found', true, 'intake_id', v_intake_id, 'data', v_data);
END;
$func$;

COMMIT;
