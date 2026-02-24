-- Performance optimization: Index all foreign keys
-- Identified by Supabase Database Linter
-- Created: 2026-02-03

-- public.client_users
CREATE INDEX IF NOT EXISTS idx_client_users_invited_by
ON public.client_users (invited_by);

-- public.clients
CREATE INDEX IF NOT EXISTS idx_clients_created_by
ON public.clients (created_by);

-- public.compliance_scans
CREATE INDEX IF NOT EXISTS idx_compliance_scans_created_by
ON public.compliance_scans (created_by);

-- public.documents
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by
ON public.documents (uploaded_by);

-- public.employment_history
CREATE INDEX IF NOT EXISTS idx_employment_history_created_by
ON public.employment_history (created_by);

-- public.follow_ups
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_by
ON public.follow_ups (created_by);

-- public.intakes
CREATE INDEX IF NOT EXISTS idx_intakes_prepared_by
ON public.intakes (prepared_by);

CREATE INDEX IF NOT EXISTS idx_intakes_updated_by
ON public.intakes (updated_by);

-- public.isp_goals
CREATE INDEX IF NOT EXISTS idx_isp_goals_created_by
ON public.isp_goals (created_by);

-- public.isp_outcomes
CREATE INDEX IF NOT EXISTS idx_isp_outcomes_client_id
ON public.isp_outcomes (client_id);

-- public.notifications
CREATE INDEX IF NOT EXISTS idx_notifications_client_id
ON public.notifications (client_id);

-- public.portal_activity
CREATE INDEX IF NOT EXISTS idx_portal_activity_user_id
ON public.portal_activity (user_id);

-- public.report_reviews
CREATE INDEX IF NOT EXISTS idx_report_reviews_created_by
ON public.report_reviews (created_by);

CREATE INDEX IF NOT EXISTS idx_report_reviews_reviewer_id
ON public.report_reviews (reviewer_id);

-- public.report_versions
CREATE INDEX IF NOT EXISTS idx_report_versions_created_by
ON public.report_versions (created_by);

-- public.supportive_services
CREATE INDEX IF NOT EXISTS idx_supportive_services_created_by
ON public.supportive_services (created_by);
