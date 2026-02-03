-- Search Features Migration
-- Created: 2026-02-03
-- Purpose: Enable global full-text search across Clients and Documents

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add GIN Indexes for fast text search
CREATE INDEX IF NOT EXISTS idx_clients_search 
ON clients 
USING GIN (to_tsvector('english', name || ' ' || email || ' ' || coalesce(phone, '')));

CREATE INDEX IF NOT EXISTS idx_documents_search 
ON documents 
USING GIN (to_tsvector('english', name || ' ' || coalesce(description, '')));

-- 3. Global Search RPC
-- Returns a unified shape for the command palette
CREATE OR REPLACE FUNCTION global_search(
    query_text text,
    limit_count int DEFAULT 5
)
RETURNS TABLE (
    type text,
    id uuid,
    title text,
    subtitle text,
    url text,
    created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Use DEFINER to optimize, but filter manually for RLS enforcement
SET search_path = public
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();

    RETURN QUERY
    -- Search Clients
    SELECT 
        'client'::text as type,
        c.id,
        c.name as title,
        c.email as subtitle,
        '/dashboard/clients/' || c.id as url,
        c.created_at
    FROM clients c
    WHERE 
        (
            to_tsvector('english', c.name || ' ' || c.email || ' ' || coalesce(c.phone, '')) 
            @@ websearch_to_tsquery('english', query_text)
            OR
            c.name ILIKE '%' || query_text || '%' -- Fallback for partial matches
        )
        AND (
            -- Manual RLS Enforcement logic matching our policies
            c.assigned_to = current_user_id 
            OR c.created_by = current_user_id
            OR EXISTS (
                SELECT 1 FROM profiles p 
                WHERE p.id = current_user_id AND p.role IN ('supervisor', 'admin')
            )
        )
    
    UNION ALL

    -- Search Documents
    SELECT 
        'document'::text as type,
        d.id,
        d.name as title,
        left(d.description, 50) as subtitle,
        d.file_url as url, -- Or link to viewer
        d.created_at
    FROM documents d
    JOIN clients c ON d.client_id = c.id
    WHERE 
        (
            to_tsvector('english', d.name || ' ' || coalesce(d.description, '')) 
            @@ websearch_to_tsquery('english', query_text)
             OR
            d.name ILIKE '%' || query_text || '%'
        )
        AND (
            -- Inherit access from client
            c.assigned_to = current_user_id 
            OR c.created_by = current_user_id
             OR EXISTS (
                SELECT 1 FROM profiles p 
                WHERE p.id = current_user_id AND p.role IN ('supervisor', 'admin')
            )
        )
    
    ORDER BY created_at DESC
    LIMIT limit_count;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION global_search TO authenticated;
GRANT EXECUTE ON FUNCTION global_search TO service_role;
