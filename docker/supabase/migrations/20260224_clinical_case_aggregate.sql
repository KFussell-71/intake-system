-- R&D Program: Distributed Clinical Node - ClinicalCase Aggregate Root
-- Purpose: Enable deterministic sync and conflict resolution across offline nodes.

-- 1. Create clinical_cases aggregate root
CREATE TABLE IF NOT EXISTS clinical_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1 NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'verified', 'conflict')),
    data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb, -- Includes hardware_id, device_name, etc.
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 2. Create clinical_case_events for deterministic replay
CREATE TABLE IF NOT EXISTS clinical_case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES clinical_cases(id) ON DELETE CASCADE,
    version INTEGER NOT NULL, -- Match the case version at the time of event
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    actor_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for sync performance
CREATE INDEX idx_clinical_cases_client_id ON clinical_cases(client_id);
CREATE INDEX idx_clinical_cases_version ON clinical_cases(version);
CREATE INDEX idx_clinical_case_events_case_id_version ON clinical_case_events(case_id, version);

-- 4. Sync Function (Conflict-Aware)
CREATE OR REPLACE FUNCTION sync_clinical_case(
    p_case_id UUID,
    p_client_id UUID,
    p_local_version INTEGER,
    p_data JSONB,
    p_events JSONB -- Array of events since last host sync
) RETURNS JSONB AS $$
DECLARE
    v_current_version INTEGER;
    v_new_version INTEGER;
    v_event JSONB;
BEGIN
    -- Check current server version
    SELECT version INTO v_current_version FROM clinical_cases WHERE id = p_case_id;

    -- CASE 1: New Record
    IF NOT FOUND THEN
        INSERT INTO clinical_cases (id, client_id, version, data, last_synced_at)
        VALUES (p_case_id, p_client_id, p_local_version, p_data, NOW());
        
        -- Insert associated events
        FOR v_event IN SELECT * FROM jsonb_array_elements(p_events) LOOP
            INSERT INTO clinical_case_events (case_id, version, event_type, payload, actor_id)
            VALUES (p_case_id, (v_event->>'version')::INTEGER, v_event->>'type', v_event->'payload', (v_event->>'actor_id')::UUID);
        END LOOP;

        RETURN jsonb_build_object('status', 'created', 'version', p_local_version);
    END IF;

    -- CASE 2: Conflict Detection (Client version behind server)
    IF p_local_version <= v_current_version THEN
        RETURN jsonb_build_object(
            'status', 'conflict', 
            'current_version', v_current_version,
            'message', 'Server has a more recent or equal version. Manual resolution required.'
        );
    END IF;

    -- CASE 3: Clean Update (Fast-forward)
    v_new_version := p_local_version;
    UPDATE clinical_cases 
    SET version = v_new_version, 
        data = p_data, 
        updated_at = NOW(),
        last_synced_at = NOW()
    WHERE id = p_case_id;

    -- Append events
    FOR v_event IN SELECT * FROM jsonb_array_elements(p_events) LOOP
        -- Only insert events that are newer than current server version
        IF (v_event->>'version')::INTEGER > v_current_version THEN
            INSERT INTO clinical_case_events (case_id, version, event_type, payload, actor_id)
            VALUES (p_case_id, (v_event->>'version')::INTEGER, v_event->>'type', v_event->'payload', (v_event->>'actor_id')::UUID);
        END IF;
    END LOOP;

    RETURN jsonb_build_object('status', 'synced', 'version', v_new_version);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies
ALTER TABLE clinical_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_case_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all cases" ON clinical_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert/update cases" ON clinical_cases FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Staff can view all events" ON clinical_case_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can insert events" ON clinical_case_events FOR INSERT TO authenticated WITH CHECK (true);
