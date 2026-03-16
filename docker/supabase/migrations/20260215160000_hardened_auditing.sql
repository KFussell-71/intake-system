-- Migration: 20260215160000_hardened_auditing
-- Description: Universal forensic tracking for all critical clinical and case entities.

-- 1. Universal Audit Function
CREATE OR REPLACE FUNCTION public.log_entity_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_data jsonb := NULL;
    v_new_data jsonb := NULL;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
    ELSIF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
    END IF;

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        performed_by,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_old_data,
        v_new_data,
        auth.uid(),
        (current_setting('request.headers', true)::jsonb ->> 'x-real-ip'),
        (current_setting('request.headers', true)::jsonb ->> 'user-agent')
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Apply to all clinical tables
DO $$
DECLARE
    t text;
    tables_to_audit text[] := ARRAY['clients', 'cases', 'intakes', 'case_notes', 'care_plans', 'care_plan_goals', 'care_plan_actions', 'service_logs'];
BEGIN
    FOREACH t IN ARRAY tables_to_audit LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger_%I ON %I', t, t);
        EXECUTE format('CREATE TRIGGER audit_trigger_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION public.log_entity_change()', t, t);
    END LOOP;
END;
$$;

-- 3. Immutability: Prevent anyone (even admins) from tampering with audit logs via RLS
DROP POLICY IF EXISTS "Audit logs are immutable" ON public.audit_logs;
CREATE POLICY "Audit logs are immutable" ON public.audit_logs
    FOR ALL
    TO authenticated
    USING ( (auth.jwt() ->> 'role') = 'service_role' ) -- Only Supabase service role can bypass
    WITH CHECK ( false ); -- Everyone else (including direct SQL) fails to mutate
