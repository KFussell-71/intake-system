-- Migration: 20260215_standard_configs
-- Description: Adds tables for standardized agency configuration (Franchise Model).

-- 1. Create required_documents reference table
CREATE TABLE IF NOT EXISTS required_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  category TEXT,
  stage TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, stage)
);

-- Ensure columns exist if table was created differently
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'required_documents' AND column_name = 'category') THEN
        ALTER TABLE required_documents ADD COLUMN category TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'required_documents' AND column_name = 'stage') THEN
        ALTER TABLE required_documents ADD COLUMN stage TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can read, only Admins can manage
CREATE POLICY "Everyone can read required_documents" ON required_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage required_documents" ON required_documents FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed Standard Documents
INSERT INTO required_documents (name, is_mandatory, category, stage, description) VALUES
('Referral Form', true, 'intake', 'intake', 'Initial referral from DOR or partner agency'),
('Intake Assessment', true, 'intake', 'assessment', 'Completed intake interview form'),
('Consent to Release Information', true, 'compliance', 'intake', 'Signed consent for data sharing'),
('Rights and Responsibilities', true, 'compliance', 'intake', 'Signed acknowledgement of client rights'),
('Individual Service Plan (ISP)', true, 'employment', 'planning', 'The roadmap for employment services'),
('Medical Clearance', false, 'medical', 'service_delivery', 'Clearance for physical labor if applicable'),
('Resume', false, 'employment', 'service_delivery', 'Client resume (draft or final)')
ON CONFLICT (name, stage) DO NOTHING;


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
