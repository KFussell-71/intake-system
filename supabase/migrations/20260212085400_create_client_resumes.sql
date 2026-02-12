-- Create client_resumes table for tracking generated resumes
CREATE TABLE IF NOT EXISTS client_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
    resume_id VARCHAR(255) NOT NULL, -- Reactive Resume ID or internal ID
    resume_url TEXT NOT NULL,
    pdf_url TEXT,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}', -- Store additional resume metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add helpful comment
COMMENT ON TABLE client_resumes IS 'Stores generated resumes for clients, linked to their intake data';
COMMENT ON COLUMN client_resumes.resume_id IS 'External resume builder ID or internal identifier';
COMMENT ON COLUMN client_resumes.metadata IS 'Additional data like template used, generation settings, etc.';

-- Indexes for performance
CREATE INDEX idx_client_resumes_client_id ON client_resumes(client_id);
CREATE INDEX idx_client_resumes_intake_id ON client_resumes(intake_id);
CREATE INDEX idx_client_resumes_active ON client_resumes(is_active) WHERE is_active = true;
CREATE INDEX idx_client_resumes_created_at ON client_resumes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE client_resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Staff can view all resumes
CREATE POLICY "Staff can view all resumes"
    ON client_resumes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'supervisor', 'admin')
        )
    );

-- RLS Policy: Staff can create resumes
CREATE POLICY "Staff can create resumes"
    ON client_resumes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'supervisor', 'admin')
        )
    );

-- RLS Policy: Staff can update resumes
CREATE POLICY "Staff can update resumes"
    ON client_resumes FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'supervisor', 'admin')
        )
    );

-- RLS Policy: Clients can view their own resumes
CREATE POLICY "Clients can view their own resumes"
    ON client_resumes FOR SELECT
    TO authenticated
    USING (
        client_id IN (
            SELECT id FROM clients WHERE user_id = auth.uid()
        )
    );

-- Trigger for updated_at timestamp
CREATE TRIGGER update_client_resumes_updated_at
    BEFORE UPDATE ON client_resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add audit logging for resume generation
CREATE TABLE IF NOT EXISTS resume_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES client_resumes(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'generated', 'updated', 'downloaded', 'deleted'
    performed_by UUID REFERENCES profiles(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resume_logs_resume_id ON resume_generation_logs(resume_id);
CREATE INDEX idx_resume_logs_action ON resume_generation_logs(action);
CREATE INDEX idx_resume_logs_created_at ON resume_generation_logs(created_at DESC);

COMMENT ON TABLE resume_generation_logs IS 'Audit trail for resume generation and access';
