-- Migration: 20260215_pipeline_velocity
-- Description: Adds stage tracking to calculate "Pipeline Velocity" (days in stage).

-- 1. Add stage_changed_at to cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Trigger Function to update stage_changed_at
CREATE OR REPLACE FUNCTION update_stage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        NEW.stage_changed_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger
DROP TRIGGER IF EXISTS trigger_update_stage_changed_at ON cases;
CREATE TRIGGER trigger_update_stage_changed_at
BEFORE UPDATE ON cases
FOR EACH ROW
EXECUTE FUNCTION update_stage_timestamp();

-- Index for performance on stage duration queries
CREATE INDEX IF NOT EXISTS idx_cases_stage_changed_at ON cases(stage_changed_at);
