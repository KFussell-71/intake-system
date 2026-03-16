-- V3 Enterprise Hardening: Atomic Narrative Promotion
CREATE OR REPLACE FUNCTION promote_narrative_to_barrier_v3(
    p_intake_id UUID,
    p_text TEXT,
    p_category TEXT,
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    v_rationale_id UUID;
BEGIN
    -- 1. Create Rationale
    INSERT INTO clinical_rationales (
        intake_id,
        field_name,
        content,
        created_by
    ) VALUES (
        p_intake_id,
        'client_barriers',
        'Promoted from narrative: ' || left(p_text, 50),
        p_user_id
    ) RETURNING id INTO v_rationale_id;

    -- 2. Create Barrier
    INSERT INTO client_barriers (
        intake_id,
        barrier_text,
        category,
        rationale_id,
        created_by
    ) VALUES (
        p_intake_id,
        p_text,
        p_category,
        v_rationale_id,
        p_user_id
    );

    RETURN v_rationale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
