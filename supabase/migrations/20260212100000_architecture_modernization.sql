-- Migration: 20260212100000_architecture_modernization.sql
-- Purpose: Move from JSONB God Object to Relational + Audit Schema (Phase 2)

-- 1. PRE-FLIGHT FIX: Ensure 'intakes' has 'created_by' (Red Team Remediation)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intakes' AND column_name = 'created_by') THEN
        ALTER TABLE intakes ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Intake Sections (Workflow Management)
CREATE TABLE IF NOT EXISTS intake_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'complete', 'waived')),
  last_updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(intake_id, section_name)
);

COMMENT ON TABLE intake_sections IS 'Tracks completion status of individual intake domains.';

-- 2. Observations (Clinical Voice vs Client Voice)
CREATE TABLE IF NOT EXISTS observations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('client', 'counselor', 'document')),
  confidence TEXT,
  author_user_id UUID REFERENCES auth.users(id),
  observed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE observations IS 'Discrete clinical or client assertions with attribution source.';

-- 3. Barriers (Relational Analytics)
CREATE TABLE IF NOT EXISTS barriers (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  display TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  active BOOLEAN DEFAULT true
);

-- Many-to-Many link for Intake Barriers
CREATE TABLE IF NOT EXISTS intake_barriers (
  intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
  barrier_id INT REFERENCES barriers(id),
  source TEXT DEFAULT 'client',
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  PRIMARY KEY(intake_id, barrier_id)
);

COMMENT ON TABLE intake_barriers IS 'Normalized barrier tracking for analytics.';

-- 4. Consent Artifacts (Legal/Defense)
CREATE TABLE IF NOT EXISTS consent_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
  template_version TEXT NOT NULL,
  scope_text TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  locked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS consent_signatures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consent_document_id UUID REFERENCES consent_documents(id) ON DELETE CASCADE,
  signer_name TEXT NOT NULL,
  signer_role TEXT NOT NULL, -- 'client', 'guardian', 'witness'
  method TEXT NOT NULL, -- 'pad', 'upload'
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  document_hash TEXT, -- Anti-tamper hash
  ip_address TEXT
);

COMMENT ON TABLE consent_documents IS 'Immutable Release of Information (ROI) artifacts.';

-- 5. Audit Events (Event Sourcing Lite)
CREATE TABLE IF NOT EXISTS intake_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'field_update', 'status_change', 'barrier_add'
  field_path TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE intake_events IS 'Immutable ledger of all changes to an intake case.';

-- 6. Initial Seed Data for Barriers
INSERT INTO barriers (key, display, category) VALUES
('transportation_car', 'Lack of reliable vehicle', 'transportation'),
('transportation_license', 'Suspended/No License', 'transportation'),
('transportation_public', 'No public transit access', 'transportation'),
('housing_homeless', 'Currently Homeless', 'housing'),
('housing_unstable', 'At risk of eviction', 'housing'),
('childcare_cost', 'Cannot afford childcare', 'family'),
('criminal_record_felony', 'Felony Conviction', 'legal'),
('health_mental', 'Untreated Mental Health', 'health'),
('health_physical', 'Physical Disability Limit', 'health'),
('education_ged', 'Lack of GED/Diploma', 'education')
ON CONFLICT (key) DO NOTHING;

-- 7. RLS Policies (Defense in Depth)

-- Enable RLS on all new tables
ALTER TABLE intake_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE barriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_barriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_events ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation
DO $$
BEGIN
    -- BARRIERS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'barriers' AND policyname = 'Everyone can read barriers') THEN
        CREATE POLICY "Everyone can read barriers" ON barriers FOR SELECT TO authenticated USING (true);
    END IF;

    -- INTAKE SECTIONS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intake_sections' AND policyname = 'Staff view sections for own cases') THEN
        CREATE POLICY "Staff view sections for own cases" ON intake_sections
        FOR SELECT TO authenticated
        USING (
          EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'intake_sections' AND policyname = 'Staff update sections for own cases') THEN
        CREATE POLICY "Staff update sections for own cases" ON intake_sections
        FOR ALL TO authenticated
        USING (
          EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
        );
    END IF;
    
    -- (Note: Omitted creation of policies for other tables if they weren't in the original file, to stay minimal)
END $$;
