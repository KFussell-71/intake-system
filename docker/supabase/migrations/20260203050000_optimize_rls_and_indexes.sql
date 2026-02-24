-- Optimization Migration: RLS InitPlan & Duplicate Indexes
-- Created: 2026-02-03
-- Purpose: Fix auth_rls_initplan warnings and remove duplicate indexes

-- ============================================================================
-- 1. DROP DUPLICATE INDEX
-- ============================================================================
-- Keep 'idx_profiles_role' and drop 'idx_profiles_role_initial'
DROP INDEX IF EXISTS idx_profiles_role_initial;


-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES (Use cached auth.uid())
-- ============================================================================

-- A. PROFILES (Simple UID check)
DROP POLICY IF EXISTS "Staff can view own profile" ON profiles;
CREATE POLICY "Staff can view own profile" ON profiles 
  FOR SELECT TO authenticated 
  USING (id = (select auth.uid()));

-- B. CLIENTS (Consolidate View/Manage AND Optimize)
-- Drop the redundant "Staff can view" policy as "Staff can manage" covers it (FOR ALL allows SELECT)
DROP POLICY IF EXISTS "Staff can view assigned clients" ON clients;
DROP POLICY IF EXISTS "Staff can manage assigned clients" ON clients;

CREATE POLICY "Staff can manage assigned clients" ON clients 
  FOR ALL TO authenticated 
  USING (assigned_to = (select auth.uid()) OR created_by = (select auth.uid()))
  WITH CHECK (assigned_to = (select auth.uid()) OR created_by = (select auth.uid()));

-- Optimize Portal Policy
DROP POLICY IF EXISTS "Portal clients can view own client record" ON clients;
CREATE POLICY "Portal clients can view own client record" ON clients
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM client_users
    WHERE client_users.id = (select auth.uid())
    AND client_users.client_id = clients.id
    AND client_users.is_active = true
  ));

-- C. INTAKES (Consolidate & Optimize)
DROP POLICY IF EXISTS "Staff can view assigned intakes" ON intakes;
DROP POLICY IF EXISTS "Staff can manage assigned intakes" ON intakes;

CREATE POLICY "Staff can manage assigned intakes" ON intakes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = intakes.client_id 
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

-- D. TRACKING MILESTONES
DROP POLICY IF EXISTS "Staff can view assigned milestones" ON tracking_milestones;
DROP POLICY IF EXISTS "Staff can manage assigned milestones" ON tracking_milestones;

CREATE POLICY "Staff can manage assigned milestones" ON tracking_milestones
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = tracking_milestones.client_id 
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

-- E. JOB PLACEMENTS
DROP POLICY IF EXISTS "Staff can view assigned placements" ON job_placements;
DROP POLICY IF EXISTS "Staff can manage assigned placements" ON job_placements;

CREATE POLICY "Staff can manage assigned placements" ON job_placements
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = job_placements.client_id 
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

-- F. FOLLOW UPS (Distinct Actions, Optimize Calls)
-- Not combining actions here as they have distinct triggers in schema, just optimizing
DROP POLICY IF EXISTS "Staff can view assigned followups" ON follow_ups;
CREATE POLICY "Staff can view assigned followups" ON follow_ups
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Staff can update assigned followups" ON follow_ups;
CREATE POLICY "Staff can update assigned followups" ON follow_ups
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Staff can insert followups" ON follow_ups;
CREATE POLICY "Staff can insert followups" ON follow_ups
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

-- G. AUDIT LOGS
-- Note: 'Authenticated can insert audit logs' was tightly defined in previous fixes, optimizing now
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Staff can view own audit logs" ON audit_logs;
CREATE POLICY "Staff can view own audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
      user_id = (select auth.uid())
      OR
      EXISTS (
          SELECT 1 FROM profiles
          WHERE id = (select auth.uid())
          AND role IN ('supervisor', 'admin')
      )
  );

-- H. DOCUMENTS
-- Optimize Staff policies
DROP POLICY IF EXISTS "Staff can view assigned documents" ON documents;
CREATE POLICY "Staff can view assigned documents" ON documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Staff can upload assigned documents" ON documents;
CREATE POLICY "Staff can upload assigned documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

DROP POLICY IF EXISTS "Staff can delete assigned documents" ON documents;
CREATE POLICY "Staff can delete assigned documents" ON documents
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))
  ));

-- Optimize Portal policies
DROP POLICY IF EXISTS "Portal clients can upload own documents" ON documents;
CREATE POLICY "Portal clients can upload own documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM client_users
    WHERE client_users.id = (select auth.uid())
    AND client_users.client_id = documents.client_id
    AND client_users.is_active = true
  ));

DROP POLICY IF EXISTS "Portal clients can view own documents" ON documents;
CREATE POLICY "Portal clients can view own documents" ON documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM client_users
    WHERE client_users.id = (select auth.uid())
    AND client_users.client_id = documents.client_id
    AND client_users.is_active = true
  ));

-- I. EMPLOYMENT HISTORY (Consolidate & Optimize)
DROP POLICY IF EXISTS "Staff can view assigned employment_history" ON employment_history;
DROP POLICY IF EXISTS "Staff can manage assigned employment_history" ON employment_history;

CREATE POLICY "Staff can manage assigned employment_history" ON employment_history
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = employment_history.client_id AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))));

-- J. ISP GOALS
DROP POLICY IF EXISTS "Staff can view assigned isp_goals" ON isp_goals;
DROP POLICY IF EXISTS "Staff can manage assigned isp_goals" ON isp_goals;

CREATE POLICY "Staff can manage assigned isp_goals" ON isp_goals
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = isp_goals.client_id AND (clients.assigned_to = (select auth.uid()) OR clients.created_by = (select auth.uid()))));
