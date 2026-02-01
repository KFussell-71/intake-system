-- Migration: Add missing performance indexes
-- Purpose: Improve query performance for common filtering and sorting operations
-- Created: 2026-02-01

-- Add index on intakes.completion_date (used in dashboard queries)
CREATE INDEX IF NOT EXISTS idx_intakes_completion_date 
ON intakes(completion_date) 
WHERE completion_date IS NOT NULL;

-- Add index on follow_ups.status (used for filtering pending/completed)
CREATE INDEX IF NOT EXISTS idx_follow_ups_status 
ON follow_ups(status);

-- Add index on audit_logs.created_at (needed for time-range queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON audit_logs(created_at DESC);

-- Add composite index on clients for sorted lists
CREATE INDEX IF NOT EXISTS idx_clients_assigned_created 
ON clients(assigned_to, created_at DESC) 
WHERE deleted_at IS NULL;

-- Add index on intakes.created_at for recent activity queries
CREATE INDEX IF NOT EXISTS idx_intakes_created_at 
ON intakes(created_at DESC);

-- Add index on clients.deleted_at for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_clients_deleted_at 
ON clients(deleted_at) 
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_intakes_completion_date IS 'Improves performance of dashboard completion rate queries';
COMMENT ON INDEX idx_follow_ups_status IS 'Improves performance of follow-up filtering by status';
COMMENT ON INDEX idx_audit_logs_created_at IS 'Improves performance of audit log time-range queries';
COMMENT ON INDEX idx_clients_assigned_created IS 'Improves performance of client list queries sorted by date';
