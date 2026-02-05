-- AI CODE REVIEW REPAIR: 2026-02-04
-- Target: create_client_intake & handle_new_user hardening

-- 1. Harden create_client_intake with Role Check
CREATE OR REPLACE FUNCTION create_client_intake(
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address TEXT,
  p_ssn_last_four CHAR(4),
  p_report_date DATE,
  p_completion_date DATE,
  p_intake_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_client_id UUID;
  new_intake_id UUID;
  v_user_role TEXT;
BEGIN
  -- SECURITY: Authorization Check
  -- Only staff, supervisors, and admins can create clients
  SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('staff', 'supervisor', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Insufficient permissions to create clients.';
  END IF;

  -- 1. Create Client
  INSERT INTO clients (name, phone, email, address, ssn_last_four, created_by)
  VALUES (p_name, p_phone, p_email, p_address, p_ssn_last_four, auth.uid())
  RETURNING id INTO new_client_id;

  -- 2. Create Intake
  INSERT INTO intakes (client_id, report_date, completion_date, data, prepared_by, status)
  VALUES (new_client_id, p_report_date, p_completion_date, p_intake_data, auth.uid(), 'draft')
  RETURNING id INTO new_intake_id;

  -- 3. Return result
  RETURN jsonb_build_object(
    'client_id', new_client_id,
    'intake_id', new_intake_id,
    'success', true
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Remediate PII Leakage in handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- SECURITY: Use prefix of email instead of full email as public username
  -- This prevents leakage of user emails in public-facing UIs
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, split_part(new.email, '@', 1), 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
