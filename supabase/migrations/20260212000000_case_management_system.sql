-- ============================================================================
-- CASE MANAGEMENT SYSTEM MIGRATION
-- ============================================================================
-- Date: 2026-02-12
-- Purpose: Implement longitudinal case management schema (CommCare style)
--          handling Cases, Care Plans, Goals, Actions, and Services.
-- ============================================================================

BEGIN;

-- 1. Cases
-- Represents a longitudinal engagement cycle with a client.
CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id), -- Primary Case Worker
    
    -- Status & Lifecycle
    status TEXT NOT NULL CHECK (status IN ('active', 'closed', 'transferred')),
    stage TEXT NOT NULL CHECK (stage IN ('intake', 'assessment', 'planning', 'service_delivery', 'review')),
    
    -- Dates
    start_date DATE DEFAULT CURRENT_DATE,
    closed_date DATE,
    closure_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Cases
CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);


-- 2. Care Plans
-- A roadmap for the case, containing goals and actions.
CREATE TABLE IF NOT EXISTS care_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'revised')),
    
    -- Dates
    start_date DATE DEFAULT CURRENT_DATE,
    review_date DATE,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_plans_case_id ON care_plans(case_id);


-- 3. Care Plan Goals (SMART Goals)
CREATE TABLE IF NOT EXISTS care_plan_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
    
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('housing', 'employment', 'health', 'education', 'legal', 'finance', 'social', 'other')),
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'achieved', 'abandoned')),
    
    -- SMART properties
    target_date DATE,
    progress_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_plan_goals_plan_id ON care_plan_goals(plan_id);


-- 4. Care Plan Actions
-- Specific interventions or steps to achieve a goal.
CREATE TABLE IF NOT EXISTS care_plan_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES care_plan_goals(id) ON DELETE CASCADE,
    
    description TEXT NOT NULL,
    assigned_to_role TEXT CHECK (assigned_to_role IN ('client', 'case_worker', 'external_provider')),
    
    -- Status
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    
    target_date DATE,
    completion_date DATE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_plan_actions_goal_id ON care_plan_actions(goal_id);


-- 5. Service Logs
-- Record of services actually delivered.
CREATE TABLE IF NOT EXISTS service_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES profiles(id),
    
    service_type TEXT NOT NULL, -- e.g. "Counseling", "Housing Referral", "Transportation"
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_minutes INTEGER,
    
    notes TEXT,
    outcome TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_logs_case_id ON service_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_provider_id ON service_logs(provider_id);


-- 6. Follow Ups
-- Scheduled future interactions.
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    
    scheduled_date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('check_in', 'assessment', 'service', 'planning')),
    
    status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_case_id ON follow_ups(case_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(scheduled_date) WHERE status = 'scheduled';


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plan_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Helpers for RLS
-- Use existing policies logic: Staff can view if they are assigned or created it, or if they are admin/supervisor.

-- 1. Cases Policies

-- Staff can view cases they are assigned to OR for clients they are assigned to
CREATE POLICY "Staff can view assigned cases" ON cases
    FOR SELECT TO authenticated
    USING (
        assigned_to = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = cases.client_id 
            AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))
        ) OR
        (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
    );

-- Staff can insert cases for their clients
CREATE POLICY "Staff can insert cases" ON cases
    FOR INSERT TO authenticated
    WITH CHECK (
        assigned_to = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = cases.client_id 
            AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))
        ) OR
        (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
    );

-- Staff can update cases they are assigned to
CREATE POLICY "Staff can update assigned cases" ON cases
    FOR UPDATE TO authenticated
    USING (
        assigned_to = (SELECT auth.uid()) OR
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = cases.client_id 
            AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))
        ) OR
        (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
    );

-- 2. Child Tables Policies (Cascade access from Case)
-- If you can view the Case, you can view the derived data (Plans, Goals, Logs).

-- Care Plans
CREATE POLICY "Access care_plans via case" ON care_plans
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM cases WHERE cases.id = care_plans.case_id AND (
            cases.assigned_to = (SELECT auth.uid()) OR
            EXISTS (SELECT 1 FROM clients WHERE clients.id = cases.client_id AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))) OR
            (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
        ))
    );

-- Care Plan Goals
CREATE POLICY "Access goals via plan" ON care_plan_goals
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM care_plans 
            JOIN cases ON cases.id = care_plans.case_id
            WHERE care_plans.id = care_plan_goals.plan_id AND (
                cases.assigned_to = (SELECT auth.uid()) OR
                EXISTS (SELECT 1 FROM clients WHERE clients.id = cases.client_id AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))) OR
                (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
            )
        )
    );

-- Care Plan Actions
CREATE POLICY "Access actions via goal" ON care_plan_actions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM care_plan_goals 
            JOIN care_plans ON care_plans.id = care_plan_goals.plan_id
            JOIN cases ON cases.id = care_plans.case_id
            WHERE care_plan_goals.id = care_plan_actions.goal_id AND (
                cases.assigned_to = (SELECT auth.uid()) OR
                EXISTS (SELECT 1 FROM clients WHERE clients.id = cases.client_id AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))) OR
                (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
            )
        )
    );

-- Service Logs
CREATE POLICY "Access service_logs via case" ON service_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM cases WHERE cases.id = service_logs.case_id AND (
            cases.assigned_to = (SELECT auth.uid()) OR
            EXISTS (SELECT 1 FROM clients WHERE clients.id = cases.client_id AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))) OR
            (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
        ))
    );

-- Follow Ups
CREATE POLICY "Access follow_ups via case" ON follow_ups
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM cases WHERE cases.id = follow_ups.case_id AND (
            cases.assigned_to = (SELECT auth.uid()) OR
            EXISTS (SELECT 1 FROM clients WHERE clients.id = cases.client_id AND (clients.assigned_to = (SELECT auth.uid()) OR clients.created_by = (SELECT auth.uid()))) OR
            (SELECT role FROM profiles WHERE id = (SELECT auth.uid())) IN ('admin', 'supervisor')
        ))
    );


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_care_plans_updated_at BEFORE UPDATE ON care_plans FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cp_goals_updated_at BEFORE UPDATE ON care_plan_goals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cp_actions_updated_at BEFORE UPDATE ON care_plan_actions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_service_logs_updated_at BEFORE UPDATE ON service_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON follow_ups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

COMMIT;
