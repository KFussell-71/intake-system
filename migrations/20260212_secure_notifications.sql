-- Migration: 20260212_secure_notifications
-- Description: Adds RLS policies for Portal Users to access notifications

-- 1. Allow Portal Users to view their own notifications
CREATE POLICY "Portal users can view own notifications" ON notifications
FOR SELECT TO authenticated
USING (
  client_id IN (
    SELECT client_id FROM client_users WHERE id = auth.uid()
  )
);

-- 2. Allow Portal Users to mark notifications as read (UPDATE)
CREATE POLICY "Portal users can update own notifications" ON notifications
FOR UPDATE TO authenticated
USING (
  client_id IN (
    SELECT client_id FROM client_users WHERE id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT client_id FROM client_users WHERE id = auth.uid()
  )
);
