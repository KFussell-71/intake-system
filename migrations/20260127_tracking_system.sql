-- Add curriculum tracking for Employment Preparation Services
CREATE TABLE IF NOT EXISTS employment_prep (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    class_1_date DATE, -- Fair chance hiring
    class_2_date DATE, -- Interviewing Techniques
    class_3_date DATE, -- Work behaviors
    class_4_date DATE, -- Hygiene & Grooming
    application_complete BOOLEAN DEFAULT FALSE,
    resume_complete BOOLEAN DEFAULT FALSE,
    master_app_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance job placements with details from the tracking document
ALTER TABLE job_placements 
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS hours_per_week INTEGER,
ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
ADD COLUMN IF NOT EXISTS supervisor_phone TEXT,
ADD COLUMN IF NOT EXISTS probation_ends DATE,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS transportation_type TEXT CHECK (transportation_type IN ('bus', 'car', 'other')),
ADD COLUMN IF NOT EXISTS commute_time TEXT;

-- Create retention contacts table for the 90-day period
CREATE TABLE IF NOT EXISTS retention_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    contact_date DATE NOT NULL,
    method TEXT CHECK (method IN ('phone', 'in-person')),
    respondent TEXT CHECK (respondent IN ('employer', 'consumer')),
    performance TEXT CHECK (performance IN ('good', 'needs-improvement')),
    changes_description TEXT,
    barrier_description TEXT,
    actions_taken TEXT,
    consumer_views TEXT,
    contact_number INTEGER CHECK (contact_number BETWEEN 1 AND 6), -- 2 per month for 3 months
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE employment_prep ENABLE ROW LEVEL SECURITY;
ALTER TABLE retention_contacts ENABLE ROW LEVEL SECURITY;

-- SECURITY REMEDIATION: FINDING 4 - Scoped RLS Policies
-- Ensures only assigned workers or supervisors can access client prep data
CREATE POLICY "Staff can view assigned employment_prep" ON employment_prep 
FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM client_assignments 
        WHERE client_id = employment_prep.client_id 
        AND assigned_worker_id = auth.uid()
        AND active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);

CREATE POLICY "Staff can manage assigned employment_prep" ON employment_prep 
FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM client_assignments 
        WHERE client_id = employment_prep.client_id 
        AND assigned_worker_id = auth.uid()
        AND active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM client_assignments 
        WHERE client_id = employment_prep.client_id 
        AND assigned_worker_id = auth.uid()
        AND active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);

CREATE POLICY "Staff can view assigned retention_contacts" ON retention_contacts 
FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM client_assignments 
        WHERE client_id = retention_contacts.client_id 
        AND assigned_worker_id = auth.uid()
        AND active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);

CREATE POLICY "Staff can manage assigned retention_contacts" ON retention_contacts 
FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM client_assignments 
        WHERE client_id = retention_contacts.client_id 
        AND assigned_worker_id = auth.uid()
        AND active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM client_assignments 
        WHERE client_id = retention_contacts.client_id 
        AND assigned_worker_id = auth.uid()
        AND active = true
    )
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role IN ('supervisor', 'admin')
    )
);

-- Add audit triggers for new tables
CREATE TRIGGER audit_employment_prep_change
AFTER INSERT OR UPDATE OR DELETE ON employment_prep
FOR EACH ROW EXECUTE FUNCTION audit_record_change();

CREATE TRIGGER audit_retention_contacts_change
AFTER INSERT OR UPDATE OR DELETE ON retention_contacts
FOR EACH ROW EXECUTE FUNCTION audit_record_change();
