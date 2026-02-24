-- Migration: 20260212220000_foundation_refactor.sql
-- Blueprint Sprint 1: Foundation Refactor (Identity & Consent)

-- 1. Intake Identity (Promoting JSONB to Relational)
-- This table stores critical identity data as first-class columns.
CREATE TABLE IF NOT EXISTS intake_identity (
  intake_id UUID PRIMARY KEY REFERENCES intakes(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  dob DATE,
  ssn_last_four TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE intake_identity IS 'Normalized identity data, promoted from JSONB for integrity.';

-- 2. RLS for Intake Identity
ALTER TABLE intake_identity ENABLE ROW LEVEL SECURITY;

-- Staff can view identity for their own cases or if they are admins/supervisors
CREATE POLICY "Staff view identity for own cases" ON intake_identity
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
);

-- Staff can update identity for their own cases
CREATE POLICY "Staff update identity for own cases" ON intake_identity
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
);

-- 3. Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_intake_identity_names ON intake_identity(last_name, first_name);
