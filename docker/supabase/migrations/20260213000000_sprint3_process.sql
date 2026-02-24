-- Migration: 20260213000000_sprint3_process.sql
-- Purpose: Implement "Process Not Form" (Tasks) and "Dynamic Rules" (Engine)

-- 1. Intake Tasks (The "Process" Engine)
-- Tasks represent actionable units of work, distinct from data entry.
CREATE TABLE IF NOT EXISTS intake_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_id UUID NOT NULL REFERENCES intakes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL CHECK (task_type IN ('document_request', 'verification', 'signature', 'review', 'manual_action')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'waived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low', 'critical')),
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

COMMENT ON TABLE intake_tasks IS 'Granular workflow items for an intake case.';

-- 2. Intake Rules (The "Intelligence" Engine)
-- Dynamic rules to control UI behavior and workflow automation.
CREATE TABLE IF NOT EXISTS intake_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_code TEXT UNIQUE NOT NULL, -- Human readable ID, e.g., 'HIDE_MED_IF_RESUME_ONLY'
  description TEXT,
  trigger_context TEXT NOT NULL, -- e.g., 'intake_wizard', 'submission'
  condition_json JSONB NOT NULL, -- Logic: { field: 'service_type', op: 'eq', value: 'resume' }
  action_json JSONB NOT NULL,    -- Effect: { action: 'hide_step', target: 'medical' }
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE intake_rules IS 'Dynamic logic configuration for UI and workflow automation.';

-- 3. RLS Policies

-- TASKS
ALTER TABLE intake_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view tasks for own cases" ON intake_tasks
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
  OR assigned_to = auth.uid() -- Staff can see tasks explicitly assigned to them
);

CREATE POLICY "Staff update tasks for own cases" ON intake_tasks
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM intakes i WHERE i.id = intake_id AND (i.created_by = auth.uid() OR i.client_id IN (SELECT id FROM clients WHERE assigned_to = auth.uid())))
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('supervisor','admin'))
  OR assigned_to = auth.uid()
);

-- RULES (Read-only for most, Admin manage)
ALTER TABLE intake_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read active rules" ON intake_rules
FOR SELECT TO authenticated
USING (active = true);

CREATE POLICY "Admins manage rules" ON intake_rules
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Audit Support
-- Ensure tasks changes generate audit events (Trigger)
-- Note: We reuse the existing intake_events table logic via application layer or generic trigger if available.
-- For now, we rely on the application `TaskService` to insert into `intake_events`.

-- 5. Seed Common Rules
INSERT INTO intake_rules (rule_code, description, trigger_context, condition_json, action_json) VALUES
('HIDE_MEDICAL_FOR_RESUME', 'Hide medical section if service type is strictly Resume Help', 'intake_wizard', 
 '{"field": "serviceType", "op": "eq", "value": "resume_help"}', 
 '{"action": "hide_step", "target": "medical"}')
ON CONFLICT (rule_code) DO NOTHING;
