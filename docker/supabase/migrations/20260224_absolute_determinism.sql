-- R&D Program: Distributed Clinical Node - Absolute Determinism & Security Sealing
-- Purpose: Eliminate all non-deterministic entropy and enforce exclusive mutation bottleneck.

BEGIN;

-- 1. Eliminate Entropy: Hardened Sync Engine with Authoritative Timestamps
-- We replace NOW() with p_timestamp provided by the client/event.
CREATE OR REPLACE FUNCTION apply_domain_delta_v2(
    p_case_id UUID,
    p_payload JSONB,
    p_timestamp TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
    v_client_id UUID;
    v_attachment JSONB;
BEGIN
    SELECT client_id INTO v_client_id FROM intakes WHERE id = p_case_id;

    -- A. Identity Domain
    IF p_payload ? 'identity' THEN
        UPDATE clients 
        SET 
            name = COALESCE(p_payload->'identity'->>'clientName', name),
            phone = COALESCE(p_payload->'identity'->>'clientPhone', phone),
            email = COALESCE(p_payload->'identity'->>'clientEmail', email),
            address = COALESCE(p_payload->'identity'->>'clientAddress', address),
            updated_at = p_timestamp -- AUTHORITATIVE
        WHERE id = v_client_id;
    END IF;

    -- B. Clinical Domain
    IF p_payload ? 'clinical' THEN
        UPDATE intakes
        SET
            data = data || (p_payload->'clinical'),
            primary_diagnosis_code = COALESCE(p_payload->'clinical'->>'primaryDiagnosisCode', primary_diagnosis_code),
            mobility_status = COALESCE(p_payload->'clinical'->>'mobilityStatus', mobility_status),
            updated_at = p_timestamp -- AUTHORITATIVE
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
            p_timestamp -- AUTHORITATIVE
        )
        ON CONFLICT (intake_id) DO UPDATE SET
            clinical_narrative = EXCLUDED.clinical_narrative,
            eligibility_status = EXCLUDED.eligibility_status,
            updated_at = p_timestamp;
    END IF;

    -- D. Attachment Ledger (Deduplicated by SHA256)
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
                device_id,
                created_at, -- AUTHORITATIVE for creation
                updated_at
            )
            VALUES (
                p_case_id,
                v_attachment->>'storagePath',
                v_attachment->>'sha256Hash',
                (v_attachment->>'byteSize')::BIGINT,
                v_attachment->>'mimeType',
                (v_attachment->>'userId')::UUID,
                (v_attachment->>'deviceId')::UUID,
                p_timestamp,
                p_timestamp
            )
            ON CONFLICT (case_id, sha256_hash) DO NOTHING;
        END LOOP;
    END IF;
END;
$$;

-- 2. Hardened Master Sync (Entropy-Free version)
CREATE OR REPLACE FUNCTION master_clinical_sync_v2(
    p_case_id UUID,
    p_base_version INTEGER,
    p_device_id UUID,
    p_user_id UUID,
    p_timestamp TIMESTAMPTZ, -- Mandatory entry point for determinism
    p_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
    v_current_version INTEGER;
    v_new_version INTEGER;
BEGIN
    -- 1. Acquire Lock
    SELECT version INTO v_current_version
    FROM clinical_cases
    WHERE id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        IF p_base_version != 0 THEN
            RAISE EXCEPTION 'Case not found and base_version is not 0';
        END IF;
        
        INSERT INTO clinical_cases (id, version, updated_by, device_id, updated_at, created_at)
        VALUES (p_case_id, 1, p_user_id, p_device_id, p_timestamp, p_timestamp);
        
        v_current_version := 0;
    ELSE
        IF v_current_version != p_base_version THEN
            RETURN jsonb_build_object(
                'status', 'error', 
                'message', 'Version conflict', 
                'current_version', v_current_version
            );
        END IF;
    END IF;

    v_new_version := v_current_version + 1;

    -- 2. Apply Deterministic Delta
    PERFORM apply_domain_delta_v2(p_case_id, p_payload, p_timestamp);

    -- 3. Increment Aggregate with Authoritative Time
    UPDATE clinical_cases
    SET 
        version = v_new_version, 
        updated_at = p_timestamp, 
        updated_by = p_user_id, 
        device_id = p_device_id
    WHERE id = p_case_id;

    -- 4. Record Event Log (Preserving absolute replay fidelity)
    INSERT INTO case_event_log (
        case_id, 
        base_version, 
        new_version, 
        event_type, 
        payload, 
        device_id, 
        user_id, 
        created_at
    )
    VALUES (
        p_case_id, 
        v_current_version, 
        v_new_version, 
        'CASE_MUTATION', 
        p_payload, 
        p_device_id, 
        p_user_id, 
        p_timestamp
    );

    RETURN jsonb_build_object('status', 'success', 'new_version', v_new_version);
END;
$$;

-- 3. Security Sealing: Revoke Direct Mutations
-- We force ALL writes through the hardened sync engine.
REVOKE INSERT, UPDATE, DELETE ON TABLE clients FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE intakes FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE intake_assessments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE clinical_cases FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE clinical_case_attachments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE case_event_log FROM authenticated;

-- Only Allow the RPC to mutate
GRANT EXECUTE ON FUNCTION master_clinical_sync_v2 TO authenticated;

COMMIT;
