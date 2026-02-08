-- Migration: 20260207_transactional_rpcs
-- Description: Implements atomic RPCs for intake versioning and assessment management to ensure data integrity and HIPAA audit compliance.

-- 1. Atomic Intake Progress Save
-- Updates the intake record and creates a version snapshot in one transaction.
CREATE OR REPLACE FUNCTION save_intake_progress_atomic(
  p_intake_id uuid,
  p_data jsonb,
  p_summary text,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_version_id uuid;
BEGIN
  -- 1. Update main intake record
  UPDATE intakes
  SET 
    data = p_data,
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = p_intake_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intake record % not found', p_intake_id;
  END IF;

  -- 2. Insert version snapshot
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
    'version_id', new_version_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Atomic Assessment Upsert
-- Handles the check-then-act logic for assessments, including locking checks.
CREATE OR REPLACE FUNCTION upsert_intake_assessment_atomic(
  p_intake_id uuid,
  p_assessment_data jsonb,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_id uuid;
  v_is_locked boolean;
  v_result_id uuid;
BEGIN
  -- Check for existing record
  SELECT id, is_locked INTO v_existing_id, v_is_locked
  FROM intake_assessments
  WHERE intake_id = p_intake_id;

  -- Security check: prevent modification of locked assessments
  IF v_existing_id IS NOT NULL AND v_is_locked = true THEN
    RAISE EXCEPTION 'Assessment is locked and cannot be modified';
  END IF;

  IF v_existing_id IS NOT NULL THEN
    -- Update
    UPDATE intake_assessments
    SET 
      verified_barriers = (p_assessment_data->>'verified_barriers')::text[],
      clinical_narrative = p_assessment_data->>'clinical_narrative',
      recommended_priority_level = (p_assessment_data->>'recommended_priority_level')::int,
      eligibility_status = p_assessment_data->>'eligibility_status',
      eligibility_rationale = p_assessment_data->>'eligibility_rationale',
      verification_evidence = (p_assessment_data->>'verification_evidence')::jsonb,
      ai_discrepancy_notes = p_assessment_data->>'ai_discrepancy_notes',
      ai_risk_score = (p_assessment_data->>'ai_risk_score')::numeric,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_result_id;
  ELSE
    -- Insert
    INSERT INTO intake_assessments (
      intake_id,
      counselor_id,
      verified_barriers,
      clinical_narrative,
      recommended_priority_level,
      eligibility_status,
      eligibility_rationale,
      verification_evidence,
      ai_discrepancy_notes,
      ai_risk_score
    )
    VALUES (
      p_intake_id,
      p_user_id,
      (p_assessment_data->>'verified_barriers')::text[],
      p_assessment_data->>'clinical_narrative',
      (p_assessment_data->>'recommended_priority_level')::int,
      p_assessment_data->>'eligibility_status',
      p_assessment_data->>'eligibility_rationale',
      (p_assessment_data->>'verification_evidence')::jsonb,
      p_assessment_data->>'ai_discrepancy_notes',
      (p_assessment_data->>'ai_risk_score')::numeric
    )
    RETURNING id INTO v_result_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_result_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Save Intake Draft
-- Handles draft creation and updates with soft-linking to clients.
CREATE OR REPLACE FUNCTION save_intake_draft(
  p_intake_id uuid,
  p_intake_data jsonb,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result_id uuid;
BEGIN
  IF p_intake_id IS NOT NULL THEN
    UPDATE intakes
    SET 
      data = p_intake_data,
      status = 'draft',
      updated_at = NOW(),
      updated_by = p_user_id
    WHERE id = p_intake_id
    RETURNING id INTO v_result_id;
  ELSE
    INSERT INTO intakes (
      data,
      status,
      created_by,
      updated_by
    )
    VALUES (
      p_intake_data,
      'draft',
      p_user_id,
      p_user_id
    )
    RETURNING id INTO v_result_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'intake_id', v_result_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. Get Latest User Draft
-- Retrieves the most recently updated draft for a specific user.
CREATE OR REPLACE FUNCTION get_latest_user_draft(
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_intake_id uuid;
  v_data jsonb;
BEGIN
  SELECT id, data INTO v_intake_id, v_data
  FROM intakes
  WHERE updated_by = p_user_id AND status = 'draft'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_intake_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'intake_id', v_intake_id,
      'data', v_data
    );
  ELSE
    RETURN jsonb_build_object('found', false);
  END IF;
END;
$$;

