-- BLUE TEAM REMEDIATION: RED-2026-001
-- Description: Restrict intake updates to record owner only.
-- Date: 2026-02-06

BEGIN;

-- 1. Drop the over-permissive policy
DROP POLICY IF EXISTS "Staff can update intakes" ON intakes;
DROP POLICY IF EXISTS "Staff can update own intakes" ON intakes; -- Sanity check on old naming

-- 2. Create the strict policy (Least Privilege)
CREATE POLICY "Staff can update own intakes"
ON intakes FOR UPDATE
TO authenticated
USING (public.current_user_id() = prepared_by);

-- 3. Audit Comment (Compliance)
COMMENT ON POLICY "Staff can update own intakes" ON intakes IS 
'CONTRACT: Strict Update access. Only the creator (prepared_by) can modify an intake. Prevents lateral movement.';

COMMIT;
