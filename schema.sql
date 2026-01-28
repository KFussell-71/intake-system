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
CREATE TABLE follow_ups (
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
