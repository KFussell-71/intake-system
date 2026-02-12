-- 1. Create outcome_measures table (Definitions)
CREATE TABLE IF NOT EXISTS outcome_measures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL, -- e.g., 'score', 'scale', 'currency'
    min_value NUMERIC,
    max_value NUMERIC,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create outcome_records table (Data Points)
CREATE TABLE IF NOT EXISTS outcome_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    measure_id UUID NOT NULL REFERENCES outcome_measures(id),
    value NUMERIC NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    recorded_by UUID REFERENCES profiles(id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_outcome_records_case_id ON outcome_records(case_id);
CREATE INDEX IF NOT EXISTS idx_outcome_records_measure_id ON outcome_records(measure_id);
CREATE INDEX IF NOT EXISTS idx_outcome_records_recorded_at ON outcome_records(recorded_at DESC);

-- 4. RLS Policies
ALTER TABLE outcome_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE outcome_records ENABLE ROW LEVEL SECURITY;

-- Measures are readable by everyone, modifiable by admins (mock policy)
CREATE POLICY "Measures are readable by authenticated users"
    ON outcome_measures FOR SELECT
    TO authenticated
    USING (true);

-- Records are managed by case workers
CREATE POLICY "Users can insert records for their cases"
    ON outcome_records FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cases c
            WHERE c.id = outcome_records.case_id
            -- In a real app, check assignment or role. For now, open to auth users.
        )
    );

CREATE POLICY "Users can view records for cases"
    ON outcome_records FOR SELECT
    TO authenticated
    USING (true);

-- 5. Seed default measures
INSERT INTO outcome_measures (name, description, unit, min_value, max_value)
VALUES 
    ('Housing Stability Score', '1-10 scale where 1 is homeless and 10 is permanent ownership', 'scale', 1, 10),
    ('PHQ-9 Depression Score', 'Standard depression screening tool. Higher is worse.', 'score', 0, 27),
    ('Self-Sufficiency Matrix', 'Composite score of financial and social independence', 'score', 1, 5)
ON CONFLICT DO NOTHING;
