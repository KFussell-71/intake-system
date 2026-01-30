-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id) DEFAULT auth.uid()
);

-- Create indexes for performance
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_intakes_client_id ON intakes(client_id);
CREATE INDEX idx_intakes_data_gin ON intakes USING gin (data);

-- Create intakes table
CREATE TABLE intakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  prepared_by UUID REFERENCES profiles(id),
  completion_date DATE,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- Create tracking_milestones table
CREATE TABLE tracking_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  completion_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create job_placements table
CREATE TABLE job_placements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  wage TEXT,
  title TEXT,
  placement_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create follow_ups table
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_date DATE NOT NULL,
  method TEXT CHECK (method IN ('phone', 'in-person')),
  performance TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, new.email, 'staff');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create follow_ups table (duplicate removed by IF NOT EXISTS)
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_date DATE NOT NULL,
  method TEXT CHECK (method IN ('phone', 'in-person')),
  performance TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) - Granular Isolation
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Staff can view their own profile
CREATE POLICY "Staff can view own profile" ON profiles 
  FOR SELECT TO authenticated 
  USING (id = auth.uid());

-- Policies: Staff can only see clients assigned to them
CREATE POLICY "Staff can view assigned clients" ON clients 
  FOR SELECT TO authenticated 
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Staff can manage assigned clients" ON clients 
  FOR ALL TO authenticated 
  USING (assigned_to = auth.uid() OR created_by = auth.uid())
  WITH CHECK (assigned_to = auth.uid() OR created_by = auth.uid());

-- Intakes isolation via foreign key to clients
CREATE POLICY "Staff can view assigned intakes" ON intakes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = intakes.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

CREATE POLICY "Staff can manage assigned intakes" ON intakes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = intakes.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- Repeat for other tables
CREATE POLICY "Staff can view assigned milestones" ON tracking_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = tracking_milestones.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

CREATE POLICY "Staff can view assigned placements" ON job_placements
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = job_placements.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

CREATE POLICY "Staff can view assigned followups" ON follow_ups
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- Create documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'application/pdf', 'image/jpeg', etc.
  size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id)
);

-- Enable RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Documents isolation
CREATE POLICY "Staff can view assigned documents" ON documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

CREATE POLICY "Staff can upload assigned documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

CREATE POLICY "Staff can delete assigned documents" ON documents
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- Storage Bucket Setup (Idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'client-documents' bucket
-- Allow read access to assigned staff
CREATE POLICY "Staff can read assigned storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'client-documents' AND EXISTS (
    SELECT 1 FROM documents
    JOIN clients ON clients.id = documents.client_id
    WHERE documents.url LIKE '%' || storage.objects.name
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- Allow upload access to authenticated staff (further restricted by app logic/Trigger if needed, but basic auth is okay for now)
CREATE POLICY "Staff can upload storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-documents');

-- Allow delete access to owner or assigned staff (simplified to auth for now, app handles logic)
CREATE POLICY "Staff can delete storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'client-documents');
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

-- 8. Implement create_client_intake RPC (Transactional Insert)
CREATE OR REPLACE FUNCTION create_client_intake(
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_address TEXT,
  p_report_date DATE,
  p_completion_date DATE,
  p_intake_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_client_id UUID;
  new_intake_id UUID;
BEGIN
  -- 1. Create Client
  INSERT INTO clients (name, phone, email, address, created_by)
  VALUES (p_name, p_phone, p_email, p_address, auth.uid())
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
