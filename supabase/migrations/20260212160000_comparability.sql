-- Migration: 20260212160000_comparability.sql
-- Tier 3: Cross-State Comparability (Institutional Intelligence)

-- 1. Canonical Metrics (The Rosetta Stone)
-- Defines the "Gold Standard" terms for federal reporting.
CREATE TABLE IF NOT EXISTS canonical_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL, -- e.g. 'BARRIER_TRANSPORTATION'
  name TEXT NOT NULL, -- e.g. 'Transportation Barrier'
  category TEXT NOT NULL, -- e.g. 'BARRIERS', 'OUTCOMES'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Metric Mappings (The Translator)
-- Maps local chaos to order.
CREATE TABLE IF NOT EXISTS metric_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  canonical_id UUID REFERENCES canonical_metrics(id) ON DELETE CASCADE,
  local_term TEXT NOT NULL, -- e.g. 'Missed bus', 'Car broke down'
  agency_id UUID, -- Optional: if mapping is specific to one tenant
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(canonical_id, local_term)
);

-- 3. Seed Data (Federal Standards)
INSERT INTO canonical_metrics (key, name, category, description) VALUES
('BARRIER_TRANSPORTATION', 'Transportation Barrier', 'BARRIERS', 'Lack of reliable transit affecting attendance.'),
('BARRIER_HOUSING', 'Housing Instability', 'BARRIERS', 'Homelessness or risk of eviction.'),
('BARRIER_CHILDCARE', 'Childcare Issues', 'BARRIERS', 'Lack of supervision for dependents.'),
('OUTCOME_EMPLOYED', 'Employed (Competitive)', 'OUTCOMES', 'Placement in competitive integrated employment.')
ON CONFLICT DO NOTHING;

-- 4. Seed Data (Example Mappings)
-- In production, these would come from Admin UI.
DO $$
DECLARE
    trans_id UUID;
    house_id UUID;
BEGIN
    SELECT id INTO trans_id FROM canonical_metrics WHERE key = 'BARRIER_TRANSPORTATION';
    SELECT id INTO house_id FROM canonical_metrics WHERE key = 'BARRIER_HOUSING';

    IF trans_id IS NOT NULL THEN
        INSERT INTO metric_mappings (canonical_id, local_term) VALUES
        (trans_id, 'no_car'),
        (trans_id, 'transit_strike'),
        (trans_id, 'bus_pass_expired')
        ON CONFLICT DO NOTHING;
    END IF;

    IF house_id IS NOT NULL THEN
        INSERT INTO metric_mappings (canonical_id, local_term) VALUES
        (house_id, 'eviction_notice'),
        (house_id, 'couch_surfing'),
        (house_id, 'shelter_resident')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 5. Normalization Engine (RPC)
-- Aggregates local data into canonical buckets.
CREATE OR REPLACE FUNCTION get_normalized_metrics(target_category TEXT)
RETURNS TABLE (
    canonical_key TEXT,
    canonical_name TEXT,
    total_count BIGINT,
    local_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This example assumes we are aggregating from the 'intake_barriers' table
    -- structured in Phase 11/12 (intake_barriers joined with barriers table or just local terms)
    -- For simplicity in this demo, we assume 'intake_barriers' has a 'barrier_id' which links to 'barriers(key)'
    
    RETURN QUERY
    WITH raw_data AS (
        -- Get the local terms attached to intakes
        -- Adapting to the Schema: intake_barriers -> barriers (key is the local term)
        SELECT b.key as local_term
        FROM intake_barriers ib
        JOIN barriers b ON ib.barrier_id = b.id
    ),
    mapped_data AS (
        -- Join with our Rosetta Stone
        SELECT 
            cm.key as c_key,
            cm.name as c_name,
            rd.local_term
        FROM raw_data rd
        JOIN metric_mappings mm ON rd.local_term = mm.local_term
        JOIN canonical_metrics cm ON mm.canonical_id = cm.id
        WHERE cm.category = target_category
    )
    SELECT 
        c_key,
        c_name,
        COUNT(*)::BIGINT as total,
        jsonb_object_agg(local_term, count) as breakdown
    FROM (
        SELECT c_key, c_name, local_term, COUNT(*) as count
        FROM mapped_data
        GROUP BY c_key, c_name, local_term
    ) sub
    GROUP BY c_key, c_name;
END;
$$;
