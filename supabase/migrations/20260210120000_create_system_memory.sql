-- Create system_memory table
CREATE TABLE IF NOT EXISTS public.system_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    model TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_duration_ms INTEGER,
    status TEXT CHECK (status IN ('success', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.system_memory ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'system_memory' AND policyname = 'Allow supervisor access'
    ) THEN
        CREATE POLICY "Allow supervisor access" ON public.system_memory
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
