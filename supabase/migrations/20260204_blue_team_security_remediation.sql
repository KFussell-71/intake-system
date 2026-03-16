-- BLUE TEAM REMEDIATION: RT-SEC-001, RT-PRIV-001, RT-REL-001
-- Security Hardening for RPCs and Audit Triggers

-- 1. [RT-SEC-001] Secure get_client_intake_bundle
-- Adds explicit authorization check inside the SECURITY DEFINER function
CREATE OR REPLACE FUNCTION get_client_intake_bundle(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_user_role TEXT;
BEGIN
  -- SECURITY: Authorization Check
  -- Verify that the caller is either assigned to the client, created the client, or is a supervisor/admin
  SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
  
  IF NOT (
    EXISTS (SELECT 1 FROM clients WHERE id = p_client_id AND (assigned_to = auth.uid() OR created_by = auth.uid()))
    OR v_user_role IN ('supervisor', 'admin')
  ) THEN
    -- Return null or raise exception? Returning null is safer for silent failures in UI
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'client', (
      SELECT jsonb_build_object(
        'id', c.id,
        'first_name', split_part(c.name, ' ', 1),
        'last_name', split_part(c.name, ' ', 2),
        'name', c.name,
        'phone', c.phone,
        'email', c.email
      )
      FROM clients c
      WHERE c.id = p_client_id
    ),
    'intake', (
      SELECT jsonb_build_object('id', i.id, 'intake_date', i.report_date, 'report_date', i.report_date, 'status', i.status)
      FROM intakes i WHERE i.client_id = p_client_id ORDER BY i.created_at DESC LIMIT 1
    ),
    'documents', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'name', d.name, 'type', d.type, 'url', d.url, 'uploaded_at', d.uploaded_at)), '[]'::jsonb)
      FROM documents d WHERE d.client_id = p_client_id
    ),
    'employment_history', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', e.id, 'job_title', e.job_title, 'employer', e.employer, 'start_date', e.start_date, 'end_date', e.end_date, 'notes', e.notes)), '[]'::jsonb)
      FROM employment_history e WHERE e.client_id = p_client_id
    ),
    'isp_goals', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'goal_type', g.goal_type, 'target_date', g.target_date, 'status', g.status, 'notes', g.notes)), '[]'::jsonb)
      FROM isp_goals g WHERE g.client_id = p_client_id
    ),
    'supportive_services', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'service_type', s.service_type, 'description', s.description, 'status', s.status)), '[]'::jsonb)
      FROM supportive_services s WHERE s.client_id = p_client_id
    ),
    'follow_up', (
      SELECT jsonb_build_object('next_meeting_date', f.contact_date, 'notes', f.notes)
      FROM follow_ups f WHERE f.client_id = p_client_id ORDER BY f.contact_date DESC LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 2. [RT-PRIV-001] Mask PII in Audit Logs
-- Updates the audit trigger to exclude high-sensitivity columns
CREATE OR REPLACE FUNCTION audit_record_change()
RETURNS TRIGGER AS $$
DECLARE
    v_details JSONB;
BEGIN
    -- Construct details but EXCLUDE sensitive columns (SSN, specific PHI)
    v_details := jsonb_build_object(
        'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) - 'ssn_last_four' - 'address' - 'phone' END,
        'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) - 'ssn_last_four' - 'address' - 'phone' END
    );

    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, 
        CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
        v_details
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. [RT-REL-001] Atomic Bulk Approval
-- Moves loop logic to database for transactional integrity
CREATE OR REPLACE FUNCTION bulk_approve_reports(p_intake_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- SECURITY: Authorization Check (Supervisor Only)
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin')) THEN
        RAISE EXCEPTION 'Unauthorized: Supervisor role required.';
    END IF;

    -- Update strictly reports awaiting review
    UPDATE intakes 
    SET status = 'approved', 
        updated_at = NOW(), 
        updated_by = auth.uid()
    WHERE id = ANY(p_intake_ids) 
    AND status = 'awaiting_review';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Trigger audit log (handled by existing audit triggers on 'intakes' table)
    
    RETURN jsonb_build_object('success', true, 'count', v_count);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
