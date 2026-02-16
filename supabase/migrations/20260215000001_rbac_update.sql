-- Migration: 20260215_rbac_update
-- Description: Updates profiles table to support 'supervisor' and 'auditor' roles.

-- 1. Drop existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2. Add updated check constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('staff', 'supervisor', 'admin', 'auditor'));

-- 3. ensure new roles exist (if using a separate lookup table, but we use ENUM/Check)

-- 4. Create Policy for Supervisors to view all profiles (to assign work)
CREATE POLICY "Supervisors can view all profiles" ON profiles
FOR SELECT TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor')
);
