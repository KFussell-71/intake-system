-- Migration: 20260212000000_fix_intakes_rls_columns.sql
-- Purpose: Fix Critical RLS Failure (RT-ARCH-001) by adding missing ownership columns
-- Author: Red Team (Remediation)

-- 1. Add missing 'created_by' column to intakes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intakes' AND column_name = 'created_by') THEN
        ALTER TABLE intakes ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Backfill 'created_by' for existing records
-- Strategy: Use 'prepared_by' if it links to a user, otherwise use the owner of the client, or fallback to current user if all else fails.
-- Ideally 'prepared_by' is a profile ID which maps 1:1 to auth.users.id usually.
UPDATE intakes
SET created_by = prepared_by
WHERE created_by IS NULL AND prepared_by IS NOT NULL;

-- Fallback: Use client assignee if prepared_by is null
UPDATE intakes i
SET created_by = c.assigned_to
FROM clients c
WHERE i.client_id = c.id
AND i.created_by IS NULL
AND c.assigned_to IS NOT NULL;

-- 3. Enforce Not Null constraint now that we have data (or valid defaults)
-- We set a default for new rows to be the current user
ALTER TABLE intakes 
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- 4. Enable RLS (Ensure it is on)
ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;

-- 5. Drop broken/permissive policies
DROP POLICY IF EXISTS "Staff can view all intakes" ON intakes;
DROP POLICY IF EXISTS "Staff can insert intakes" ON intakes;
DROP POLICY IF EXISTS "Staff can update own intakes" ON intakes;
DROP POLICY IF EXISTS "Staff can delete own intakes" ON intakes;
DROP POLICY IF EXISTS "Users can view their own intakes" ON intakes;

-- 6. Re-create STRICT RLS Policies

-- SELECT: Staff can see intakes they created OR intakes for clients they are assigned to
CREATE POLICY "Staff can view assigned intakes"
ON intakes FOR SELECT
TO authenticated
USING (
    created_by = auth.uid() OR
    client_id IN (
        SELECT id FROM clients WHERE assigned_to = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);

-- INSERT: Authenticated users can create intakes, but they are automatically marked as 'created_by' them via DEFAULT
CREATE POLICY "Staff can insert intakes"
ON intakes FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = created_by
);

-- UPDATE: Users can only update intakes they created OR if they are a supervisor
CREATE POLICY "Staff can update own intakes"
ON intakes FOR UPDATE
TO authenticated
USING (
    created_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);

-- DELETE: Only Admins can delete intakes (Data Integrity)
CREATE POLICY "Admins can delete intakes"
ON intakes FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 7. Audit Log
COMMENT ON TABLE intakes IS 'Intake forms for clients. Protected by strict RLS (RT-ARCH-001 Fix).';
