-- Phase 20: Observability Persistence
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('metric', 'span', 'error')),
    value NUMERIC,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE telemetry_logs ENABLE ROW LEVEL SECURITY;

-- Only staff and above can view/insert telemetry
CREATE POLICY "Staff can view telemetry" ON telemetry_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('staff', 'supervisor', 'admin')
        )
    );

CREATE POLICY "Staff can insert telemetry" ON telemetry_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('staff', 'supervisor', 'admin')
        )
    );

-- Index for dashboard performance
CREATE INDEX idx_telemetry_event_name ON telemetry_logs(event_name);
CREATE INDEX idx_telemetry_created_at ON telemetry_logs(created_at DESC);

COMMENT ON TABLE telemetry_logs IS 'System-wide performance metrics, error traces, and operational telemetry (HIPAA audited).';
