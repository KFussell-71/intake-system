-- Trust Machine Migration
-- Relational-First Architecture Overhaul
-- Date: 2026-02-11

-- 1. Section Status Tracking
CREATE TABLE IF NOT EXISTS intake_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started','in_progress','complete','waived')),
  last_updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(intake_id, section_name)
);

-- 2. Formal Identity Table (PII Domain)
CREATE TABLE IF NOT EXISTS intake_identity (
  intake_id UUID PRIMARY KEY REFERENCES intakes(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  ssn_last_four TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gender TEXT,
  race TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Observations (Explicit Clinical Voice)
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('client','counselor','document')),
  confidence TEXT,
  author_user_id UUID,
  observed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Barriers (Master Record & Normalization)
CREATE TABLE IF NOT EXISTS barriers (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  display TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS intake_barriers (
  intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
  barrier_id INT REFERENCES barriers(id),
  source TEXT DEFAULT 'client',
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (intake_id, barrier_id)
);

-- 5. Consent & ROI Documents
CREATE TABLE IF NOT EXISTS consent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
  template_version TEXT NOT NULL,
  scope_text TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  locked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS consent_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_document_id UUID REFERENCES consent_documents(id) ON DELETE CASCADE,
  signer_name TEXT,
  signer_role TEXT,
  method TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  document_hash TEXT
);

-- 6. Audit Trail (The Ledger)
CREATE TABLE IF NOT EXISTS intake_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  event_type TEXT,
  field_path TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Initial Seed Data: Barriers
INSERT INTO barriers (key, display) VALUES
('anxiety', 'Anxiety'),
('transportation', 'Transportation'),
('housing', 'Housing Instability'),
('vision', 'Vision'),
('hearing', 'Hearing'),
('childcare', 'Childcare'),
('legal', 'Legal History'),
('education', 'Education Access')
ON CONFLICT (key) DO NOTHING;
