-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('intake', 'follow_up', 'crisis', 'service_planning', 'other')),
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'rescheduled', 'completed', 'cancelled', 'no_show')),
    location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Staff can view all appointments" 
    ON appointments FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can create appointments" 
    ON appointments FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Staff can update appointments" 
    ON appointments FOR UPDATE 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can delete appointments" 
    ON appointments FOR DELETE 
    USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
