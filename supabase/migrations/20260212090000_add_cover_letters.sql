-- Create cover_letters table for tracking generated job-specific letters
CREATE TABLE IF NOT EXISTS cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    template VARCHAR(50) DEFAULT 'professional',
    job_description TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add helpful comment
COMMENT ON TABLE cover_letters IS 'Stores generated job-specific cover letters for clients';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cover_letters_client_id ON cover_letters(client_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_intake_id ON cover_letters(intake_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON cover_letters(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Staff can manage all cover letters
CREATE POLICY "Staff can manage all cover letters"
    ON cover_letters FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'supervisor', 'admin')
        )
    );

-- RLS Policy: Clients can view their own cover letters
-- FIXED: Use client_users table to link auth.uid() to client_id
CREATE POLICY "Clients can view their own cover letters"
    ON cover_letters FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_users
            WHERE client_users.client_id = cover_letters.client_id
            AND client_users.id = auth.uid()
            AND client_users.is_active = true
            AND (client_users.expires_at > NOW() OR client_users.expires_at IS NULL)
        )
    );

-- Trigger for updated_at timestamp
CREATE TRIGGER update_cover_letters_updated_at
    BEFORE UPDATE ON cover_letters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
