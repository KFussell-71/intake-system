-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA MIGRATION
-- ============================================================================
-- Date: 2026-01-31
-- Purpose: Create all missing tables, indexes, policies, and functions
-- This migration is idempotent and can be safely re-run
-- ============================================================================

-- ============================================================================
-- 1. TRACKING MILESTONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tracking_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  completion_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tracking_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned milestones" ON tracking_milestones;
CREATE POLICY "Staff can view assigned milestones" ON tracking_milestones
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = tracking_milestones.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "Staff can manage assigned milestones" ON tracking_milestones;
CREATE POLICY "Staff can manage assigned milestones" ON tracking_milestones
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = tracking_milestones.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- ============================================================================
-- 2. JOB PLACEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_placements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  wage TEXT,
  title TEXT,
  placement_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_placements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned placements" ON job_placements;
CREATE POLICY "Staff can view assigned placements" ON job_placements
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = job_placements.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "Staff can manage assigned placements" ON job_placements;
CREATE POLICY "Staff can manage assigned placements" ON job_placements
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = job_placements.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- ============================================================================
-- 3. FOLLOW UPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  contact_date DATE NOT NULL,
  method TEXT CHECK (method IN ('phone', 'in-person')),
  performance TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned followups" ON follow_ups;
CREATE POLICY "Staff can view assigned followups" ON follow_ups
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "Staff can update assigned followups" ON follow_ups;
CREATE POLICY "Staff can update assigned followups" ON follow_ups
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "Staff can insert followups" ON follow_ups;
CREATE POLICY "Staff can insert followups" ON follow_ups
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = follow_ups.client_id 
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- ============================================================================
-- 4. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "System can record audit logs" ON audit_logs;
CREATE POLICY "System can record audit logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- 5. DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id)
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned documents" ON documents;
CREATE POLICY "Staff can view assigned documents" ON documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "Staff can upload assigned documents" ON documents;
CREATE POLICY "Staff can upload assigned documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

DROP POLICY IF EXISTS "Staff can delete assigned documents" ON documents;
CREATE POLICY "Staff can delete assigned documents" ON documents
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM clients
    WHERE clients.id = documents.client_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- Portal clients can view their own documents
DROP POLICY IF EXISTS "Portal clients can view own documents" ON documents;
CREATE POLICY "Portal clients can view own documents" ON documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.client_id = documents.client_id
      AND client_users.is_active = true
      AND client_users.revoked_at IS NULL
      AND client_users.expires_at > NOW()
    )
  );

-- Portal clients can upload documents for themselves
DROP POLICY IF EXISTS "Portal clients can upload own documents" ON documents;
CREATE POLICY "Portal clients can upload own documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.id = auth.uid()
      AND client_users.client_id = documents.client_id
      AND client_users.is_active = true
      AND client_users.revoked_at IS NULL
      AND client_users.expires_at > NOW()
    )
  );

-- ============================================================================
-- 6. EMPLOYMENT HISTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS employment_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  employer TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE employment_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned employment_history" ON employment_history;
CREATE POLICY "Staff can view assigned employment_history" ON employment_history 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = employment_history.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

DROP POLICY IF EXISTS "Staff can manage assigned employment_history" ON employment_history;
CREATE POLICY "Staff can manage assigned employment_history" ON employment_history 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = employment_history.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

-- ============================================================================
-- 7. ISP GOALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS isp_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  target_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE isp_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned isp_goals" ON isp_goals;
CREATE POLICY "Staff can view assigned isp_goals" ON isp_goals 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = isp_goals.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

DROP POLICY IF EXISTS "Staff can manage assigned isp_goals" ON isp_goals;
CREATE POLICY "Staff can manage assigned isp_goals" ON isp_goals 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = isp_goals.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

-- ============================================================================
-- 8. SUPPORTIVE SERVICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS supportive_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'provided', 'denied')),
  cost DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE supportive_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned supportive_services" ON supportive_services;
CREATE POLICY "Staff can view assigned supportive_services" ON supportive_services 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = supportive_services.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

DROP POLICY IF EXISTS "Staff can manage assigned supportive_services" ON supportive_services;
CREATE POLICY "Staff can manage assigned supportive_services" ON supportive_services 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = supportive_services.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

-- ============================================================================
-- 9. REPORT REVIEWS TABLE (Supervisor Queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE report_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view report_reviews" ON report_reviews;
CREATE POLICY "Staff can view report_reviews" ON report_reviews 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Staff can manage report_reviews" ON report_reviews;
CREATE POLICY "Staff can manage report_reviews" ON report_reviews 
  FOR ALL TO authenticated 
  USING (true);

-- Deny portal access to report_reviews
DROP POLICY IF EXISTS "Deny portal access to report_reviews" ON report_reviews;
CREATE POLICY "Deny portal access to report_reviews" ON report_reviews
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- ============================================================================
-- 10. COMPLIANCE SCANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS compliance_scans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_period_start DATE,
  scan_period_end DATE,
  run_at TIMESTAMPTZ DEFAULT NOW(),
  summary JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE compliance_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view compliance_scans" ON compliance_scans;
CREATE POLICY "Staff can view compliance_scans" ON compliance_scans
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Staff can manage compliance_scans" ON compliance_scans;
CREATE POLICY "Staff can manage compliance_scans" ON compliance_scans
  FOR ALL TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor'));

-- ============================================================================
-- 11. ISP OUTCOMES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS isp_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  goal_type TEXT,
  target_date DATE,
  completed_date DATE,
  outcome_status TEXT CHECK (outcome_status IN ('met', 'in_progress', 'not_met')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE isp_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned isp_outcomes" ON isp_outcomes;
CREATE POLICY "Staff can view assigned isp_outcomes" ON isp_outcomes
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = isp_outcomes.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

DROP POLICY IF EXISTS "Staff can manage assigned isp_outcomes" ON isp_outcomes;
CREATE POLICY "Staff can manage assigned isp_outcomes" ON isp_outcomes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = isp_outcomes.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

-- ============================================================================
-- 12. REPORT VERSIONS TABLE (Immutable Records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS report_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  content_markdown TEXT NOT NULL,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE report_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view assigned report_versions" ON report_versions;
CREATE POLICY "Staff can view assigned report_versions" ON report_versions 
  FOR SELECT TO authenticated 
  USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = report_versions.client_id AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())));

DROP POLICY IF EXISTS "Staff can insert report_versions" ON report_versions;
CREATE POLICY "Staff can insert report_versions" ON report_versions 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = created_by);

-- Auditor access
DROP POLICY IF EXISTS "Auditors can read all report_versions" ON report_versions;
CREATE POLICY "Auditors can read all report_versions" ON report_versions 
  FOR SELECT TO authenticated 
  USING (auth.jwt()->>'role' = 'auditor' OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'auditor');

-- Deny portal access
DROP POLICY IF EXISTS "Deny portal access to report_versions" ON report_versions;
CREATE POLICY "Deny portal access to report_versions" ON report_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- ============================================================================
-- 13. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view all notifications" ON notifications;
CREATE POLICY "Staff can view all notifications" ON notifications 
  FOR SELECT TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 14. UPDATE INTAKES TABLE (Add status columns if missing)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'intakes' AND column_name = 'status'
  ) THEN
    ALTER TABLE intakes ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'awaiting_review', 'approved', 'locked'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'intakes' AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE intakes ADD COLUMN submitted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- 15. STORAGE BUCKETS (Idempotent)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-documents', 'client-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 16. STORAGE POLICIES
-- ============================================================================

-- Staff can read assigned storage
DROP POLICY IF EXISTS "Staff can read assigned storage" ON storage.objects;
CREATE POLICY "Staff can read assigned storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'client-documents' AND EXISTS (
    SELECT 1 FROM documents
    JOIN clients ON clients.id = documents.client_id
    WHERE documents.url LIKE '%' || storage.objects.name
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- Staff can upload storage
DROP POLICY IF EXISTS "Staff can upload storage" ON storage.objects;
CREATE POLICY "Staff can upload storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'client-documents');

-- Staff can delete storage
DROP POLICY IF EXISTS "Staff can delete storage" ON storage.objects;
CREATE POLICY "Staff can delete storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'client-documents');

-- Portal clients can upload own storage
DROP POLICY IF EXISTS "Portal clients can upload own storage" ON storage.objects;
CREATE POLICY "Portal clients can upload own storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'client-documents' 
    AND EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.id = auth.uid()
      AND storage.objects.name LIKE 'client-' || client_users.client_id::text || '/%'
      AND client_users.is_active = true
      AND client_users.revoked_at IS NULL
      AND client_users.expires_at > NOW()
    )
  );

-- Portal clients can read own storage
DROP POLICY IF EXISTS "Portal clients can read own storage" ON storage.objects;
CREATE POLICY "Portal clients can read own storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'client-documents'
    AND EXISTS (
      SELECT 1 FROM client_users
      WHERE client_users.id = auth.uid()
      AND storage.objects.name LIKE 'client-' || client_users.client_id::text || '/%'
      AND client_users.is_active = true
      AND client_users.revoked_at IS NULL
      AND client_users.expires_at > NOW()
    )
  );

-- ============================================================================
-- 17. INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_intakes_client_id ON intakes(client_id);
CREATE INDEX IF NOT EXISTS idx_intakes_data_gin ON intakes USING gin (data);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_client_id ON follow_ups(client_id);
CREATE INDEX IF NOT EXISTS idx_tracking_milestones_client_id ON tracking_milestones(client_id);
CREATE INDEX IF NOT EXISTS idx_job_placements_client_id ON job_placements(client_id);
CREATE INDEX IF NOT EXISTS idx_employment_history_client_id ON employment_history(client_id);
CREATE INDEX IF NOT EXISTS idx_isp_goals_client_id ON isp_goals(client_id);
CREATE INDEX IF NOT EXISTS idx_supportive_services_client_id ON supportive_services(client_id);
CREATE INDEX IF NOT EXISTS idx_report_reviews_client_id ON report_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_report_versions_client_id ON report_versions(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_staff_id ON notifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================================================
-- 18. FUNCTIONS
-- ============================================================================

-- Handle new user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, new.email, 'staff')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Get client intake bundle RPC
CREATE OR REPLACE FUNCTION get_client_intake_bundle(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'client', (
      SELECT row_to_json(c)
      FROM clients c
      WHERE c.id = p_client_id
    ),
    'intake', (
      SELECT jsonb_build_object(
        'id', i.id,
        'client_id', i.client_id,
        'report_date', i.report_date,
        'completion_date', i.completion_date,
        'status', i.status,
        'details', i.data,
        'created_at', i.created_at
      )
      FROM intakes i
      WHERE i.client_id = p_client_id
      ORDER BY i.created_at DESC
      LIMIT 1
    ),
    'documents', (
      SELECT coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb)
      FROM documents d
      WHERE d.client_id = p_client_id
    ),
    'employment_history', (
      SELECT coalesce(jsonb_agg(row_to_json(e)), '[]'::jsonb)
      FROM employment_history e
      WHERE e.client_id = p_client_id
    ),
    'isp_goals', (
      SELECT coalesce(jsonb_agg(row_to_json(g)), '[]'::jsonb)
      FROM isp_goals g
      WHERE g.client_id = p_client_id
    ),
    'supportive_services', (
      SELECT coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb)
      FROM supportive_services s
      WHERE s.client_id = p_client_id
    ),
    'follow_up', (
      SELECT row_to_json(f)
      FROM follow_ups f
      WHERE f.client_id = p_client_id
      ORDER BY f.contact_date DESC
      LIMIT 1
    )
  )
  INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
