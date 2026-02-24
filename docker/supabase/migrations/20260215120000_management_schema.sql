-- Migration: 20260215_management_schema
-- Description: Adds schema support for Management Control features (Paperwork Debt, Exits).

-- 1. Add estimated_exit_date to cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS estimated_exit_date DATE;

-- 2. Required Documents Configuration
-- Defines what documents are needed for each stage/program.
CREATE TABLE IF NOT EXISTS required_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    stage TEXT NOT NULL CHECK (stage IN ('intake', 'assessment', 'planning', 'service_delivery', 'review', 'exit')),
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some default required documents
INSERT INTO required_documents (name, stage, description)
VALUES 
    ('Proof of Eligibility', 'intake', 'Income verification or referral form'),
    ('Consent to Release Information', 'intake', 'Signed ROI form'),
    ('Comprehensive Assessment', 'assessment', 'Full needs assessment'),
    ('Individual Service Plan', 'planning', 'Signed ISP'),
    ('Exit Summary', 'exit', 'Final case summary and outcomes')
ON CONFLICT DO NOTHING; -- No unique constraint on name/stage yet, so this might duplicate if run multiple times without one. 
-- Let's add a unique constraint to be safe for idempotency.
ALTER TABLE required_documents ADD CONSTRAINT unique_doc_name_stage UNIQUE (name, stage);


-- 3. Case Documents
-- Tracks documents uploaded for a specific case.
CREATE TABLE IF NOT EXISTS case_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    required_doc_id UUID REFERENCES required_documents(id), -- Link to requirement if applicable
    name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in Storage Bucket
    uploaded_by UUID REFERENCES profiles(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_case_documents_case_id ON case_documents(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_estimated_exit_date ON cases(estimated_exit_date);

-- RLS Policies
ALTER TABLE required_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

-- Required Docs: Read-only for most, Admin manages
CREATE POLICY "Everyone can view required docs" ON required_documents
    FOR SELECT TO authenticated
    USING (true);

-- Case Docs: View if you can view the case
CREATE POLICY "View case docs via case access" ON case_documents
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM cases WHERE cases.id = case_documents.case_id AND (
            cases.assigned_to = (SELECT auth.uid()) OR
            EXISTS (SELECT 1 FROM clients WHERE clients.id = cases.client_id AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))) OR
            (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
        ))
    );

CREATE POLICY "Upload case docs via case access" ON case_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM cases WHERE cases.id = case_documents.case_id AND (
            cases.assigned_to = (SELECT auth.uid()) OR
            EXISTS (SELECT 1 FROM clients WHERE clients.id = cases.client_id AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))) OR
            (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
        ))
    );
