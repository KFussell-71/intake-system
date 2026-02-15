-- Migration: 20260215_standard_configs
-- Description: Adds tables for standardized agency configuration (Franchise Model).

-- 1. Create required_documents reference table
CREATE TABLE IF NOT EXISTS required_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_name TEXT NOT NULL UNIQUE,
  is_mandatory BOOLEAN DEFAULT true,
  category TEXT CHECK (category IN ('intake', 'compliance', 'employment', 'medical', 'other')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can read, only Admins can manage
CREATE POLICY "Everyone can read required_documents" ON required_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage required_documents" ON required_documents FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed Standard Documents
INSERT INTO required_documents (document_name, is_mandatory, category, description) VALUES
('Referral Form', true, 'intake', 'Initial referral from DOR or partner agency'),
('Intake Assessment', true, 'intake', 'Completed intake interview form'),
('Consent to Release Information', true, 'compliance', 'Signed consent for data sharing'),
('Rights and Responsibilities', true, 'compliance', 'Signed acknowledgement of client rights'),
('Individual Service Plan (ISP)', true, 'employment', 'The roadmap for employment services'),
('Medical Clearance', false, 'medical', 'Clearance for physical labor if applicable'),
('Resume', false, 'employment', 'Client resume (draft or final)')
ON CONFLICT (document_name) DO NOTHING;


-- 2. Create agency_settings table (Singleton pattern)
CREATE TABLE IF NOT EXISTS agency_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name TEXT NOT NULL DEFAULT 'New Agency',
  contact_email TEXT,
  logo_url TEXT,
  theme_color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agency_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can read, only Admins can update
CREATE POLICY "Everyone can read agency_settings" ON agency_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update agency_settings" ON agency_settings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed Default Settings (if empty)
INSERT INTO agency_settings (agency_name)
SELECT 'New Beginning Options'
WHERE NOT EXISTS (SELECT 1 FROM agency_settings);
