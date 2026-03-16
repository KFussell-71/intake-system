-- Migration: 20260217010000_clinical_notes
-- Description: Adds structured clinical notes with SOAP/DAP support and immutability.

CREATE TYPE clinical_note_purpose AS ENUM ('initial_assessment', 'routine_follow_up');
CREATE TYPE clinical_template_type AS ENUM ('SOAP', 'DAP');

CREATE TABLE IF NOT EXISTS clinical_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Metadata
    purpose clinical_note_purpose NOT NULL,
    template_type clinical_template_type NOT NULL,
    is_finalized BOOLEAN DEFAULT false,
    finalized_at TIMESTAMPTZ,
    signature TEXT, -- Base64 encoded signature
    parent_note_id UUID REFERENCES clinical_notes(id), -- For Addendums
    
    -- SOAP Fields
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    
    -- DAP Fields
    data_narrative TEXT,
    assessment_narrative TEXT,
    plan_narrative TEXT,
    
    -- Flexible/Common Data
    extra_data JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_notes_client_id ON clinical_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_author_id ON clinical_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created_at ON clinical_notes(created_at DESC);

-- RLS
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view clinical notes for their clients" ON clinical_notes;
CREATE POLICY "Users can view clinical notes for their clients" ON clinical_notes
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = clinical_notes.client_id 
            AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))
        )
        OR 
        (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
    );

DROP POLICY IF EXISTS "Authors can insert clinical notes" ON clinical_notes;
CREATE POLICY "Authors can insert clinical notes" ON clinical_notes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own drafts" ON clinical_notes;
CREATE POLICY "Authors can update their own drafts" ON clinical_notes
    FOR UPDATE TO authenticated
    USING (auth.uid() = author_id AND is_finalized = false)
    WITH CHECK (auth.uid() = author_id AND is_finalized = false);

-- Trigger for updated_at
CREATE TRIGGER set_clinical_notes_updated_at
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW
    EXECUTE FUNCTION handle_case_notes_updated_at(); -- Reusing existing logic

-- COMMENT
COMMENT ON TABLE clinical_notes IS 'Structured clinical documentation supporting SOAP and DAP templates with immutability once finalized.';
