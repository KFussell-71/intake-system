-- SECURITY MIGRATION: Add Authorization Checks to SECURITY DEFINER Functions
-- Date: 2026-01-31
-- Purpose: Remediate Red Team Finding C5 - SECURITY DEFINER functions bypass RLS
--
-- This migration adds explicit authorization checks inside SECURITY DEFINER functions
-- to prevent unauthorized access to client data.

-- 1. Fix get_client_intake_bundle to require client assignment
CREATE OR REPLACE FUNCTION get_client_intake_bundle(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  v_user_id uuid;
BEGIN
  -- SECURITY: Get the calling user's ID
  v_user_id := auth.uid();
  
  -- SECURITY: Verify the user is authorized to access this client
  -- User must be assigned_to or created_by the client
  IF NOT EXISTS (
    SELECT 1 FROM clients 
    WHERE id = p_client_id 
    AND (assigned_to = v_user_id OR created_by = v_user_id)
  ) THEN
    -- SECURITY: Return empty result for unauthorized requests
    -- Do not reveal whether the client exists
    RAISE EXCEPTION 'Access denied: You are not authorized to access this client record';
  END IF;

  -- Proceed with the original query
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
    ),
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

-- 2. Fix create_client_intake - already uses auth.uid() but add role check
-- This function is naturally secured because it sets created_by = auth.uid()
-- No change needed, but add a comment for audit trail

COMMENT ON FUNCTION create_client_intake IS 
'SECURITY: This function creates client records with created_by = auth.uid(), 
ensuring the creator has implicit access. SECURITY DEFINER is used to allow 
insert operations while maintaining ownership tracking. Audited 2026-01-31.';

-- 3. Update report_reviews RLS policies to require supervisor/admin role
-- Remove the overly permissive USING (true) policies

DROP POLICY IF EXISTS "Staff can view report_reviews" ON report_reviews;
DROP POLICY IF EXISTS "Staff can manage report_reviews" ON report_reviews;

-- New policy: Only supervisors and admins can view report reviews
CREATE POLICY "Supervisors can view report_reviews" ON report_reviews
  FOR SELECT TO authenticated
  USING (
    -- User must be a supervisor or admin
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('supervisor', 'admin')
    OR
    -- OR they created the review
    created_by = auth.uid()
  );

-- New policy: Only supervisors and admins can manage report reviews
CREATE POLICY "Supervisors can manage report_reviews" ON report_reviews
  FOR ALL TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('supervisor', 'admin')
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('supervisor', 'admin')
  );

-- 4. Add index on profiles.role if not exists (for RLS performance)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 5. Add audit log entry for this security migration
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
SELECT 
  auth.uid(),
  'UPDATE',
  'SECURITY_MIGRATION',
  gen_random_uuid(),
  jsonb_build_object(
    'migration', 'security_definer_authorization',
    'date', NOW(),
    'findings_addressed', ARRAY['C5', 'H2'],
    'description', 'Added authorization checks to SECURITY DEFINER functions and role-based RLS for report reviews'
  )
WHERE auth.uid() IS NOT NULL;
