-- Migration: 20260212_smart_document_slots
-- Description: Adds document_requests table for "Smart Slots" feature in Portal.

-- 1. Create document_requests table
CREATE TABLE document_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g. "Resume", "ID Card"
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'rejected', 'approved')),
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL, -- Link to actual doc when uploaded
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by UUID REFERENCES profiles(id)
);

-- 2. Enable RLS
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Staff can manage requests for their clients
CREATE POLICY "Staff can manage assigned document_requests" ON document_requests
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = document_requests.client_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor'))
  ));

-- 4. Initial Seed Data (Optional - just for testing current clients)
-- Insert a "Resume" request for all active clients
INSERT INTO document_requests (client_id, name, description, requested_by)
SELECT id, 'Resume', 'Please upload your most recent resume.', assigned_to
FROM clients;
