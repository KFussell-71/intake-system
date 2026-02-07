-- ============================================================================
-- CASE MANAGEMENT MIGRATION: Client Profile & Case Notes
-- ============================================================================
-- Date: 2026-02-06
-- Purpose: Add support for longitudinal case management, specifically Case Notes.
-- ============================================================================

-- 1. Create case_notes table
CREATE TABLE IF NOT EXISTS case_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    
    -- Note Content
    type TEXT NOT NULL CHECK (type IN ('general', 'clinical', 'incident', 'administrative')),
    content TEXT NOT NULL,
    is_draft BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX idx_case_notes_client_id ON case_notes(client_id);
CREATE INDEX idx_case_notes_created_at ON case_notes(created_at DESC);

-- 3. Enable RLS
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (Mirroring existing Client isolation)

-- Staff can view notes for assigned clients
CREATE POLICY "Staff can view assigned case_notes" ON case_notes
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM clients 
        WHERE clients.id = case_notes.client_id 
        AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
    ));

-- Staff can create notes for assigned clients
CREATE POLICY "Staff can create case_notes" ON case_notes
    FOR INSERT TO authenticated
    WITH CHECK (
        -- User must be the author
        auth.uid() = author_id
        AND
        -- Client must be assigned
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = case_notes.client_id 
            AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
        )
    );

-- Authors can update their own drafts (but not finalized notes, implementing "Clinical Lock")
CREATE POLICY "Authors can update draft notes" ON case_notes
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = author_id 
        AND is_draft = true
    )
    WITH CHECK (
        auth.uid() = author_id 
        AND is_draft = true
    );

-- Supervisors/Admins can view ALL notes (Audit capability)
CREATE POLICY "Admins can view all case_notes" ON case_notes
    FOR SELECT TO authenticated
    USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
    );

-- 5. Audit Log Trigger
-- Reuse existing audit logic if possible, or simple insert
-- (Assuming application handles audit for now, but good to add trigger later if needed)
