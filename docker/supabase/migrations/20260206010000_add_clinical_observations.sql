-- SME REMEDIATION: Structured Clinical Data
-- Date: 2026-02-06
-- Description: Add JSONB column for structured clinical observations (Barrier/Accommodation)

BEGIN;

-- 1. Add jsonb column to intakes table
ALTER TABLE intakes 
ADD COLUMN IF NOT EXISTS clinical_observations JSONB DEFAULT '[]'::jsonb;

-- 2. Add validation constraint (optional but good for structure)
-- We won't enforce schema at DB level yet to allow flexibility, 
-- but we comment the expected structure.
COMMENT ON COLUMN intakes.clinical_observations IS 
'Structured array of clinical observations. 
Expected format: { "category": string, "observation": string, "functional_limitation": string, "accommodation": string }[]';

COMMIT;
