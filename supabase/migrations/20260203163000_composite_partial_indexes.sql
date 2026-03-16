-- Composite Partial Indexes
-- Created: 2026-02-03
-- Purpose: Optimize dashboard queries by combining filter columns with sorting in partial indexes

-- 1. Drop previous simple partial indexes (if they exist)
DROP INDEX IF EXISTS idx_clients_active;
DROP INDEX IF EXISTS idx_intakes_active;
DROP INDEX IF EXISTS idx_documents_active;

-- 2. Create Composite Partial Indexes
-- "My Clients" & Active Clients Dashboard
-- Query: SELECT * FROM clients WHERE assigned_to = ? AND deleted_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_clients_active_composite 
ON clients (assigned_to, created_at DESC) 
WHERE deleted_at IS NULL;

-- Intakes by Status
-- Query: SELECT * FROM intakes WHERE status = ? AND deleted_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_intakes_active_composite 
ON intakes (status, created_at DESC) 
WHERE deleted_at IS NULL;

-- Documents by Client
-- Query: SELECT * FROM documents WHERE client_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_documents_active_composite 
ON documents (client_id, created_at DESC) 
WHERE deleted_at IS NULL;
