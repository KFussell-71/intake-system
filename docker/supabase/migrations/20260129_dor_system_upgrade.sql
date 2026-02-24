-- Migration: 20260129_dor_system_upgrade
-- Description: Adds tables for DOR Intake System (Employment History, ISP Goals, etc.) and RPC for reporting.

-- 1. Create employment_history table
CREATE TABLE employment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  employer TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- 2. Create isp_goals table
CREATE TABLE isp_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'resume', 'mock_interview', 'networking', 'application', 'placement'
  target_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- 3. Create supportive_services table
CREATE TABLE supportive_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'transportation', 'clothing', 'counseling', 'medical', 'other'
  description TEXT,
  provider TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'provided', 'denied')),
  cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- 4. Create report_reviews table (Supervisor Queue)
CREATE TABLE report_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID, -- Will link to 'intakes' or specific report table if separated later. For now, we assume Intake ID = Report ID contextually
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Update intakes table to track status
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'awaiting_review', 'approved', 'locked'));
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- 5. Create compliance_scans table
CREATE TABLE compliance_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_period_start DATE,
  scan_period_end DATE,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  summary JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id)
);

-- 6. Create isp_outcomes table
CREATE TABLE isp_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  goal_type TEXT,
  target_date DATE,
  completed_date DATE,
  outcome_status TEXT CHECK (outcome_status IN ('met', 'in_progress', 'not_met')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE employment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE isp_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE supportive_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE isp_outcomes ENABLE ROW LEVEL SECURITY;

-- Simple Staff Policies (Access assigned clients)
CREATE POLICY "Staff can view assigned employment_history" ON employment_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = employment_history.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));
CREATE POLICY "Staff can manage assigned employment_history" ON employment_history FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = employment_history.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

CREATE POLICY "Staff can view assigned isp_goals" ON isp_goals FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = isp_goals.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));
CREATE POLICY "Staff can manage assigned isp_goals" ON isp_goals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = isp_goals.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

CREATE POLICY "Staff can view assigned supportive_services" ON supportive_services FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = supportive_services.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));
CREATE POLICY "Staff can manage assigned supportive_services" ON supportive_services FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = supportive_services.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

-- Supervisor policies would go here (e.g., checking role='admin' or 'supervisor'), for now open to auth for development velocity
CREATE POLICY "Staff can view report_reviews" ON report_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage report_reviews" ON report_reviews FOR ALL TO authenticated USING (true);


-- 7. Implement get_client_intake_bundle RPC
CREATE OR REPLACE FUNCTION get_client_intake_bundle(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'client', (
      SELECT jsonb_build_object(
        'id', c.id,
        'first_name', split_part(c.name, ' ', 1), -- Simple split for demo
        'last_name', split_part(c.name, ' ', 2),
        'name', c.name,
        'phone', c.phone,
        'email', c.email
      )
      FROM clients c
      WHERE c.id = client_id
    ),

    'intake', (
      SELECT jsonb_build_object(
        'id', i.id,
        'intake_date', i.report_date,
        'report_date', i.report_date,
        'status', i.status
      )
      FROM intakes i
      WHERE i.client_id = client_id
      ORDER BY i.created_at DESC
      LIMIT 1
    ),

    'documents', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'type', d.type,
          'url', d.url,
          'uploaded_at', d.uploaded_at
        )
      ), '[]'::jsonb)
      FROM documents d
      WHERE d.client_id = client_id
    ),

    'employment_history', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'job_title', e.job_title,
          'employer', e.employer,
          'start_date', e.start_date,
          'end_date', e.end_date,
          'notes', e.notes
        )
      ), '[]'::jsonb)
      FROM employment_history e
      WHERE e.client_id = client_id
    ),

    'isp_goals', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'goal_type', g.goal_type,
          'target_date', g.target_date,
          'status', g.status,
          'notes', g.notes
        )
      ), '[]'::jsonb)
      FROM isp_goals g
      WHERE g.client_id = client_id
    ),

    'supportive_services', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'service_type', s.service_type,
          'description', s.description,
          'status', s.status
        )
      ), '[]'::jsonb)
      FROM supportive_services s
      WHERE s.client_id = client_id
    ),

    'follow_up', (
      SELECT jsonb_build_object(
        'next_meeting_date', f.contact_date,
        'notes', f.notes
      )
      FROM follow_ups f
      WHERE f.client_id = client_id
      ORDER BY f.contact_date DESC
      LIMIT 1
    )
  );

  RETURN result;
END;
$$;
