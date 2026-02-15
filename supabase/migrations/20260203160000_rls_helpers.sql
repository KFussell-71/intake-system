-- RLS Helper Functions
-- Created: 2026-02-03
-- Purpose: Standardize identity checks for RLS policies

-- 1. auth.current_user_id()
-- Wraps auth.uid() but handles potential nulls gracefully if needed (though auth.uid() is standard)
-- Main benefit: semantic clarity and potential for injection verification in future
-- CREATE OR REPLACE FUNCTION auth.current_user_id()
-- RETURNS uuid
-- LANGUAGE sql
-- STABLE
-- AS $$
--   SELECT auth.uid();
-- $$;

-- 2. auth.current_user_role()
-- Returns the JWT role (authenticated, anon, service_role)
CREATE OR REPLACE FUNCTION auth.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'role')::text;
$$;

-- 3. auth.email()
-- Returns email from JWT
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'email')::text;
$$;

COMMENT ON FUNCTION auth.current_user_id IS 'Standardized wrapper for auth.uid()';
COMMENT ON FUNCTION auth.current_user_role IS 'Extracts role from JWT';
COMMENT ON FUNCTION auth.email IS 'Extracts email from JWT';
