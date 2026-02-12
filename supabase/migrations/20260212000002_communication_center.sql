-- 1. Create communication_logs table
CREATE TABLE IF NOT EXISTS communication_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'internal')),
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    
    content TEXT NOT NULL,
    subject TEXT, -- for emails
    
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    
    sender_id UUID REFERENCES profiles(id), -- internal user
    recipient_contact TEXT, -- email or phone wrapper
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_communication_logs_case_id ON communication_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_client_id ON communication_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created_at ON communication_logs(created_at DESC);

-- 3. RLS
ALTER TABLE communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view communication logs for cases"
    ON communication_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert communication logs"
    ON communication_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update communication logs"
    ON communication_logs FOR UPDATE
    TO authenticated
    USING (true);
