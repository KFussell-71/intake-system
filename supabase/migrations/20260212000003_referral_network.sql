-- 1. Create service_providers table (Directory)
CREATE TABLE IF NOT EXISTS service_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Housing', 'Food', 'Legal', 'Health', 'Mental Health', 'Employment', 'Education')),
    description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    website TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'full')),
    capacity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create referrals table (Tracking)
CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES service_providers(id),
    
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
    referral_date TIMESTAMPTZ DEFAULT NOW(),
    outcome_notes TEXT,
    
    referred_by UUID REFERENCES profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_case_id ON referrals(case_id);
CREATE INDEX IF NOT EXISTS idx_referrals_provider_id ON referrals(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_category ON service_providers(category);

-- 4. RLS
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active providers"
    ON service_providers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can manage referrals for cases"
    ON referrals FOR ALL
    TO authenticated
    USING (true);

-- 5. Seed Data
INSERT INTO service_providers (name, category, description, status)
VALUES
    ('Hope Housing First', 'Housing', 'Emergency shelter and rapid re-housing services.', 'active'),
    ('Community Food Bank', 'Food', 'Weekly food pantry and hot meals.', 'active'),
    ('Legal Aid Society', 'Legal', 'Pro bono legal assistance for civil matters.', 'full'),
    ('City Health Clinic', 'Health', 'Primary care and vaccinations.', 'active')
ON CONFLICT DO NOTHING;
