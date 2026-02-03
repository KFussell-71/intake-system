-- ============================================
-- Supervisor Dashboard Enhancements Schema
-- ============================================
-- Purpose: Add tables for worker assignment, activity logging, and revision tracking
-- Date: 2026-02-02

-- ============================================
-- 1. Client-Worker Assignment Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS client_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    assigned_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES profiles(id),
    assigned_date TIMESTAMP DEFAULT NOW(),
    assignment_type TEXT DEFAULT 'primary', -- 'primary' | 'secondary'
    notes TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. Supervisor Activity Logging
-- ============================================

CREATE TABLE IF NOT EXISTS supervisor_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- 'approve', 'return', 'assign', 'bulk_approve', 'bulk_export'
    target_id UUID, -- intake_id or client_id
    target_type TEXT, -- 'intake' | 'client'
    notes TEXT,
    metadata JSONB, -- Additional context (e.g., { count: 5, intakeIds: [...] })
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. Revision Tracking for Intakes
-- ============================================

-- Add columns to intakes table for revision tracking
ALTER TABLE intakes 
ADD COLUMN IF NOT EXISTS revision_notes TEXT,
ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS returned_by UUID REFERENCES profiles(id);

-- ============================================
-- 4. Indexes for Performance
-- ============================================

-- Client assignments indexes
CREATE INDEX IF NOT EXISTS idx_client_assignments_client 
ON client_assignments(client_id);

CREATE INDEX IF NOT EXISTS idx_client_assignments_worker 
ON client_assignments(assigned_worker_id);

CREATE INDEX IF NOT EXISTS idx_client_assignments_active 
ON client_assignments(active) WHERE active = true;

-- Supervisor actions indexes
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_supervisor 
ON supervisor_actions(supervisor_id);

CREATE INDEX IF NOT EXISTS idx_supervisor_actions_created 
ON supervisor_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_supervisor_actions_type 
ON supervisor_actions(action_type);

CREATE INDEX IF NOT EXISTS idx_supervisor_actions_target 
ON supervisor_actions(target_id, target_type);

-- Intakes revision tracking index
CREATE INDEX IF NOT EXISTS idx_intakes_returned_by 
ON intakes(returned_by) WHERE returned_by IS NOT NULL;

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_actions ENABLE ROW LEVEL SECURITY;

-- Client assignments policies
CREATE POLICY "Supervisors and admins can view all assignments"
ON client_assignments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'supervisor', 'staff')
    )
);

CREATE POLICY "Supervisors and admins can create assignments"
ON client_assignments FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'supervisor')
    )
);

CREATE POLICY "Supervisors and admins can update assignments"
ON client_assignments FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'supervisor')
    )
);

-- Supervisor actions policies
CREATE POLICY "Supervisors can view their own actions"
ON supervisor_actions FOR SELECT
TO authenticated
USING (
    supervisor_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Supervisors can log actions"
ON supervisor_actions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'supervisor')
    )
);

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Function to get active assignment for a client
CREATE OR REPLACE FUNCTION get_active_assignment(p_client_id UUID)
RETURNS TABLE (
    assignment_id UUID,
    worker_id UUID,
    worker_name TEXT,
    worker_email TEXT,
    assignment_type TEXT,
    assigned_date TIMESTAMP,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ca.id,
        ca.assigned_worker_id,
        p.username,
        p.email,
        ca.assignment_type,
        ca.assigned_date,
        ca.notes
    FROM client_assignments ca
    JOIN profiles p ON p.id = ca.assigned_worker_id
    WHERE ca.client_id = p_client_id
    AND ca.active = true
    ORDER BY ca.assigned_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to log supervisor action
CREATE OR REPLACE FUNCTION log_supervisor_action(
    p_action_type TEXT,
    p_target_id UUID,
    p_target_type TEXT,
    p_notes TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_action_id UUID;
BEGIN
    INSERT INTO supervisor_actions (
        supervisor_id,
        action_type,
        target_id,
        target_type,
        notes,
        metadata
    ) VALUES (
        auth.uid(),
        p_action_type,
        p_target_id,
        p_target_type,
        p_notes,
        p_metadata
    )
    RETURNING id INTO v_action_id;
    
    RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Triggers
-- ============================================

-- Update updated_at timestamp on client_assignments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_assignments_updated_at
    BEFORE UPDATE ON client_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Comments for Documentation
-- ============================================

COMMENT ON TABLE client_assignments IS 'Tracks assignment of clients to employment specialists';
COMMENT ON TABLE supervisor_actions IS 'Audit log of all supervisor actions for compliance';
COMMENT ON COLUMN intakes.revision_notes IS 'Feedback from supervisor when returning for revision';
COMMENT ON COLUMN intakes.returned_at IS 'Timestamp when report was returned for revision';
COMMENT ON COLUMN intakes.returned_by IS 'Supervisor who returned the report';

-- ============================================
-- End of Schema Enhancements
-- ============================================
