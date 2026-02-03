-- Phase 36: Supervision & Command
-- Created: 2026-02-03
-- Purpose: Add Supervision Notes and SLA tracking support

-- 1. Supervision Notes (The "Back and Forth")
CREATE TABLE IF NOT EXISTS intake_supervision_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES profiles(id) DEFAULT auth.uid(),
    
    note_type TEXT CHECK (note_type IN ('approval', 'rejection', 'correction_request', 'flag')),
    content TEXT, -- Rationale or instructions
    required_actions TEXT[], -- Specific checklist of fixes for the counselor
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SLA Support
-- Adding explicit timestamp for when the ball entered the "Supervisor's Court"
ALTER TABLE intakes 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- 3. RLS Policies
ALTER TABLE intake_supervision_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Supervisors can do everything
CREATE POLICY "Supervisors Manage Supervision Notes"
ON intake_supervision_notes
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('supervisor', 'admin')
    )
);

-- Policy: Staff can read notes for their own intakes (to see corrections)
CREATE POLICY "Staff Read Supervision Notes"
ON intake_supervision_notes
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM intakes 
        WHERE intakes.id = intake_supervision_notes.intake_id
        AND intakes.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('supervisor', 'admin')
    )
);

-- Comments
COMMENT ON TABLE intake_supervision_notes IS 'Audit log of supervisor actions and feedback loops.';
COMMENT ON COLUMN intake_supervision_notes.required_actions IS 'Array of specific fixes (e.g., "Verify Income", "Fix Typos") required for approval.';
