-- Clinical Data Integrity Schema
-- Created: 2026-02-03
-- Purpose: Separate Counselor Rationale from Client Claims & Track History

-- 1. Intake Assessments (Counselor's View)
CREATE TABLE IF NOT EXISTS intake_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES profiles(id) DEFAULT auth.uid(),
    
    -- Clinical Rationale
    verified_barriers TEXT[], -- proven subset of client's 'barriers'
    clinical_narrative TEXT, -- "The Story"
    
    -- Eligibility
    recommended_priority_level INTEGER CHECK (recommended_priority_level BETWEEN 1 AND 3),
    eligibility_status TEXT CHECK (eligibility_status IN ('pending', 'eligible', 'ineligible')),
    eligibility_rationale TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intake_assessments ENABLE ROW LEVEL SECURITY;

-- RLS: Staff can view assessments for clients they are assigned to
CREATE POLICY "Staff can view assigned assessments" ON intake_assessments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM intakes
    JOIN clients ON clients.id = intakes.client_id
    WHERE intakes.id = intake_assessments.intake_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- RLS: Staff can create/edit assessments for assigned clients
CREATE POLICY "Staff can manage assigned assessments" ON intake_assessments
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM intakes
    JOIN clients ON clients.id = intakes.client_id
    WHERE intakes.id = intake_assessments.intake_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));


-- 2. Intake Events (Immutable History)
CREATE TABLE IF NOT EXISTS intake_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES intakes(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) DEFAULT auth.uid(),
    
    event_type TEXT NOT NULL, -- 'STATUS_CHANGE', 'RATIONALE_UPDATE', 'SUBMITTED'
    previous_state JSONB,
    new_state JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intake_events ENABLE ROW LEVEL SECURITY;

-- RLS: View access for assigned staff
CREATE POLICY "Staff can view assigned events" ON intake_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM intakes
    JOIN clients ON clients.id = intakes.client_id
    WHERE intakes.id = intake_events.intake_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- RLS: Insert access (System/Staff driven)
CREATE POLICY "Staff can log events" ON intake_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM intakes
    JOIN clients ON clients.id = intakes.client_id
    WHERE intakes.id = intake_events.intake_id
    AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
  ));

-- RLS: NO UPDATE/DELETE (Immutability Enforcement)
-- No policies created for UPDATE or DELETE implies DENY ALL by default in Supabase/Postgres RLS
