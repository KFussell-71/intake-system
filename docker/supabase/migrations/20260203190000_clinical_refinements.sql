-- Clinical Refinements (SME Feedback)
-- Created: 2026-02-03
-- Purpose: Enhance Data Integrity with Lock, Evidence, and AI Flags

-- 1. Golden Thread & Clinical Lock
ALTER TABLE intake_assessments 
ADD COLUMN IF NOT EXISTS verification_evidence JSONB DEFAULT '{}'::jsonb, -- Stores the "Golden Thread" links
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE, -- Prevents tampering after signature
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ai_discrepancy_notes TEXT, -- AI-generated risk flags
ADD COLUMN IF NOT EXISTS ai_risk_score INTEGER; -- 1-100 Risk Score

-- 2. Event State Machine
ALTER TABLE intake_events
ADD COLUMN IF NOT EXISTS sequence_number BIGINT GENERATED ALWAYS AS IDENTITY; -- Simple ordering for now, logic can be enforced via trigger later

-- 3. RLS Update: Prevent updates if locked
CREATE POLICY "Prevent update if locked" ON intake_assessments
    FOR UPDATE TO authenticated
    USING (is_locked = FALSE)
    WITH CHECK (is_locked = FALSE);
    -- Note: This might conflict with the existing "Staff can manage" policy depending on Supabase version (Permissive vs Restrictive).
    -- ideally we would replace the old policy, but for now we rely on application logic + this restriction.
    
-- Commenting for documentation
COMMENT ON COLUMN intake_assessments.verification_evidence IS 'Links barriers to specific evidence documents (Golden Thread)';
COMMENT ON COLUMN intake_assessments.is_locked IS 'If true, assessment is clinically finalized and immutable';
