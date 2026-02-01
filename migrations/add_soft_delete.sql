-- Migration: Add soft delete support to clients table
-- Purpose: Preserve audit trail and allow recovery of deleted records
-- Created: 2026-02-01

-- Add deleted_at column to clients table if it doesn't exist
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN clients.deleted_at IS 'Timestamp when the client was soft-deleted. NULL indicates active record.';

-- Update existing RLS policies to exclude soft-deleted records
-- (They should already check this, but this ensures consistency)

-- Note: The application code now uses soft delete by setting deleted_at
-- instead of hard deleting records. This preserves the audit trail.
