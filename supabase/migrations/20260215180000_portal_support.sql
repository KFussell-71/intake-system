-- Migration: 20260215180000_portal_support.sql
-- Description: Adds tables and columns required for the Client Portal features (Document Center, Portal Access).

BEGIN;

-- 1. Create client_users table (Links Auth Users to Clients for Portal Access)
CREATE TABLE IF NOT EXISTS client_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one active link per client if needed, or allow multiple?
    -- For now, unique constraint on client_id is probably too strict if multiple family members share?
    -- But strict 1:1 simplifies things.
    CONSTRAINT unique_client_invitation UNIQUE (client_id, id)
);

-- RLS for client_users
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- Users can view their own link
CREATE POLICY "Users can view own client link" ON client_users
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Staff can manage links (Assignments handled elsewhere)
CREATE POLICY "Staff can manage client links" ON client_users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = client_users.client_id 
            AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
        ) OR
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor', 'case_manager')
    );


-- 2. Create document_requests table
CREATE TABLE IF NOT EXISTS document_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'verified', 'rejected')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    document_id UUID REFERENCES documents(id), -- Link to uploaded document
    created_by UUID REFERENCES profiles(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for document_requests
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

-- Client can view their own requests (via client_users link)
CREATE POLICY "Clients can view own document requests" ON document_requests
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_users 
            WHERE client_users.id = auth.uid() 
            AND client_users.client_id = document_requests.client_id
            AND client_users.is_active = true
        ) OR
        -- Staff access
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = document_requests.client_id 
            AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
        ) OR
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor', 'case_manager')
    );
    
-- Clients can UPDATE requests (to link document) - strictly speaking upload action does this with service role?
-- But if using standard RLS, client needs update permission on status/document_id.
-- However, uploadPortalDocument uses server action with `createClient` (service role? No, usually user context).
-- So we need policy.

CREATE POLICY "Clients can update verify own requests" ON document_requests
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM client_users 
            WHERE client_users.id = auth.uid() 
            AND client_users.client_id = document_requests.client_id
            AND client_users.is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM client_users 
            WHERE client_users.id = auth.uid() 
            AND client_users.client_id = document_requests.client_id
            AND client_users.is_active = true
        )
    );

-- Staff can manage document requests
CREATE POLICY "Staff can manage document requests" ON document_requests
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = document_requests.client_id 
            AND (clients.assigned_to = auth.uid() OR clients.created_by = auth.uid())
        ) OR
        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'supervisor', 'case_manager')
    );


-- 3. Update tracking_milestones
-- Add step_order and description if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracking_milestones' AND column_name = 'step_order') THEN
        ALTER TABLE tracking_milestones ADD COLUMN step_order INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracking_milestones' AND column_name = 'description') THEN
        ALTER TABLE tracking_milestones ADD COLUMN description TEXT;
    END IF;
END $$;


-- 4. Triggers for updated_at
CREATE TRIGGER update_client_users_updated_at BEFORE UPDATE ON client_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_document_requests_updated_at BEFORE UPDATE ON document_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

COMMIT;
