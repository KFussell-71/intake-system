-- SAFE RLS Migration - Only applies to existing tables
-- Created: 2026-02-02
-- Purpose: Enable RLS on all existing tables without errors

-- ============================================
-- HELPER FUNCTION: Check if table exists
-- ============================================

CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ENABLE RLS ON EXISTING CORE TABLES
-- ============================================

-- Only enable RLS if table exists
DO $$
BEGIN
    -- Core tables
    IF table_exists('profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('clients') THEN
        ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('client_assignments') THEN
        ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('intakes') THEN
        ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('documents') THEN
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('employment_history') THEN
        ALTER TABLE employment_history ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('isp_goals') THEN
        ALTER TABLE isp_goals ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('supportive_services') THEN
        ALTER TABLE supportive_services ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('follow_ups') THEN
        ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('employment_prep') THEN
        ALTER TABLE employment_prep ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('retention_contacts') THEN
        ALTER TABLE retention_contacts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('job_placements') THEN
        ALTER TABLE job_placements ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('medical_assessments') THEN
        ALTER TABLE medical_assessments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('skills_assessments') THEN
        ALTER TABLE skills_assessments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('notifications') THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('email_logs') THEN
        ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('search_history') THEN
        ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('saved_searches') THEN
        ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('analytics_events') THEN
        ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('document_shares') THEN
        ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('audit_logs') THEN
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF table_exists('system_logs') THEN
        ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- PROFILES POLICIES (if table exists)
-- ============================================

DO $$
BEGIN
    IF table_exists('profiles') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
        DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
        
        -- Create new policies
        CREATE POLICY "Users can view own profile"
        ON profiles FOR SELECT TO authenticated
        USING (id = auth.uid());
        
        CREATE POLICY "Users can update own profile"
        ON profiles FOR UPDATE TO authenticated
        USING (id = auth.uid())
        WITH CHECK (id = auth.uid());
        
        CREATE POLICY "Admins can view all profiles"
        ON profiles FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'supervisor')
            )
        );
        
        CREATE POLICY "Admins can insert profiles"
        ON profiles FOR INSERT TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- ============================================
-- CLIENTS POLICIES (if table exists)
-- ============================================

DO $$
BEGIN
    IF table_exists('clients') THEN
        DROP POLICY IF EXISTS "Clients can view own data" ON clients;
        DROP POLICY IF EXISTS "Staff can view assigned clients" ON clients;
        DROP POLICY IF EXISTS "Staff can update assigned clients" ON clients;
        DROP POLICY IF EXISTS "Admins can insert clients" ON clients;
        
        CREATE POLICY "Clients can view own data"
        ON clients FOR SELECT TO authenticated
        USING (id = auth.uid());
        
        CREATE POLICY "Staff can view assigned clients"
        ON clients FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM client_assignments 
                WHERE client_id = clients.id 
                AND assigned_worker_id = auth.uid()
                AND active = true
            )
            OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('supervisor', 'admin')
            )
        );
        
        CREATE POLICY "Staff can update assigned clients"
        ON clients FOR UPDATE TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM client_assignments 
                WHERE client_id = clients.id 
                AND assigned_worker_id = auth.uid()
                AND active = true
            )
            OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('supervisor', 'admin')
            )
        );
        
        CREATE POLICY "Admins can insert clients"
        ON clients FOR INSERT TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'supervisor', 'staff')
            )
        );
    END IF;
END $$;

-- ============================================
-- AUDIT LOGS POLICIES (if table exists)
-- ============================================

DO $$
BEGIN
    IF table_exists('audit_logs') THEN
        DROP POLICY IF EXISTS "Staff can view own audit logs" ON audit_logs;
        DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON audit_logs;
        
        CREATE POLICY "Staff can view own audit logs"
        ON audit_logs FOR SELECT TO authenticated
        USING (
            user_id = auth.uid()
            OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('supervisor', 'admin')
            )
        );
        
        CREATE POLICY "Authenticated can insert audit logs"
        ON audit_logs FOR INSERT TO authenticated
        WITH CHECK (true);
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show which tables have RLS enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;
