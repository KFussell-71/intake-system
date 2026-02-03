-- Fix Database Linter Warnings
-- Created: 2026-02-03
-- Purpose: Address function search_path mutability and permissive RLS policies

-- ============================================================================
-- 1. FIX FUNCTION SEARCH PATHS (Security Best Practice)
-- ============================================================================

ALTER FUNCTION public.mask_ssn(text) SET search_path = public;
ALTER FUNCTION public.can_view_full_ssn() SET search_path = public;
ALTER FUNCTION public.is_supervisor_or_admin() SET search_path = public;
ALTER FUNCTION public.log_ssn_access() SET search_path = public;
ALTER FUNCTION public.revoke_expired_portal_access() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_client_intake_bundle(uuid) SET search_path = public;
ALTER FUNCTION public.prevent_audit_modification() SET search_path = public;
ALTER FUNCTION public.archive_old_audit_logs() SET search_path = public;
ALTER FUNCTION public.verify_audit_log_integrity() SET search_path = public;

-- create_client_intake has a complex signature, we alter it carefully using name
ALTER FUNCTION public.create_client_intake(text, text, text, text, character, date, date, jsonb) SET search_path = public;


-- ============================================================================
-- 2. FIX PERMISSIVE RLS POLICIES
-- ============================================================================

-- A. Report Reviews (Prevent Portal/Public Access)
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Staff can view report_reviews" ON report_reviews;
DROP POLICY IF EXISTS "Staff can manage report_reviews" ON report_reviews;
DROP POLICY IF EXISTS "Deny portal access to report_reviews" ON report_reviews; -- Consolidating into 'Staff' policies

-- Create strict policies (Staff Only)
CREATE POLICY "Staff can view report_reviews" ON report_reviews
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Staff can manage report_reviews" ON report_reviews
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()));


-- B. Notifications (Prevent Spoofing)
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Only staff users can create notifications (system creates via service role which bypasses RLS)
CREATE POLICY "Staff can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid()));


-- C. Audit Logs (Enforce Authorship)
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can record audit logs" ON audit_logs; -- Ensure no duplicates

-- Only allow inserting logs where user_id matches the authenticated user
CREATE POLICY "Authenticated can insert audit logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
