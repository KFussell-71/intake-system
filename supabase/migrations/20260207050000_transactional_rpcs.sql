-- Migration: 20260207_transactional_rpcs_FIXED
-- Purpose: atomic operations, concurrency safe, strict typing, audit aligned, auth.uid() identity

-- 1. Atomic Intake Progress Save
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
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_intake_id IS NULL THEN
    RAISE EXCEPTION 'p_intake_id is required';
  END IF;

  -- lock row and verify ownership
  SELECT prepared_by INTO v_owner_id FROM intakes WHERE id = p_intake_id FOR UPDATE;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Intake record % not found', p_intake_id;
  END IF;

  IF v_owner_id <> v_user_id AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id
    AND role IN ('admin','supervisor')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE intakes
  SET
    data = COALESCE(p_data, data),
    updated_at = NOW(),
    updated_by = v_user_id
  WHERE id = p_intake_id;

  INSERT INTO intake_versions (
    intake_id,
    data,
    change_summary,
    created_by
  )
  VALUES (
    p_intake_id,
    COALESCE(p_data, '{}'::jsonb),
    p_summary,
    v_user_id
  )
  RETURNING id INTO new_version_id;

  RETURN jsonb_build_object(
    'success', true,
    'intake_id', p_intake_id,
    'version_id', new_version_id
  );
END;
$func$;

-- 2. Atomic Assessment Upsert
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
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_intake_id IS NULL THEN
    RAISE EXCEPTION 'p_intake_id is required';
  END IF;

  -- Ensure intake exists & lock
  SELECT prepared_by INTO v_owner_id FROM intakes WHERE id = p_intake_id FOR UPDATE;
  
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Intake % not found', p_intake_id;
  END IF;

  IF v_owner_id <> v_user_id AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id
    AND role IN ('admin','supervisor')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- single statement upsert prevents split brain
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
    ai_risk_score,
    updated_at
  )
  VALUES (
    p_intake_id,
    v_user_id,
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_assessment_data->'verified_barriers')),
      ARRAY[]::text[]
    ),
    p_assessment_data->>'clinical_narrative',
    NULLIF(p_assessment_data->>'recommended_priority_level','')::int,
    p_assessment_data->>'eligibility_status',
    p_assessment_data->>'eligibility_rationale',
    COALESCE(p_assessment_data->'verification_evidence','{}'::jsonb),
    p_assessment_data->>'ai_discrepancy_notes',
    NULLIF(p_assessment_data->>'ai_risk_score','')::numeric,
    NOW()
  )
  ON CONFLICT (intake_id)
  DO UPDATE SET
    verified_barriers = EXCLUDED.verified_barriers,
    clinical_narrative = EXCLUDED.clinical_narrative,
    recommended_priority_level = EXCLUDED.recommended_priority_level,
    eligibility_status = EXCLUDED.eligibility_status,
    eligibility_rationale = EXCLUDED.eligibility_rationale,
    verification_evidence = EXCLUDED.verification_evidence,
    ai_discrepancy_notes = EXCLUDED.ai_discrepancy_notes,
    ai_risk_score = EXCLUDED.ai_risk_score,
    updated_at = NOW()
  WHERE intake_assessments.is_locked = false
  RETURNING id INTO v_result_id;

  IF v_result_id IS NULL THEN
    RAISE EXCEPTION 'Assessment is locked and cannot be modified';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_result_id
  );
END;
$func$;

-- 3. Save Intake Draft
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
  v_owner_id uuid;
  v_result_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_intake_id IS NOT NULL THEN
    SELECT prepared_by INTO v_owner_id FROM intakes WHERE id = p_intake_id FOR UPDATE;

    IF v_owner_id IS NULL THEN
      RAISE EXCEPTION 'Draft not found';
    END IF;

    IF v_owner_id <> v_user_id THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE intakes
    SET
      data = COALESCE(p_intake_data, '{}'::jsonb),
      status = 'draft',
      updated_at = NOW(),
      updated_by = v_user_id
    WHERE id = p_intake_id
    RETURNING id INTO v_result_id;

    IF v_result_id IS NULL THEN
      RAISE EXCEPTION 'Draft intake % not found', p_intake_id;
    END IF;

  ELSE
    INSERT INTO intakes (
      data,
      status,
      prepared_by,
      updated_by,
      updated_at
    )
    VALUES (
      COALESCE(p_intake_data, '{}'::jsonb),
      'draft',
      v_user_id,
      v_user_id,
      NOW()
    )
    RETURNING id INTO v_result_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'intake_id', v_result_id
  );
END;
$func$;

-- 4. Get Latest User Draft
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
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id, data
  INTO v_intake_id, v_data
  FROM intakes
  WHERE updated_by = v_user_id
    AND status = 'draft'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_intake_id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'intake_id', v_intake_id,
    'data', v_data
  );
END;
$func$;
