-- Migration: 20260217030000_rpc_reconciliation.sql
-- Description: Reconcile RPC signatures between frontend repositories and database.

BEGIN;

-- 1. Ensure intake_assessments table exists
CREATE TABLE IF NOT EXISTS intake_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES profiles(id),
    verified_barriers TEXT[] DEFAULT '{}',
    clinical_narrative TEXT,
    recommended_priority_level INTEGER,
    eligibility_status TEXT CHECK (eligibility_status IN ('pending', 'eligible', 'ineligible')),
    eligibility_rationale TEXT,
    verification_evidence JSONB DEFAULT '{}'::jsonb,
    is_locked BOOLEAN DEFAULT false,
    finalized_at TIMESTAMPTZ,
    ai_discrepancy_notes TEXT,
    ai_risk_score NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(intake_id)
);

-- 2. Refined get_latest_user_draft (No arguments, uses auth.uid())
CREATE OR REPLACE FUNCTION get_latest_user_draft()
RETURNS JSONB AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT i.id, i.client_id, i.data, i.version, i.last_saved_at
    INTO v_record
    FROM intakes i
    WHERE i.prepared_by = auth.uid() 
    AND i.status = 'draft'
    ORDER BY i.last_saved_at DESC
    LIMIT 1;
    
    IF v_record.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'found', true,
            'intake_id', v_record.id,
            'client_id', v_record.client_id,
            'data', v_record.data,
            'version', v_record.version,
            'last_saved', v_record.last_saved_at
        );
    ELSE
        RETURN jsonb_build_object('found', false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Refined save_intake_draft (Matches repo signature)
CREATE OR REPLACE FUNCTION save_intake_draft(
    p_intake_id UUID,
    p_intake_data JSONB,
    p_expected_version INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_intake_id UUID;
    v_client_id UUID;
    v_current_version INTEGER;
BEGIN
    -- Handle existing intake
    IF p_intake_id IS NOT NULL THEN
        SELECT version, client_id INTO v_current_version, v_client_id FROM intakes WHERE id = p_intake_id;
        
        -- Optimistic locking
        IF p_expected_version IS NOT NULL AND v_current_version != p_expected_version THEN
            RETURN jsonb_build_object('success', false, 'error', 'CONFLICT', 'current_version', v_current_version);
        END IF;

        UPDATE intakes 
        SET 
            data = p_intake_data,
            version = COALESCE(v_current_version, 0) + 1,
            last_saved_at = NOW(),
            prepared_by = auth.uid()
        WHERE id = p_intake_id
        RETURNING id INTO v_intake_id;
    
    -- Handle new intake
    ELSE
        -- Create a placeholder client for the draft
        INSERT INTO clients (name, status, created_by)
        VALUES (
            COALESCE(p_intake_data->>'clientName', 'Draft Client'), 
            'pending', 
            auth.uid()
        )
        RETURNING id INTO v_client_id;

        INSERT INTO intakes (client_id, status, data, prepared_by, version)
        VALUES (v_client_id, 'draft', p_intake_data, auth.uid(), 1)
        RETURNING id INTO v_intake_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'intake_id', v_intake_id,
        'client_id', v_client_id,
        'version', COALESCE(v_current_version, 0) + 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Refined save_intake_progress_atomic (Matches repo signature)
CREATE OR REPLACE FUNCTION save_intake_progress_atomic(
  p_intake_id uuid,
  p_data jsonb,
  p_summary text,
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
  SELECT version INTO v_current_version FROM intakes WHERE id = p_intake_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND');
  END IF;

  IF p_expected_version IS NOT NULL AND v_current_version != p_expected_version THEN
    RETURN jsonb_build_object('success', false, 'error', 'CONFLICT', 'current_version', v_current_version);
  END IF;

  UPDATE intakes
  SET 
    data = p_data,
    version = v_current_version + 1,
    updated_at = NOW(),
    updated_by = auth.uid()
  WHERE id = p_intake_id;

  INSERT INTO intake_versions (intake_id, data, change_summary, created_by, version_number)
  VALUES (p_intake_id, p_data, p_summary, auth.uid(), v_current_version + 1)
  RETURNING id INTO new_version_id;

  RETURN jsonb_build_object('success', true, 'new_version', v_current_version + 1);
END;
$$;

-- 5. New upsert_intake_assessment_atomic
CREATE OR REPLACE FUNCTION upsert_intake_assessment_atomic(
    p_intake_id UUID,
    p_assessment_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_assessment_id UUID;
BEGIN
    INSERT INTO intake_assessments (
        intake_id,
        counselor_id,
        clinical_narrative,
        eligibility_status,
        eligibility_rationale,
        recommended_priority_level,
        verified_barriers,
        updated_at
    )
    VALUES (
        p_intake_id,
        auth.uid(),
        p_assessment_data->>'clinical_narrative',
        (p_assessment_data->>'eligibility_status')::TEXT,
        p_assessment_data->>'eligibility_rationale',
        (p_assessment_data->>'recommended_priority_level')::INTEGER,
        ARRAY(SELECT jsonb_array_elements_text(p_assessment_data->'verified_barriers')),
        NOW()
    )
    ON CONFLICT (intake_id) DO UPDATE SET
        clinical_narrative = EXCLUDED.clinical_narrative,
        eligibility_status = EXCLUDED.eligibility_status,
        eligibility_rationale = EXCLUDED.eligibility_rationale,
        recommended_priority_level = EXCLUDED.recommended_priority_level,
        verified_barriers = EXCLUDED.verified_barriers,
        updated_at = NOW()
    RETURNING id INTO v_assessment_id;

    RETURN jsonb_build_object('success', true, 'assessment_id', v_assessment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
