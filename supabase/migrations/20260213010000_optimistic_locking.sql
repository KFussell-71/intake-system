-- Migration: 20260213_optimistic_locking
-- Description: Adds a version column to the intakes table and updates RPCs for concurrency control.

-- 1. Add version column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'intakes' AND column_name = 'version'
  ) THEN
    ALTER TABLE intakes ADD COLUMN version INTEGER DEFAULT 1;
  END IF;
END $$;

-- 2. Update Atomic Intake Progress Save with Version Check
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
BEGIN
  -- Check current version
  SELECT version INTO v_current_version FROM intakes WHERE id = p_intake_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Intake record % not found', p_intake_id;
  END IF;

  -- Optimistic Locking Check
  IF p_expected_version IS NOT NULL AND v_current_version != p_expected_version THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'CONFLICT', 
      'message', 'The record was updated by another user. Current version: ' || v_current_version || ', Expected: ' || p_expected_version
    );
  END IF;

  -- 1. Update main intake record and increment version
  UPDATE intakes
  SET 
    data = p_data,
    version = v_current_version + 1,
    updated_at = NOW(),
    updated_by = p_user_id
  WHERE id = p_intake_id;

  -- 2. Insert version snapshot (Audit Log)
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

-- 3. Update Save Intake Draft with Version Control
CREATE OR REPLACE FUNCTION save_intake_draft(
  p_intake_id uuid,
  p_intake_data jsonb,
  p_user_id uuid,
  p_expected_version integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_version integer;
  v_result_id uuid;
  v_new_version integer;
BEGIN
  IF p_intake_id IS NOT NULL THEN
    -- Check Version
    SELECT version INTO v_current_version FROM intakes WHERE id = p_intake_id;
    
    IF p_expected_version IS NOT NULL AND v_current_version != p_expected_version THEN
      RETURN jsonb_build_object(
        'success', false, 
        'error', 'CONFLICT', 
        'message', 'Draft conflict detected. Version mismatch.'
      );
    END IF;

    v_new_version := coalesce(v_current_version, 1) + 1;

    UPDATE intakes
    SET 
      data = p_intake_data,
      status = 'draft',
      version = v_new_version,
      updated_at = NOW(),
      updated_by = p_user_id
    WHERE id = p_intake_id
    RETURNING id INTO v_result_id;
  ELSE
    INSERT INTO intakes (
      data,
      status,
      version,
      created_by,
      updated_by
    )
    VALUES (
      p_intake_data,
      'draft',
      1,
      p_user_id,
      p_user_id
    )
    RETURNING id, version INTO v_result_id, v_new_version;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'intake_id', v_result_id,
    'version', v_new_version
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 4. Update Get Latest User Draft to include Version
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
  v_version integer;
BEGIN
  SELECT id, data, version INTO v_intake_id, v_data, v_version
  FROM intakes
  WHERE updated_by = p_user_id AND status = 'draft'
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_intake_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'found', true,
      'intake_id', v_intake_id,
      'data', v_data,
      'version', v_version
    );
  ELSE
    RETURN jsonb_build_object('found', false);
  END IF;
END;
$$;
