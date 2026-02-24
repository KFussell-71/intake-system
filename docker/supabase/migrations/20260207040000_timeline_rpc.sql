-- Migration: 20260207_timeline_rpc
-- Description: Consolidates timeline event aggregation into a single database RPC for performance.

CREATE OR REPLACE FUNCTION get_client_timeline_events(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH events AS (
    -- 1. Intakes
    SELECT 
      id::text, 
      created_at as date, 
      'intake' as type, 
      'Intake Assessment' as title, 
      status, 
      'Report Date: ' || report_date as description
    FROM intakes
    WHERE client_id = p_client_id
    
    UNION ALL
    
    -- 2. Case Notes (Targeted types only)
    SELECT 
      id::text, 
      created_at as date, 
      'note' as type, 
      CASE WHEN type = 'incident' THEN 'Incident Report' ELSE 'Clinical Note' END as title, 
      null as status, 
      CASE 
        WHEN length(content) > 50 THEN substring(content from 1 for 47) || '...'
        ELSE content 
      END as description
    FROM case_notes
    WHERE client_id = p_client_id AND type IN ('incident', 'clinical')
    
    UNION ALL
    
    -- 3. Client Creation
    SELECT 
      'creation'::text as id, 
      created_at as date, 
      'system' as type, 
      'Client Profile Created' as title, 
      null as status, 
      'Initial registration' as description
    FROM clients
    WHERE id = p_client_id
  )
  SELECT jsonb_agg(row_to_json(e) ORDER BY date DESC)
  INTO result
  FROM events e;

  RETURN coalesce(result, '[]'::jsonb);
END;
$$;
