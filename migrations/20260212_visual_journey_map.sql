-- Migration: 20260212_visual_journey_map
-- Description: Adds step_order and description columns to tracking_milestones for the Visual Journey Map.

-- 1. Add new columns
ALTER TABLE tracking_milestones 
ADD COLUMN IF NOT EXISTS step_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Seed generic milestones for existing clients if they don't have them
-- This is a bit complex, easier to just update existing records if they exist.
-- Let's assume the app creates them. For now, we'll just ensure the columns exist.

-- 3. (Optional) Create a 'milestone_templates' table if we want standard steps
-- For now, we'll stick to the existing table but make it richer.

-- 4. Update existing milestones with arbitrary order based on name (just for demo)
-- Case 1: "Intake" -> 1
UPDATE tracking_milestones SET step_order = 1, description = 'Initial meeting and assessment' WHERE milestone_name ILIKE '%intake%';
-- Case 2: "Assessment" -> 2
UPDATE tracking_milestones SET step_order = 2, description = 'Skills and needs evaluation' WHERE milestone_name ILIKE '%assessment%';
-- Case 3: "Plan" -> 3
UPDATE tracking_milestones SET step_order = 3, description = 'Developing your Individual Service Plan' WHERE milestone_name ILIKE '%plan%';
-- Case 4: "Placement" -> 4
UPDATE tracking_milestones SET step_order = 4, description = 'Job search and placement' WHERE milestone_name ILIKE '%placement%';
-- Case 5: "Retention" -> 5
UPDATE tracking_milestones SET step_order = 5, description = 'Post-employment support' WHERE milestone_name ILIKE '%retention%';
