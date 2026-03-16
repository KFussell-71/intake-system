-- Migration: 20260213_relational_clinical_modeling
-- Description: Promotes critical clinical fields from JSONB data to structured relational columns.

ALTER TABLE intakes 
ADD COLUMN IF NOT EXISTS primary_diagnosis_code TEXT,
ADD COLUMN IF NOT EXISTS mobility_status TEXT,
ADD COLUMN IF NOT EXISTS eligibility_status TEXT,
ADD COLUMN IF NOT EXISTS priority_level INTEGER;

-- Create Index for Clinical Analytics
CREATE INDEX IF NOT EXISTS idx_intakes_clinical_metrics 
ON intakes(primary_diagnosis_code, eligibility_status, priority_level);

-- Update save_intake_progress_atomic to sync relational columns
CREATE OR REPLACE FUNCTION save_intake_progress_atomic(
  p_intake_id uuid,
  p_data jsonb,
  p_summary text,
  p_user_id uuid,
  p_expected_version integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version integer;
  new_version_id uuid;
  v_diagnosis text;
  v_mobility text;
  v_eligibility text;
  v_priority integer;
BEGIN
  -- 1. Extract clinical fields from JSONB
  v_diagnosis := p_data->>'primaryDiagnosisCode';
  v_mobility := p_data->'medical'->>'mobilityStatus';
  v_eligibility := p_data->>'eligibilityStatus';
  v_priority := (p_data->>'priorityLevel')::integer;

  -- 2. Check current version
  SELECT version INTO v_current_version FROM intakes WHERE id = p_intake_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intake record % not found', p_intake_id;
  END IF;

  -- 3. Optimistic Locking Check
  IF p_expected_version IS NOT NULL AND v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'CONFLICT', 
      'message', 'The record was updated by another user. Current version: ' || v_current_version || ', Expected: ' || p_expected_version
    );
  END IF;

  -- 4. Update main intake record with relational clinical data
  UPDATE intakes
  SET 
    data = p_data,
    primary_diagnosis_code = v_diagnosis,
    mobility_status = v_mobility,
    eligibility_status = v_eligibility,
    priority_level = v_priority,
    version = v_current_version + 1,
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = p_intake_id;

  -- 5. Insert version snapshot
  INSERT INTO intake_versions (
    intake_id,
    data,
    change_summary,
    created_by
  )
  VALUES (
    p_intake_id,
    p_data,
    p_summary,
    p_user_id
  )
  RETURNING id INTO new_version_id;

  RETURN jsonb_build_object(
    'success', true,
    'intake_id', p_intake_id,
    'new_version', v_current_version + 1,
    'version_id', new_version_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
