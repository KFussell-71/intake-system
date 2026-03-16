-- SME CLINICAL HARDENING: 2026-02-04
-- Addressing Clinical Reality: Nonlinear intake and Audit Rationale

-- 1. Create Barriers Lookup Table
CREATE TABLE IF NOT EXISTS barriers_to_employment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- e.g., 'Medical', 'Physical', 'Psychological', 'Transportation', 'Legal'
    description TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with common DOR barriers
INSERT INTO barriers_to_employment (category, description) VALUES
('Physical', 'Limited Mobility (Requires Assistive Device)'),
('Physical', 'Chronic Pain (Limited Sitting/Standing)'),
('Medical', 'Visual Impairment'),
('Medical', 'Hearing Impairment'),
('Psychological', 'Anxiety Disorder'),
('Psychological', 'Learning Disability'),
('Transportation', 'No Driver''s License'),
('Legal', 'Prior Felony Conviction'),
('Educational', 'No High School Diploma/GED')
ON CONFLICT (description) DO NOTHING;

-- 2. Create Junction Table for Clients and Barriers
CREATE TABLE IF NOT EXISTS client_barriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    barrier_id UUID REFERENCES barriers_to_employment(id) ON DELETE CASCADE,
    counselor_rationale TEXT, -- THE "WHY" (Clinical Reasoning)
    verified_at TIMESTAMPTZ DEFAULT NOW(),
    verified_by UUID REFERENCES profiles(id),
    
    UNIQUE(client_id, barrier_id)
);

-- 3. Add Clinical Rationale to ISP Goals and Intakes
ALTER TABLE isp_goals ADD COLUMN IF NOT EXISTS counselor_rationale TEXT;
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS counselor_rationale TEXT;
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS edit_comment TEXT; -- Accountability for revisions

-- 4. Relax create_client_intake RPC constraints to allow DRAFTS
-- We keep the parameters but allow NULLs for SSN and Name during creation if needed
-- (Though name is usually required for a record, we'll allow it to be short/placeholder)

CREATE OR REPLACE FUNCTION create_client_intake(
  p_name TEXT,
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_ssn_last_four CHAR(4) DEFAULT NULL,
  p_report_date DATE DEFAULT CURRENT_DATE,
  p_completion_date DATE DEFAULT NULL,
  p_intake_data JSONB DEFAULT '{}'::jsonb
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
  SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('staff', 'supervisor', 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Insufficient permissions to create clients.';
  END IF;

  -- 1. Create Client (Name is still NOT NULL in table, but we allow 'TBD' or short names)
  INSERT INTO clients (name, phone, email, address, ssn_last_four, created_by)
  VALUES (COALESCE(p_name, 'TBD_INTAKE_' || NOW()::TEXT), p_phone, p_email, p_address, p_ssn_last_four, auth.uid())
  RETURNING id INTO new_client_id;

  -- 2. Create Intake (Initialize as Draft)
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

-- 5. [RT-SEC-005] Paginated get_client_intake_bundle (Finding #5)
-- Prevents browser memory issues/timeouts for clients with many documents
CREATE OR REPLACE FUNCTION get_client_intake_bundle(
    p_client_id uuid,
    p_doc_limit int DEFAULT 10,
    p_doc_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  v_user_role TEXT;
BEGIN
  -- SECURITY: Authorization Check
  SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
  
  IF NOT (
    EXISTS (SELECT 1 FROM clients WHERE id = p_client_id AND (assigned_to = auth.uid() OR created_by = auth.uid()))
    OR v_user_role IN ('supervisor', 'admin')
  ) THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'client', (
      SELECT row_to_json(c) FROM clients c WHERE c.id = p_client_id
    ),
    'intake', (
      SELECT jsonb_build_object(
        'id', i.id,
        'report_date', i.report_date,
        'status', i.status,
        'details', i.data,
        'counselor_rationale', i.counselor_rationale -- CLINICAL RATIONALE
      )
      FROM intakes i WHERE i.client_id = p_client_id ORDER BY i.created_at DESC LIMIT 1
    ),
    'documents', (
      SELECT coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb)
      FROM (
          SELECT id, name, type, url, uploaded_at 
          FROM documents 
          WHERE client_id = p_client_id 
          ORDER BY uploaded_at DESC 
          LIMIT p_doc_limit OFFSET p_doc_offset
      ) d
    ),
    'employment_history', (
      SELECT coalesce(jsonb_agg(row_to_json(e)), '[]'::jsonb)
      FROM employment_history e WHERE e.client_id = p_client_id
    ),
    'isp_goals', (
      SELECT coalesce(jsonb_agg(row_to_json(g)), '[]'::jsonb)
      FROM isp_goals g WHERE g.client_id = p_client_id
    ),
    'barriers', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('id', b.id, 'category', b.category, 'description', b.description, 'rationale', cb.counselor_rationale)), '[]'::jsonb)
      FROM client_barriers cb 
      JOIN barriers_to_employment b ON b.id = cb.barrier_id
      WHERE cb.client_id = p_client_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 6. Enable RLS for new tables
ALTER TABLE barriers_to_employment ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_barriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view barriers" ON barriers_to_employment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage client_barriers" ON client_barriers FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_barriers.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = client_barriers.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

-- 7. Grant Permissions
GRANT ALL ON client_barriers TO authenticated;
GRANT SELECT ON barriers_to_employment TO authenticated;
