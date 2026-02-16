-- RLS Helper Functions
-- Created: 2026-02-03
-- Purpose: Standardize identity checks for RLS policies

-- 1. current_user_id()
-- Wraps auth.uid() but handles potential nulls gracefully if needed (though auth.uid() is standard)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid();
$$;

-- 2. current_user_role()
-- Returns the JWT role (authenticated, anon, service_role)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'role')::text;
$$;

-- 3. current_user_email()
-- Returns email from JWT
CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'email')::text;
$$;

COMMENT ON FUNCTION public.current_user_id IS 'Standardized wrapper for auth.uid()';
COMMENT ON FUNCTION public.current_user_role IS 'Extracts role from JWT';
COMMENT ON FUNCTION public.current_user_email IS 'Extracts email from JWT';
