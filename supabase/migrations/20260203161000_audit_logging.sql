-- Audit Logging for Hard Deletes
-- Created: 2026-02-03
-- Purpose: Track permanent data removal for forensic security

-- 1. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name text NOT NULL,
    record_id uuid NOT NULL,
    operation text NOT NULL CHECK (operation IN ('DELETE', 'UPDATE', 'INSERT')),
    old_data jsonb,
    new_data jsonb,
    performed_by uuid DEFAULT auth.uid(),
    performed_at timestamptz DEFAULT now()
);

-- Enable RLS (Admins only read)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
    -- Assuming an 'admin' role or specific user via metadata/table
    -- For now, strict: only users with 'service_role' or specific admin flag in JWT
    (auth.jwt() ->> 'role') = 'service_role' 
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 2. Trigger Function
CREATE OR REPLACE FUNCTION public.log_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        performed_by
    ) VALUES (
        TG_TABLE_NAME,
        OLD.id,
        'DELETE',
        to_jsonb(OLD),
        auth.uid()
    );
    RETURN OLD;
END;
$$;

-- 3. Attach Triggers to Critical Tables
-- Clients
DROP TRIGGER IF EXISTS log_clients_delete ON clients;
CREATE TRIGGER log_clients_delete
BEFORE DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION public.log_hard_delete();

-- Intakes
DROP TRIGGER IF EXISTS log_intakes_delete ON intakes;
CREATE TRIGGER log_intakes_delete
BEFORE DELETE ON intakes
FOR EACH ROW EXECUTE FUNCTION public.log_hard_delete();

-- Documents
DROP TRIGGER IF EXISTS log_documents_delete ON documents;
CREATE TRIGGER log_documents_delete
BEFORE DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION public.log_hard_delete();
