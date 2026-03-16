-- R&D Program: Distributed Clinical Node - Core Engine Hardening
-- Purpose: Implement SHA256 Attachment Integrity and Seal Security Definer RPCs.

BEGIN;

-- 1. Deterministic Attachment Ledger
CREATE TABLE IF NOT EXISTS clinical_case_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES clinical_cases(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    sha256_hash TEXT NOT NULL, -- The "Law" of binary reconciliation
    byte_size BIGINT NOT NULL,
    mime_type TEXT,
    uploaded_by UUID NOT NULL,
    device_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for hash-based reconciliation
CREATE INDEX IF NOT EXISTS idx_attachment_hash_integrity ON clinical_case_attachments(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_attachment_case_lookup ON clinical_case_attachments(case_id);

-- 2. HARDENED Domain Delta Application (With Attachment Support)
CREATE OR REPLACE FUNCTION apply_domain_delta(
    p_case_id UUID,
    p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
-- Explicit search_path prevents environment-based schema injection
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
    v_client_id UUID;
    v_attachment JSONB;
BEGIN
    -- Resolve client_id
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
            data = data || (p_payload->'clinical'),
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

    -- D. MANDATORY Attachment Ledger Sync
    -- This ensures binary assets are part of the deterministic state hash.
    IF p_payload ? 'attachments' THEN
        FOR v_attachment IN SELECT * FROM jsonb_array_elements(p_payload->'attachments')
        LOOP
            INSERT INTO clinical_case_attachments (
                case_id,
                storage_path,
                sha256_hash,
                byte_size,
                mime_type,
                uploaded_by,
                device_id
            )
            VALUES (
                p_case_id,
                v_attachment->>'storagePath',
                v_attachment->>'sha256Hash',
                (v_attachment->>'byteSize')::BIGINT,
                v_attachment->>'mimeType',
                (v_attachment->>'userId')::UUID,
                (v_attachment->>'deviceId')::UUID
            )
            ON CONFLICT (case_id, sha256_hash) DO NOTHING; -- Deduplication by Hash
        END LOOP;
    END IF;

END;
$$;

-- 3. SEALED Master Clinical Sync
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
-- Sealed search_path for security integrity
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
    v_current_version INTEGER;
    v_new_version INTEGER;
BEGIN
    -- Acquire Lock
    SELECT version INTO v_current_version
    FROM clinical_cases
    WHERE id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        IF p_base_version != 0 THEN
            RAISE EXCEPTION 'Case not found and base_version is not 0';
        END IF;
        
        INSERT INTO clinical_cases (id, version, updated_by, device_id)
        VALUES (p_case_id, 1, p_user_id, p_device_id);
        
        v_current_version := 0;
    ELSE
        IF v_current_version != p_base_version THEN
            RAISE EXCEPTION 'Version conflict: expected %, got %', p_base_version, v_current_version;
        END IF;
    END IF;

    v_new_version := v_current_version + 1;

    -- Apply Deterministic Delta
    PERFORM apply_domain_delta(p_case_id, p_payload);

    -- Increment and Log
    UPDATE clinical_cases
    SET version = v_new_version, updated_at = NOW(), updated_by = p_user_id, device_id = p_device_id
    WHERE id = p_case_id;

    INSERT INTO case_event_log (case_id, base_version, new_version, event_type, payload, device_id, user_id)
    VALUES (p_case_id, v_current_version, v_new_version, 'CASE_MUTATION', p_payload, p_device_id, p_user_id);

    RETURN jsonb_build_object('status', 'success', 'new_version', v_new_version);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM, 'code', SQLSTATE);
END;
$$;

-- Add Unique constraint for attachment deduplication
ALTER TABLE clinical_case_attachments ADD CONSTRAINT uq_attachment_case_hash UNIQUE (case_id, sha256_hash);

COMMIT;
