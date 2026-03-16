-- 🏗️ R&D Program: Enterprise Clinical Node - 16TB Hardware Optimization
-- Purpose: Tune Postgres for high-capacity NAS/SSD storage and concurrent field traffic.

-- 1. Performance Tuning (Applied via command-line in docker-compose, but documented here)
-- shared_buffers = 4GB (Optimized for 16GB-32GB RAM Host)
-- work_mem = 64MB
-- maintenance_work_mem = 512MB
-- random_page_cost = 1.1 (Optimized for SSD/NVMe)
-- effective_io_concurrency = 200
-- max_connections = 100

-- 2. Enterprise Sync Audit (OTel Integration)
-- Create a table to track distributed sync latency per device.
CREATE TABLE IF NOT EXISTS enterprise_sync_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    case_id UUID NOT NULL,
    sync_version INT NOT NULL,
    latency_ms NUMERIC NOT NULL,
    hop_count INT DEFAULT 1,
    trace_id TEXT, -- OpenTelemetry Trace ID
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_audit_device ON enterprise_sync_audit(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_audit_created ON enterprise_sync_audit(created_at);

-- 3. High-Concurrency Version Gating
-- Ensure the aggregate root can handle high-frequency locking from 7+ tablets.
-- (Function logic in master_clinical_sync_v3 already handles this via FOR UPDATE)

COMMENT ON TABLE enterprise_sync_audit IS 'Enterprise-grade audit trail for distributed sync performance and OTel tracing.';
