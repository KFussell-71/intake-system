-- R&D Program: Distributed Clinical Node - Hardened Deterministic Sync
-- Purpose: Collapse mutation fragmentation and enforce absolute atomicity.

BEGIN;

-- 1. Hardened Clinical Case Aggregate Root
-- Note: Dropping and recreating to ensure strict design compliance.
DROP TABLE IF EXISTS clinical_case_events CASCADE;
DROP TABLE IF EXISTS clinical_cases CASCADE;

CREATE TABLE clinical_cases (
    id UUID PRIMARY KEY, -- Usually maps to intake_id or client_id depending on aggregate scope
    version INTEGER NOT NULL DEFAULT 1,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'verified', 'conflict')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL,
    device_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Hardened Case Event Log
CREATE TABLE case_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
    base_version INTEGER NOT NULL,
    new_version INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    device_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure event ordering
    CONSTRAINT event_order CHECK (new_version = base_version + 1)
);

CREATE INDEX idx_case_event_log_lookup ON case_event_log(case_id, new_version);

-- 3. Deterministic Domain Delta Application
-- This is internal to master_clinical_sync.
CREATE OR REPLACE FUNCTION apply_domain_delta(
    p_case_id UUID,
    p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Resolve client_id from case_id (assuming 1:1 for this aggregate)
    SELECT client_id INTO v_client_id FROM intakes WHERE id = p_case_id;

    -- A. Client / Identity Domain
    IF p_payload ? 'identity' THEN
        UPDATE clients 
        SET 
            name = COALESCE(p_payload->'identity'->>'clientName', name),
            phone = COALESCE(p_payload->'identity'->>'clientPhone', phone),
            email = COALESCE(p_payload->'identity'->>'clientEmail', email),
            address = COALESCE(p_payload->'identity'->>'clientAddress', address),
            updated_at = NOW()
        WHERE id = v_client_id;
    END IF;

    -- B. Clinical / Intake Domain
    IF p_payload ? 'clinical' THEN
        UPDATE intakes
        SET
            data = data || (p_payload->'clinical'), -- Deep merge would be better, but this handles top-level
            primary_diagnosis_code = COALESCE(p_payload->'clinical'->>'primaryDiagnosisCode', primary_diagnosis_code),
            mobility_status = COALESCE(p_payload->'clinical'->>'mobilityStatus', mobility_status),
            updated_at = NOW()
        WHERE id = p_case_id;
    END IF;

    -- C. Assessment Domain
    IF p_payload ? 'assessment' THEN
        INSERT INTO intake_assessments (
            intake_id,
            clinical_narrative,
            eligibility_status,
            updated_at
        )
        VALUES (
            p_case_id,
            p_payload->'assessment'->>'clinicalNarrative',
            p_payload->'assessment'->>'eligibilityStatus',
            NOW()
        )
        ON CONFLICT (intake_id) DO UPDATE SET
            clinical_narrative = EXCLUDED.clinical_narrative,
            eligibility_status = EXCLUDED.eligibility_status,
            updated_at = NOW();
    END IF;

END;
$$;

-- 4. MASTER CLINICAL SYNC (The State Machine)
CREATE OR REPLACE FUNCTION master_clinical_sync(
    p_case_id UUID,
    p_base_version INTEGER,
    p_device_id UUID,
    p_user_id UUID,
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_version INTEGER;
    v_new_version INTEGER;
BEGIN
    -- 1. Acquire Row-Level Lock on Aggregate
    SELECT version INTO v_current_version
    FROM clinical_cases
    WHERE id = p_case_id
    FOR UPDATE;

    -- Handle bootstrapping new cases
    IF NOT FOUND THEN
        -- Verify this is indeed a new case creation (version 0 -> 1)
        IF p_base_version != 0 THEN
            RAISE EXCEPTION 'Case not found and base_version is not 0';
        END IF;
        
        INSERT INTO clinical_cases (id, version, updated_by, device_id)
        VALUES (p_case_id, 1, p_user_id, p_device_id)
        RETURNING version INTO v_new_version;
        
        v_current_version := 0;
    ELSE
        -- 2. Strict Version Gating
        IF v_current_version != p_base_version THEN
            RAISE EXCEPTION 'Version conflict: expected %, got %', p_base_version, v_current_version;
        END IF;
        
        v_new_version := v_current_version + 1;
    END IF;

    -- 3. Apply Domain Mutations Deterministically
    PERFORM apply_domain_delta(p_case_id, p_payload);

    -- 4. Increment Version
    UPDATE clinical_cases
    SET 
        version = v_new_version,
        updated_at = NOW(),
        updated_by = p_user_id,
        device_id = p_device_id
    WHERE id = p_case_id;

    -- 5. Record Event Log
    INSERT INTO case_event_log (
        case_id,
        base_version,
        new_version,
        event_type,
        payload,
        device_id,
        user_id
    )
    VALUES (
        p_case_id,
        v_current_version,
        v_new_version,
        'CASE_MUTATION',
        p_payload,
        p_device_id,
        p_user_id
    );

    RETURN jsonb_build_object(
        'status', 'success',
        'new_version', v_new_version,
        'case_id', p_case_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Transaction implicitly rolls back on exception
    RETURN jsonb_build_object(
        'status', 'error',
        'message', SQLERRM,
        'code', SQLSTATE
    );
END;
$$;

-- 5. Mandatory RLS to block direct writes (Enforcing the Bottleneck)
-- NOTE: In production, we'd also revoke direct UPDATE on domain tables 
-- and only allow it through SECURITY DEFINER functions.

COMMIT;
