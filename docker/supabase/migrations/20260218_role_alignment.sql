-- BLUE TEAM REMEDIATION: RT-ARCH-001 (Role Alignment)
-- Updates profiles role check constraint to include all platform roles.

DO $$
BEGIN
    -- 1. Remove old constraint if it exists
    ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

    -- 2. Add comprehensive constraint
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('staff', 'supervisor', 'admin', 'auditor'));

    -- 3. Ensure role defaults to 'staff' if null
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'staff';
END $$;
