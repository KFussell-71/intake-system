-- Migration: 20260207_rate_limiting
-- Description: Adds a persistent table to track API usage and prevent abuse

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- user_id or IP address
    resource TEXT NOT NULL,   -- e.g., 'gemini_ai', 'report_export'
    count INTEGER DEFAULT 1,
    last_request_at TIMESTAMPTZ DEFAULT now(),
    reset_at TIMESTAMPTZ NOT NULL,
    
    UNIQUE(identifier, resource)
);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits (reset_at);

-- RLS: Only service_role can manage rate limits (internal use only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal service access only" ON public.rate_limits
    FOR ALL
    USING (auth.role() = 'service_role');

-- Cleanup Function
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM public.rate_limits WHERE reset_at < now();
END;
$$ LANGUAGE plpgsql;
