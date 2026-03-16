-- Create the av_resources table
CREATE TABLE IF NOT EXISTS public.av_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    triggers TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.av_resources ENABLE ROW LEVEL SECURITY;

-- Create policies (Adjust based on your auth model, for now enabling read for all, write for authenticated)
-- Create policies (Adjust based on your auth model, for now enabling read for all, write for authenticated)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'av_resources' AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access" ON public.av_resources
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'av_resources' AND policyname = 'Allow authenticated insert'
    ) THEN
        CREATE POLICY "Allow authenticated insert" ON public.av_resources
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'av_resources' AND policyname = 'Allow authenticated update'
    ) THEN
        CREATE POLICY "Allow authenticated update" ON public.av_resources
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'av_resources' AND policyname = 'Allow authenticated delete'
    ) THEN
        CREATE POLICY "Allow authenticated delete" ON public.av_resources
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Create an index on triggers for potentially faster array searching (though usually small)
CREATE INDEX IF NOT EXISTS idx_av_resources_triggers ON public.av_resources USING GIN (triggers);
