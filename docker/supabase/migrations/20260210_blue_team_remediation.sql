-- BLUE TEAM REMEDIATION: RT-CRIT-001, RT-CRIT-002
-- Date: 2026-02-10
-- Purpose: Fix Critical IDOR and Impersonation vulnerabilities identified by Red Team.

-- 1. [RT-CRIT-001] Secure get_client_intake_bundle (IDOR Fix)
-- Description: Added strict ownership checks. Only assigned staff or admins can fetch the bundle.
CREATE OR REPLACE FUNCTION get_client_intake_bundle(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public -- Hardening: Prevent search path hijacking
AS $$
DECLARE
  result jsonb;
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  -- SECURITY CHECK: Ensure user has access to this client
  IF NOT EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = p_client_id
    AND (
      c.assigned_to = v_uid 
      OR c.created_by = v_uid
      OR (SELECT role FROM profiles WHERE id = v_uid) IN ('admin', 'supervisor')
    )
  ) THEN
    -- Return null or empty to prevent leakage, or raise exception for clarity
    RAISE EXCEPTION 'Access Denied: You do not have permission to view this client bundle.';
  END IF;

  SELECT jsonb_build_object(
    'client', (
      SELECT row_to_json(c)
      FROM clients c
      WHERE c.id = p_client_id
    ),
    'intake', (
      SELECT jsonb_build_object(
        'id', i.id,
        'client_id', i.client_id,
        'report_date', i.report_date,
        'completion_date', i.completion_date,
        'status', i.status,
        'details', i.data,
        'created_at', i.created_at
      )
      FROM intakes i
      WHERE i.client_id = p_client_id
      ORDER BY i.created_at DESC
      LIMIT 1
    )
    -- ... (rest of the function remains similar, but now protected by the check above)
    -- Optimizing: The subqueries below implicitly are safe if we verified client access, 
    -- but RLS would catch them anyway. The check above is the primary gate.
    ,
    'documents', (
      SELECT coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb)
      FROM documents d
      WHERE d.client_id = p_client_id
    ),
    'employment_history', (
      SELECT coalesce(jsonb_agg(row_to_json(e)), '[]'::jsonb)
      FROM employment_history e
      WHERE e.client_id = p_client_id
    ),
    'isp_goals', (
      SELECT coalesce(jsonb_agg(row_to_json(g)), '[]'::jsonb)
      FROM isp_goals g
      WHERE g.client_id = p_client_id
    ),
    'supportive_services', (
      SELECT coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb)
      FROM supportive_services s
      WHERE s.client_id = p_client_id
    ),
    'follow_up', (
      SELECT row_to_json(f)
      FROM follow_ups f
      WHERE f.client_id = p_client_id
      ORDER BY f.contact_date DESC
      LIMIT 1
    )
  )
  INTO result;

  RETURN result;
END;
$$;

-- 2. [RT-CRIT-002] Secure save_intake_draft (Impersonation Fix)
-- Description: Removed p_user_id argument. Function now forces auth.uid().
DROP FUNCTION IF EXISTS save_intake_draft(uuid, uuid, jsonb, uuid); -- Drop old signature

CREATE OR REPLACE FUNCTION save_intake_draft(
    p_intake_id UUID,
    p_client_id UUID,
    p_intake_data JSONB
)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_intake_id UUID;
    v_client_id UUID;
    v_uid UUID;
BEGIN
    v_uid := auth.uid(); -- Force use of authenticated user ID
    
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Case 1: Updating existing draft
    IF p_intake_id IS NOT NULL THEN
        -- SECURITY CHECK: Ensure user owns this draft
        IF NOT EXISTS (
            SELECT 1 FROM intakes 
            WHERE id = p_intake_id 
            AND prepared_by = v_uid -- Only allow update if prepared by THIS user
        ) THEN
             RAISE EXCEPTION 'Access Denied: You can only edit your own drafts.';
        END IF;

        UPDATE intakes 
        SET 
            data = p_intake_data,
            last_saved_at = NOW()
            -- prepared_by is already v_uid check above ensures we don't hijack others' drafts
        WHERE id = p_intake_id
        RETURNING id INTO v_intake_id;
        
        -- Also update client info from draft data if possible
        -- SECURITY: Check client ownership
        UPDATE clients
        SET 
            name = COALESCE(p_intake_data->>'clientName', name),
            phone = COALESCE(p_intake_data->>'phone', phone),
            email = COALESCE(p_intake_data->>'email', email),
            updated_at = NOW()
        WHERE id = (SELECT client_id FROM intakes WHERE id = v_intake_id)
        AND (assigned_to = v_uid OR created_by = v_uid); -- Ensure we have rights to update client
        
        v_client_id := (SELECT client_id FROM intakes WHERE id = v_intake_id);
        
    -- Case 2: Creating new draft
    ELSE
        -- First create a placeholder client if we don't present one
        IF p_client_id IS NULL THEN
            INSERT INTO clients (name, status, created_by, assigned_to)
            VALUES (
                COALESCE(p_intake_data->>'clientName', 'Draft Client'), 
                'pending', 
                v_uid,
                v_uid -- Assign to self
            )
            RETURNING id INTO v_client_id;
        ELSE
            -- Verify access to existing client before referencing
            IF NOT EXISTS (
                 SELECT 1 FROM clients WHERE id = p_client_id AND (assigned_to = v_uid OR created_by = v_uid)
            ) THEN
                 RAISE EXCEPTION 'Access Denied: Cannot create draft for this client.';
            END IF;
            v_client_id := p_client_id;
        END IF;

        INSERT INTO intakes (client_id, status, data, prepared_by, report_date)
        VALUES (
            v_client_id, 
            'draft', 
            p_intake_data, 
            v_uid,
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
$$;
