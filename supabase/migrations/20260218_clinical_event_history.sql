-- BLUE TEAM ADVANCED: CAUSAL AUDIT & EVENT HISTORY
-- Implements tracking for clinical decisions and field-level changes.

-- 1. Clinical Rationales (The "Why")
CREATE TABLE IF NOT EXISTS public.clinical_rationales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES public.intakes(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL, -- The field this rationale explains
    content TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clinical Event Log (Field-level History)
CREATE TABLE IF NOT EXISTS public.clinical_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID REFERENCES public.intakes(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    rationale_id UUID REFERENCES public.clinical_rationales(id),
    changed_by UUID REFERENCES public.profiles(id),
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add Rationale Reference to Intakes (Optional but helpful for direct lookup)
ALTER TABLE public.intakes ADD COLUMN IF NOT EXISTS diagnosis_rationale_id UUID REFERENCES public.clinical_rationales(id);

-- 4. RLS & Permissions
ALTER TABLE public.clinical_rationales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_event_log ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for staff/supervisors)
CREATE POLICY "Staff can manage rationales" ON public.clinical_rationales
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM intakes WHERE intakes.id = clinical_rationales.intake_id AND (intakes.prepared_by = auth.uid() OR EXISTS (SELECT 1 FROM clients WHERE clients.id = intakes.client_id AND clients.assigned_to = auth.uid()))));

CREATE POLICY "Staff can view event logs" ON public.clinical_event_log
    FOR SELECT TO authenticated
    USING (true); -- Usually auditors/supervisors only, but staff benefit from history

-- 5. Helper Function for Event Logging (to be used by RPCs or Trigger)
CREATE OR REPLACE FUNCTION log_clinical_change()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be a generic trigger, but clinical events are better handled at the Service/RPC layer
    -- for explicit rationale linking. Keeping as a placeholder for manual calls.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
