-- Migration: 20260216200000_fix_clients_rls_recursion.sql
-- Description: Breaks infinite recursion between clients and client_users RLS policies.

BEGIN;

-- 1. Fix client_users policies (Removing dependency on 'clients' table)
DROP POLICY IF EXISTS "Staff can view assigned client_users" ON client_users;
DROP POLICY IF EXISTS "Staff can invite assigned clients" ON client_users;
DROP POLICY IF EXISTS "Staff can revoke assigned client access" ON client_users;

-- New non-recursive policies for client_users
CREATE POLICY "Staff can view assigned client_users" ON client_users
    FOR SELECT TO authenticated
    USING (
        invited_by = auth.uid()
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
    );

CREATE POLICY "Staff can invite assigned clients" ON client_users
    FOR INSERT TO authenticated
    WITH CHECK (
        invited_by = auth.uid()
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
    );

CREATE POLICY "Staff can revoke assigned client access" ON client_users
    FOR UPDATE TO authenticated
    USING (
        invited_by = auth.uid()
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
    );


-- 2. Fix clients policies (Ensuring non-recursive selection)
DROP POLICY IF EXISTS "Portal clients can view own client record" ON clients;
DROP POLICY IF EXISTS "Authenticated can view all clients" ON clients; -- Drop any permissive ones

CREATE POLICY "Portal clients can view own client record" ON clients
    FOR SELECT TO authenticated
    USING (
        id IN (SELECT client_id FROM client_users WHERE id = auth.uid())
    );

-- Ensure staff can see their own clients without recursion
DROP POLICY IF EXISTS "Staff can view own clients" ON clients;
CREATE POLICY "Staff can view assigned clients" ON clients
    FOR SELECT TO authenticated
    USING (
        assigned_to = auth.uid() 
        OR created_by = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
    );

COMMIT;
