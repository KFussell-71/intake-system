
-- Create community_resources table
CREATE TABLE IF NOT EXISTS community_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Food', 'Housing', 'Employment', 'Health', 'Legal', 'Education', 'Other')),
    description TEXT,
    address TEXT,
    phone TEXT,
    website TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    source TEXT DEFAULT 'manual',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE community_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to everyone" ON community_resources
    FOR SELECT USING (true);

CREATE POLICY "Allow write access to authenticated users" ON community_resources
    FOR ALL USING (auth.role() = 'authenticated');

-- Seed Data (Example from user request)
INSERT INTO community_resources (name, category, description, address, is_verified, source, tags)
VALUES 
('Paving the Way Foundation', 'Employment', 'Job training and employment services.', 'Antelope Valley', TRUE, 'manual', ARRAY['training', 'jobs']),
('Grace Resources', 'Food', 'Food pantry and hot meals.', '45134 Sierra Hwy, Lancaster, CA 93534', TRUE, 'manual', ARRAY['pantry', 'meals']);
