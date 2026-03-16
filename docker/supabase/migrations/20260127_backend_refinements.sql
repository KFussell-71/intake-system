-- Refine clients table with status
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'completed'));

-- Create audit function
CREATE OR REPLACE FUNCTION audit_record_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id 
            ELSE NEW.id 
        END,
        jsonb_build_object(
            'old', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
            'new', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
        )
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for automatic auditing
DROP TRIGGER IF EXISTS audit_clients_change ON clients;
CREATE TRIGGER audit_clients_change
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION audit_record_change();

DROP TRIGGER IF EXISTS audit_intakes_change ON intakes;
CREATE TRIGGER audit_intakes_change
AFTER INSERT OR UPDATE OR DELETE ON intakes
FOR EACH ROW EXECUTE FUNCTION audit_record_change();

-- Create RPC for atomic client + intake creation
CREATE OR REPLACE FUNCTION create_client_intake(
    p_name TEXT,
    p_phone TEXT,
    p_email TEXT,
    p_address TEXT,
    p_report_date DATE,
    p_completion_date DATE,
    p_intake_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_client_id UUID;
    v_intake_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Insert client
    INSERT INTO clients (name, phone, email, address, created_by)
    VALUES (p_name, p_phone, p_email, p_address, v_user_id)
    RETURNING id INTO v_client_id;

    -- Insert intake
    INSERT INTO intakes (client_id, report_date, completion_date, prepared_by, data)
    VALUES (v_client_id, p_report_date, p_completion_date, v_user_id, p_intake_data)
    RETURNING id INTO v_intake_id;

    RETURN jsonb_build_object(
        'client_id', v_client_id,
        'intake_id', v_intake_id
    );
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create client intake: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refine RLS for audit_logs (only allow system/admins to read, no one to edit/delete)
DROP POLICY IF EXISTS "Staff can do everything" ON audit_logs;
CREATE POLICY "Staff can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "No one can modify audit logs" ON audit_logs FOR ALL TO authenticated USING (false) WITH CHECK (false);
