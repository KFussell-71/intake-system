-- Migration: 20260207_audit_logging_v2
-- Description: Enhances audit logs for HIPAA compliance by adding source tracking (IP/UA)

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- Index for security researchers searching by IP
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip ON public.audit_logs (ip_address);
