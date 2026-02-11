-- ============================================================================
-- MIGRATION: 20260211_data_promotion.sql
-- PURPOSE: Promote critical JSONB fields to top-level columns for indexing
-- ============================================================================

-- 1. Add Generated Columns
-- These columns are automatically populated from the 'data' JSONB column.
-- We use 'STORED' so they are physically materialized and indexable.

ALTER TABLE intakes
ADD COLUMN IF NOT EXISTS referral_source TEXT 
GENERATED ALWAYS AS (data->>'referralSource') STORED;

ALTER TABLE intakes
ADD COLUMN IF NOT EXISTS employment_status TEXT 
GENERATED ALWAYS AS (data->>'employmentStatus') STORED;

ALTER TABLE intakes
ADD COLUMN IF NOT EXISTS readiness_scale INTEGER 
GENERATED ALWAYS AS ((data->>'readinessScale')::INTEGER) STORED;

-- Handle array length safely
ALTER TABLE intakes
ADD COLUMN IF NOT EXISTS barrier_count INTEGER 
GENERATED ALWAYS AS (
    jsonb_array_length(
        CASE 
            WHEN jsonb_typeof(data->'barriers') = 'array' THEN data->'barriers' 
            ELSE '[]'::jsonb 
        END
    )
) STORED;

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_intakes_referral ON intakes(referral_source);
CREATE INDEX IF NOT EXISTS idx_intakes_emp_status ON intakes(employment_status);
CREATE INDEX IF NOT EXISTS idx_intakes_readiness ON intakes(readiness_scale);
CREATE INDEX IF NOT EXISTS idx_intakes_barrier_count ON intakes(barrier_count);

-- 3. Add Comment for Documentation
COMMENT ON COLUMN intakes.referral_source IS 'Promoted from data->referralSource for analytics';
COMMENT ON COLUMN intakes.barrier_count IS 'Count of identified barriers in data->barriers';
