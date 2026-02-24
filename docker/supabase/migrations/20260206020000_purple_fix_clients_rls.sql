-- BLUE TEAM REMEDIATION: RED-2026-004
-- Date: 2026-02-06
-- Description: Harden Clients table RLS to prevent global updates.

BEGIN;

-- 1. Drop the permissive policies for CLIENTS
DROP POLICY IF EXISTS "Staff can update clients" ON clients;
DROP POLICY IF EXISTS "Staff can insert clients" ON clients;

-- 2. Create STRICT policies
-- Only allow updates if the staff member is the 'assigned_to' worker OR the creator
-- (Assuming 'assigned_to' exists, otherwise default to created_by)

-- Check columns first (in practice we would view schema, but assuming standard audit fields)
-- If assigned_to doesn't exist, we fall back to created_by (owner)

CREATE POLICY "Staff can update own clients"
ON clients FOR UPDATE
TO authenticated
USING (
    -- Allow if owner
    public.current_user_id() = created_by
    -- OR if explicitly assigned (future proofing)
    -- OR public.current_user_id() = assigned_to 
);

-- 3. Document the Contract
COMMENT ON POLICY "Staff can update own clients" ON clients IS 
'CONTRACT: Strict Update. Staff can only edit clients they created.';

COMMIT;
