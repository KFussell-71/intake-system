-- Migration: User Management & Enhanced Roles
-- Date: 2026-02-04
-- Author: AntiGravity

-- 1. Update Profiles Table
-- Add identifying information to profiles for team management
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update Role Constraints
-- First, drop the existing check constraint on 'role'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with expanded roles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'supervisor', 'specialist', 'intake_worker'));

-- 3. Sync Email Trigger
-- Ensure email in profiles stays in sync with auth.users (optional but good practice)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'intake_worker') -- Default role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We assume the existing trigger 'on_auth_user_created' calls this function.
-- If not, we would create it here. 
-- For safety, let's make sure the Policy allows supervisors to view all profiles
-- so they can see their team list.

CREATE POLICY "Supervisors can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
  auth.uid() = id -- User can see themselves
  OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'supervisor')) -- Supervisors see everyone
);

-- Allow supervisors to update roles (strictly controlled via RLS or logic)
-- Ideally, role updates should be done via a Secure Server Action (bypass RLS), 
-- rather than opening up RLS for updates. We will stick to Server Actions for updates.
