-- Migration: 20260224_clinical_self_report_split
-- Purpose: Explicitly separate Client Self-Report from Counselor Assessment.
-- SME Requirement: Decouple "Client's Voice" from "Professional Verdict".

BEGIN;

-- 1. Create client_statements table
-- This stores the raw, unfiltered narratives provided by the client.
CREATE TABLE IF NOT EXISTS client_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Self-Reported Narrative Data
    presenting_issue TEXT,
    reported_barriers TEXT[],
    goals_and_objectives TEXT,
    personal_resources TEXT[],
    support_network_comments TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb, -- e.g., "captured_via_portal"
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT client_statement_unique_per_intake UNIQUE (intake_id)
);

-- 2. Add professional_rationale reference to intake_assessments
-- This links a counselor's barrier verification back to a client's claim.
ALTER TABLE intake_assessments 
ADD COLUMN IF NOT EXISTS verified_statement_id UUID REFERENCES client_statements(id);

-- 3. Upgrade Forensic Delta Engine (v3.1)
-- Now handles 'statements' as a first-class domain.
CREATE OR REPLACE FUNCTION apply_domain_delta_v3(
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
    v_statement_id UUID;
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
            updated_at = p_timestamp
        WHERE id = v_client_id;
    END IF;

    -- B. Client Statements (Self-Report)
    IF p_payload ? 'statements' THEN
        INSERT INTO client_statements (
            intake_id,
            client_id,
            presenting_issue,
            reported_barriers,
            goals_and_objectives,
            updated_at
        )
        VALUES (
            p_case_id,
            v_client_id,
            p_payload->'statements'->>'presentingIssue',
            ARRAY(SELECT jsonb_array_elements_text(p_payload->'statements'->'reportedBarriers')),
            p_payload->'statements'->>'goals',
            p_timestamp
        )
        ON CONFLICT (intake_id) DO UPDATE SET
            presenting_issue = EXCLUDED.presenting_issue,
            reported_barriers = EXCLUDED.reported_barriers,
            goals_and_objectives = EXCLUDED.goals_and_objectives,
            updated_at = p_timestamp
        RETURNING id INTO v_statement_id;
    END IF;

    -- C. Clinical Domain (Strict Metrics)
    IF p_payload ? 'clinical' THEN
        UPDATE intakes
        SET
            data = data || (p_payload->'clinical'),
            primary_diagnosis_code = COALESCE(p_payload->'clinical'->>'primaryDiagnosisCode', primary_diagnosis_code),
            mobility_status = COALESCE(p_payload->'clinical'->>'mobilityStatus', mobility_status),
            updated_at = p_timestamp
        WHERE id = p_case_id;
    END IF;

    -- D. Assessment Domain (Counselor Evaluation)
    IF p_payload ? 'assessment' THEN
        INSERT INTO intake_assessments (
            intake_id,
            clinical_narrative,
            eligibility_status,
            verified_statement_id,
            updated_at
        )
        VALUES (
            p_case_id,
            p_payload->'assessment'->>'clinicalNarrative',
            p_payload->'assessment'->>'eligibilityStatus',
            v_statement_id, -- Link to the statements updated in this same transaction
            p_timestamp
        )
        ON CONFLICT (intake_id) DO UPDATE SET
            clinical_narrative = EXCLUDED.clinical_narrative,
            eligibility_status = EXCLUDED.eligibility_status,
            verified_statement_id = COALESCE(v_statement_id, intake_assessments.verified_statement_id),
            updated_at = p_timestamp;
    END IF;

    -- E. Attachment Ledger
    IF p_payload ? 'attachments' THEN
        FOR v_attachment IN SELECT * FROM jsonb_array_elements(p_payload->'attachments')
        LOOP
            INSERT INTO clinical_case_attachments (
                id, storage_path, sha256_hash, byte_size, mime_type, uploaded_by, device_id, created_at, updated_at, case_id
            )
            VALUES (
                (v_attachment->>'id')::UUID, 
                v_attachment->>'storagePath',
                v_attachment->>'sha256Hash',
                (v_attachment->>'byteSize')::BIGINT,
                v_attachment->>'mimeType',
                (v_attachment->>'userId')::UUID,
                (v_attachment->>'deviceId')::UUID,
                p_timestamp,
                p_timestamp,
                p_case_id
            )
            ON CONFLICT (case_id, sha256_hash) DO NOTHING;
        END LOOP;
    END IF;
END;
$$;

COMMIT;
