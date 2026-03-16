-- Migration: 20260207_rls_hardening
-- Description: Creates missing intake_versions table and standardizes strict RLS policies across clinical entities.

-- 1. Create intake_versions table (Missing from previous phase)
CREATE TABLE IF NOT EXISTS intake_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE intake_versions ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for intake_versions
-- View: Staff can view versions for clients they are assigned to
DROP POLICY IF EXISTS "Staff view assigned intake versions" ON intake_versions;
CREATE POLICY "Staff view assigned intake versions" ON intake_versions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM intakes
    JOIN clients ON clients.id = intakes.client_id
    WHERE intakes.id = intake_versions.intake_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- Insert: Staff can insert versions for assigned intakes (used by RPC)
DROP POLICY IF EXISTS "Staff insert assigned intake versions" ON intake_versions;
CREATE POLICY "Staff insert assigned intake versions" ON intake_versions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM intakes
    JOIN clients ON clients.id = intakes.client_id
    WHERE intakes.id = intake_versions.intake_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- 4. Harden intake_assessments (Ensure no updates/deletes except via owner/admin)
DROP POLICY IF EXISTS "Counselors can update own assessments" ON intake_assessments;
CREATE POLICY "Counselors can update own assessments" ON intake_assessments
  FOR UPDATE TO authenticated
  USING (counselor_id = auth.uid() AND is_locked = false)
  WITH CHECK (counselor_id = auth.uid() AND is_locked = false);

-- 5. Harden Audit Logs (Double check immutability)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'prevent_audit_update'
    ) THEN
        CREATE TRIGGER prevent_audit_update
        BEFORE UPDATE ON audit_logs
        FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
    END IF;
END $$;

-- 6. Indexes for RLS Performance
CREATE INDEX IF NOT EXISTS idx_intake_versions_intake_id ON intake_versions(intake_id);
CREATE INDEX IF NOT EXISTS idx_intake_assessments_intake_id ON intake_assessments(intake_id);

-- 7. Comments for clarity
COMMENT ON TABLE intake_versions IS 'Immutable history of intake data changes for HIPAA event-sourcing.';
COMMENT ON POLICY "Staff view assigned intake versions" ON intake_versions IS 'Restricts version history access to assigned staff only.';
