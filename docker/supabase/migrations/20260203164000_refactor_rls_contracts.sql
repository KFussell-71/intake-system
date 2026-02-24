-- Refactor RLS Policies & Add Contracts
-- Created: 2026-02-03
-- Purpose: Standardize RLS using public.current_user_id() and document intent via comments

-- CLIENTS TABLE
DROP POLICY IF EXISTS "Staff can view all clients" ON clients;
CREATE POLICY "Staff can view all clients"
ON clients FOR SELECT
TO authenticated
USING (true); -- Staff can view all, stricter rules could be added later
COMMENT ON POLICY "Staff can view all clients" ON clients IS 
'CONTRACT: Authenticated staff (roles: authenticated) must be able to view ALL client records for intake and review purposes.';

DROP POLICY IF EXISTS "Staff can insert clients" ON clients;
CREATE POLICY "Staff can insert clients"
ON clients FOR INSERT
TO authenticated
WITH CHECK (true);
COMMENT ON POLICY "Staff can insert clients" ON clients IS 
'CONTRACT: Any staff member can onboard a new client.';

DROP POLICY IF EXISTS "Staff can update clients" ON clients;
CREATE POLICY "Staff can update clients"
ON clients FOR UPDATE
TO authenticated
USING (true);
COMMENT ON POLICY "Staff can update clients" ON clients IS 
'CONTRACT: Full edit access for staff. Future: Limit to assigned_to or supervisor.';

-- INTAKES TABLE
DROP POLICY IF EXISTS "Staff can view all intakes" ON intakes;
CREATE POLICY "Staff can view all intakes"
ON intakes FOR SELECT
TO authenticated
USING (true);
COMMENT ON POLICY "Staff can view all intakes" ON intakes IS 
'CONTRACT: Intakes are visible to all staff for collaboration.';

DROP POLICY IF EXISTS "Staff can insert intakes" ON intakes;
CREATE POLICY "Staff can insert intakes"
ON intakes FOR INSERT
TO authenticated
WITH CHECK (public.current_user_id() = prepared_by);
COMMENT ON POLICY "Staff can insert intakes" ON intakes IS 
'CONTRACT: Staff can only create intakes attributed to themselves (prepared_by matches auth).';

DROP POLICY IF EXISTS "Staff can update own intakes" ON intakes;
CREATE POLICY "Staff can update intakes"
ON intakes FOR UPDATE
TO authenticated
USING (true); -- Simplified for now, was "own", but supervisors need access
COMMENT ON POLICY "Staff can update intakes" ON intakes IS 
'CONTRACT: Staff can edit intakes. Future: restricted to owner or supervisor.';

-- DOCUMENTS TABLE
DROP POLICY IF EXISTS "Authenticated users can read documents" ON documents; -- (If exists from previous migration names)
DROP POLICY IF EXISTS "Staff can view documents" ON documents;

CREATE POLICY "Staff can view documents"
ON documents FOR SELECT
TO authenticated
USING (true);
COMMENT ON POLICY "Staff can view documents" ON documents IS 
'CONTRACT: All documents are shared resources among staff.';

DROP POLICY IF EXISTS "Authenticated users can upload documents" ON documents;
DROP POLICY IF EXISTS "Staff can upload documents" ON documents;
CREATE POLICY "Staff can upload documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (public.current_user_id() = uploaded_by);
COMMENT ON POLICY "Staff can upload documents" ON documents IS 
'CONTRACT: Uploads must be attributed to the authenticated user.';

-- NOTE: Storage policies remain in storage.objects, this affects the 'documents' metadata table interaction.
