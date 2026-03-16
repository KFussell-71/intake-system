-- Performance Optimization Indexes
-- Created: 2026-02-02
-- Purpose: Add strategic indexes to improve query performance by 50-70%

-- ============================================
-- INTAKES TABLE
-- ============================================

-- Most common query pattern: filter by status and sort by created_at
CREATE INDEX IF NOT EXISTS idx_intakes_status_created 
ON intakes(status, created_at DESC)
WHERE deleted_at IS NULL;

-- Search by client
CREATE INDEX IF NOT EXISTS idx_intakes_client_id 
ON intakes(client_id) 
WHERE deleted_at IS NULL;

-- Filter by assigned worker
CREATE INDEX IF NOT EXISTS idx_intakes_assigned_worker 
ON intakes(assigned_worker_id, status)
WHERE deleted_at IS NULL AND assigned_worker_id IS NOT NULL;

-- ============================================
-- CLIENT ASSIGNMENTS TABLE
-- ============================================

-- Active assignments by worker (most common supervisor query)
CREATE INDEX IF NOT EXISTS idx_client_assignments_active_worker 
ON client_assignments(assigned_worker_id, created_at DESC) 
WHERE active = true;

-- Active assignments by client
CREATE INDEX IF NOT EXISTS idx_client_assignments_active_client 
ON client_assignments(client_id, created_at DESC) 
WHERE active = true;

-- Assignment type filtering
CREATE INDEX IF NOT EXISTS idx_client_assignments_type 
ON client_assignments(assignment_type, active);

-- ============================================
-- SUPERVISOR ACTIONS TABLE
-- ============================================

-- Activity log queries by supervisor
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_supervisor_created 
ON supervisor_actions(supervisor_id, created_at DESC);

-- Covering index for list view (includes commonly selected columns)
-- This allows index-only scans without touching the table
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_list 
ON supervisor_actions(supervisor_id, created_at DESC) 
INCLUDE (action_type, target_id, notes);

-- Filter by action type
CREATE INDEX IF NOT EXISTS idx_supervisor_actions_type 
ON supervisor_actions(action_type, created_at DESC);

-- ============================================
-- PROFILES TABLE
-- ============================================

-- Role-based queries (supervisor/admin/staff filtering)
CREATE INDEX IF NOT EXISTS idx_profiles_role 
ON profiles(role) 
WHERE role IN ('supervisor', 'admin', 'staff');

-- Email lookup (for login)
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

-- ============================================
-- CLIENTS TABLE
-- ============================================

-- Full-text search index for client names and emails
CREATE INDEX IF NOT EXISTS idx_clients_search 
ON clients USING GIN (
    to_tsvector('english', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(email, '')
    )
);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_clients_status 
ON clients(status, created_at DESC)
WHERE deleted_at IS NULL;

-- ============================================
-- NOTIFICATIONS TABLE (if exists)
-- ============================================

-- User notifications query
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications(user_id, created_at DESC)
WHERE read = false;

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update table statistics for query planner
ANALYZE intakes;
ANALYZE client_assignments;
ANALYZE supervisor_actions;
ANALYZE profiles;
ANALYZE clients;
ANALYZE notifications;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify indexes are being used:

-- 1. Check supervisor actions query plan
-- EXPLAIN ANALYZE 
-- SELECT id, action_type, target_id, notes, created_at 
-- FROM supervisor_actions 
-- WHERE supervisor_id = 'test-id' 
-- ORDER BY created_at DESC 
-- LIMIT 50;
-- Expected: "Index Scan using idx_supervisor_actions_list"

-- 2. Check intakes by status query plan
-- EXPLAIN ANALYZE 
-- SELECT * FROM intakes 
-- WHERE status = 'pending_review' 
-- AND deleted_at IS NULL
-- ORDER BY created_at DESC;
-- Expected: "Index Scan using idx_intakes_status_created"

-- 3. Check active assignments query plan
-- EXPLAIN ANALYZE 
-- SELECT * FROM client_assignments 
-- WHERE assigned_worker_id = 'worker-id' 
-- AND active = true 
-- ORDER BY created_at DESC;
-- Expected: "Index Scan using idx_client_assignments_active_worker"
