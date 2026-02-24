-- Migration: Enable Drafts for Intakes
-- Date: 2026-02-06
-- Purpose: Allow intakes to be saved as drafts without strict validation

-- 1. Ensure Intakes table supports status and JSONB
ALTER TABLE intakes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'review', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create RPC for saving drafts
-- This function handles the UPSERT logic for drafts
-- It allows partial data and doesn't require a client record initially if we wanted, 
-- but our schema requires client_id. So we will create a "Pending" client if needed.

CREATE OR REPLACE FUNCTION save_intake_draft(
    p_intake_id UUID,
    p_client_id UUID,
    p_intake_data JSONB,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_intake_id UUID;
    v_client_id UUID;
BEGIN
    -- Case 1: Updating existing draft
    IF p_intake_id IS NOT NULL THEN
        UPDATE intakes 
        SET 
            data = p_intake_data,
            last_saved_at = NOW(),
            prepared_by = p_user_id
        WHERE id = p_intake_id
        RETURNING id INTO v_intake_id;
        
        -- Also update client info from draft data if possible (e.g. name changed)
        UPDATE clients
        SET 
            name = COALESCE(p_intake_data->>'clientName', name),
            phone = COALESCE(p_intake_data->>'phone', phone),
            email = COALESCE(p_intake_data->>'email', email),
            updated_at = NOW()
        WHERE id = (SELECT client_id FROM intakes WHERE id = v_intake_id);
        
        v_client_id := (SELECT client_id FROM intakes WHERE id = v_intake_id);
        
    -- Case 2: Creating new draft
    ELSE
        -- First create a placeholder client if we don't present one
        IF p_client_id IS NULL THEN
            INSERT INTO clients (name, status, created_by)
            VALUES (
                COALESCE(p_intake_data->>'clientName', 'Draft Client'), 
                'pending', 
                p_user_id
            )
            RETURNING id INTO v_client_id;
        ELSE
            v_client_id := p_client_id;
        END IF;

        INSERT INTO intakes (client_id, status, data, prepared_by, report_date)
        VALUES (
            v_client_id, 
            'draft', 
            p_intake_data, 
            p_user_id,
            COALESCE((p_intake_data->>'reportDate')::date, CURRENT_DATE)
        )
        RETURNING id INTO v_intake_id;
    END IF;

    RETURN jsonb_build_object(
        'intake_id', v_intake_id,
        'client_id', v_client_id,
        'last_saved', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create RPC to load latest draft for user
CREATE OR REPLACE FUNCTION get_latest_user_draft(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT i.id, i.client_id, i.data, i.last_saved_at
    INTO v_record
    FROM intakes i
    WHERE i.prepared_by = p_user_id 
    AND i.status = 'draft'
    ORDER BY i.last_saved_at DESC
    LIMIT 1;
    
    IF v_record.id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'found', true,
            'intake_id', v_record.id,
            'client_id', v_record.client_id,
            'data', v_record.data,
            'last_saved', v_record.last_saved_at
        );
    ELSE
        RETURN jsonb_build_object('found', false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
