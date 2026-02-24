-- Migration: Intake Event-Sourcing (Version History)
-- Date: 2026-02-04
-- Author: AntiGravity SME Fixes

-- 1. Create Intake Versions Table
-- This table stores a full snapshot of the intake data every time it is saved.
CREATE TABLE IF NOT EXISTS intake_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    version_number INTEGER NOT NULL,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    change_summary TEXT -- Optional note about what changed
);

-- 2. Add composite index for performance
CREATE INDEX IF NOT EXISTS idx_intake_versions_intake_id ON intake_versions(intake_id);

-- 3. Trigger Function to automatically increment version number
CREATE OR REPLACE FUNCTION get_next_intake_version() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.version_number := (
        SELECT COALESCE(MAX(version_number), 0) + 1 
        FROM intake_versions 
        WHERE intake_id = NEW.intake_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_intake_version
BEFORE INSERT ON intake_versions
FOR EACH ROW EXECUTE FUNCTION get_next_intake_version();

-- 4. Enable RLS
ALTER TABLE intake_versions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Use the same visibility as the main intakes table
CREATE POLICY "Staff can view versions of assigned intakes" ON intake_versions 
FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM intakes i
        JOIN client_assignments ca ON i.client_id = ca.client_id
        WHERE i.id = intake_versions.intake_id
        AND ca.assigned_worker_id = auth.uid()
        AND ca.active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);

-- Note: We want creators (intake workers) to be able to insert versions
CREATE POLICY "Staff can insert versions of assigned intakes" ON intake_versions 
FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM intakes i
        JOIN client_assignments ca ON i.client_id = ca.client_id
        WHERE i.id = NEW.intake_id
        AND ca.assigned_worker_id = auth.uid()
        AND ca.active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);
