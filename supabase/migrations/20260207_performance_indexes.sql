-- Migration: 20260207_performance_indexes
-- Description: Adds missing indexes identified in independent code review (Phase 3.2)

-- 1. Accelerate Audit Log Dashboard Queries (Sort by Date)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at 
ON public.audit_logs (created_at DESC);

-- 2. Accelerate Intake Lookup by Status (Common Pattern)
CREATE INDEX IF NOT EXISTS idx_intakes_client_status 
ON public.intakes (client_id, status);

-- 3. Composite Key for Entity Lookups (Audit Logs)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity 
ON public.audit_logs (entity_type, entity_id);

-- 4. Case Notes Time-Series Lookup
CREATE INDEX IF NOT EXISTS idx_case_notes_client_created 
ON public.case_notes (client_id, created_at DESC);
