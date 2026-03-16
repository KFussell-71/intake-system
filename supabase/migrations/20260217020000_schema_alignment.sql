-- Migration: 20260217020000_schema_alignment.sql
-- Description: Align clients and cases tables with application expectations.

BEGIN;

-- 1. Upgrade 'clients' table
DO $$
BEGIN
    -- Add first_name and last_name if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'first_name') THEN
        ALTER TABLE clients ADD COLUMN first_name TEXT;
    END IF;

    -- Add last_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'last_name') THEN
        ALTER TABLE clients ADD COLUMN last_name TEXT;
    END IF;
END $$;

-- Perform data migration outside the DO block to avoid validation issues if columns were just added
UPDATE clients 
SET 
  first_name = split_part(name, ' ', 1), 
  last_name = split_part(name, ' ', 2) 
WHERE (first_name IS NULL OR last_name IS NULL) AND name IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'status') THEN
        ALTER TABLE clients ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'closed'));
    END IF;
END $$;

-- 2. Upgrade 'cases' table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'estimated_exit_date') THEN
        ALTER TABLE cases ADD COLUMN estimated_exit_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'stage_changed_at') THEN
        ALTER TABLE cases ADD COLUMN stage_changed_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'updated_at') THEN
        ALTER TABLE cases ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Upgrade 'profiles' table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
        ALTER TABLE profiles ADD COLUMN first_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
        ALTER TABLE profiles ADD COLUMN last_name TEXT;
    END IF;
END $$;

-- 4. Upgrade 'intakes' table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intakes' AND column_name = 'version') THEN
        ALTER TABLE intakes ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intakes' AND column_name = 'status') THEN
        ALTER TABLE intakes ADD COLUMN status TEXT DEFAULT 'draft';
    END IF;
END $$;

-- 5. Create missing tables (Recreate for fresh schema)
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS telemetry_logs CASCADE;
DROP TABLE IF EXISTS intake_supervision_notes CASCADE;

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    event_type TEXT,
    value NUMERIC,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intake_supervision_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES profiles(id),
    note_type TEXT CHECK (note_type IN ('approval', 'rejection', 'correction_request', 'flag')),
    content TEXT NOT NULL,
    required_actions TEXT[] DEFAULT '{}'::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;
