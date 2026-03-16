-- Migration: 20260217040000_last_saved_at_fix.sql
-- Description: Add missing columns to intakes table for RPC alignment.

BEGIN;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intakes' AND column_name = 'last_saved_at') THEN
        ALTER TABLE intakes ADD COLUMN last_saved_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

COMMIT;
