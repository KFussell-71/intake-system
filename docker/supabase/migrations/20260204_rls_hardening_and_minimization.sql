-- BLUE TEAM REMEDIATION: RT-SEC-003, RT-SEC-004, RT-DATA-001
-- Final Hardening for Storage, Notifications, and Client Views

-- 1. [RT-SEC-003] Tighten Storage DELETE Policy
-- Ensures only assigned staff or admins can delete documents
DROP POLICY IF EXISTS "Staff can delete storage" ON storage.objects;
CREATE POLICY "Staff can delete storage" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'client-documents' 
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN clients c ON c.id = d.client_id
    WHERE d.url LIKE '%' || storage.objects.name
    AND (c.assigned_to = auth.uid() OR c.created_by = auth.uid())
  )
  OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('supervisor', 'admin')
);

-- 2. [RT-SEC-004] Tighten Notifications SELECT Policy
-- Ensures staff only see notifications for their assigned clients or themselves
DROP POLICY IF EXISTS "Staff can view all notifications" ON notifications;
CREATE POLICY "Staff can view notifications" ON notifications
FOR SELECT TO authenticated
USING (
  client_id IS NULL -- System-wide or unlinked
  OR EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = notifications.client_id
    AND (c.assigned_to = auth.uid() OR c.created_by = auth.uid())
  )
  OR staff_id = auth.uid()
  OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('supervisor', 'admin')
);

-- 3. [RT-DATA-001] Secure Client View (Data Minimization)
-- Masks SSN and provides a safe interface for bulk listing
CREATE OR REPLACE VIEW secure_client_summary AS
SELECT 
    id, 
    name, 
    email, 
    phone, 
    status,
    assigned_to, 
    created_at,
    CASE 
        WHEN (SELECT role FROM profiles WHERE id = auth.uid()) IN ('supervisor', 'admin') THEN ssn_last_four
        ELSE '****' 
    END AS masked_ssn
FROM clients
WHERE 
    assigned_to = auth.uid() 
    OR created_by = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('supervisor', 'admin');

GRANT SELECT ON secure_client_summary TO authenticated;
