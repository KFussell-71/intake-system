-- Migration: 20260213_optimistic_locking
-- Description: Adds a version column to the intakes table and creates intake_versions table.

-- 1. Add version column if it doesn't exist
ALTER TABLE intakes ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 1.1 Create intake_versions table for audit logging
CREATE TABLE IF NOT EXISTS intake_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    change_summary TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history lookups
CREATE INDEX IF NOT EXISTS idx_intake_versions_intake_id ON intake_versions(intake_id);
CREATE INDEX IF NOT EXISTS idx_intake_versions_created_at ON intake_versions(created_at DESC);
