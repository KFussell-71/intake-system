-- Soft Deletes & Partial Indexes Optimization
-- Created: 2026-02-03
-- Purpose: Support soft deletes and optimize queries for active records

-- 1. Ensure 'deleted_at' column exists (Idempotent)
DO $$ 
BEGIN
    -- Clients
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'deleted_at') THEN
        ALTER TABLE clients ADD COLUMN deleted_at timestamptz DEFAULT NULL;
    END IF;

    -- Intakes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intakes' AND column_name = 'deleted_at') THEN
        ALTER TABLE intakes ADD COLUMN deleted_at timestamptz DEFAULT NULL;
    END IF;

    -- Documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'deleted_at') THEN
        ALTER TABLE documents ADD COLUMN deleted_at timestamptz DEFAULT NULL;
    END IF;
END $$;

-- 2. Create Partial Indexes for Active Records
-- significantly reduces index size and lookup time for the default 'active' view

CREATE INDEX IF NOT EXISTS idx_clients_active 
ON clients (created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_intakes_active 
ON intakes (status, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_documents_active 
ON documents (client_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 3. Safety Check: Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
