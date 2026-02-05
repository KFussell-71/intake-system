-- MAINTAINABILITY REMEDIATION: Extracted RLS Logic
-- Reusable function to check if a user is assigned to a client or is a supervisor/admin

CREATE OR REPLACE FUNCTION is_assigned_worker(p_client_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM client_assignments 
        WHERE client_id = p_client_id 
        AND assigned_worker_id = auth.uid()
        AND active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to existing tables
DROP POLICY IF EXISTS "Staff can view assigned employment_prep" ON employment_prep;
CREATE POLICY "Staff can view assigned employment_prep" ON employment_prep 
FOR SELECT TO authenticated USING (is_assigned_worker(client_id));

DROP POLICY IF EXISTS "Staff can manage assigned employment_prep" ON employment_prep;
CREATE POLICY "Staff can manage assigned employment_prep" ON employment_prep 
FOR ALL TO authenticated USING (is_assigned_worker(client_id));

DROP POLICY IF EXISTS "Staff can view assigned retention_contacts" ON retention_contacts;
CREATE POLICY "Staff can view assigned retention_contacts" ON retention_contacts 
FOR SELECT TO authenticated USING (is_assigned_worker(client_id));

DROP POLICY IF EXISTS "Staff can manage assigned retention_contacts" ON retention_contacts;
CREATE POLICY "Staff can manage assigned retention_contacts" ON retention_contacts 
FOR ALL TO authenticated USING (is_assigned_worker(client_id));
