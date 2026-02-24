-- Migration: 20260217050000_upgrade_intake_bundle_rpc.sql
-- Purpose: Upgrade get_client_intake_bundle to correctly aggregate relational clinical data.

CREATE OR REPLACE FUNCTION get_client_intake_bundle(p_client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'client', (
      SELECT row_to_json(c)
      FROM clients c
      WHERE c.id = p_client_id
    ),
    'intake', (
      SELECT jsonb_build_object(
        'id', i.id,
        'client_id', i.client_id,
        'report_date', i.report_date,
        'completion_date', i.completion_date,
        'status', i.status,
        'prepared_by', i.prepared_by,
        'primary_diagnosis_code', i.primary_diagnosis_code,
        'mobility_status', i.mobility_status,
        'eligibility_status', i.eligibility_status,
        'priority_level', i.priority_level,
        'signature', i.signature, -- Base64 blob if present
        'details', i.data, -- Fallback for legacy fields
        'created_at', i.created_at
      )
      FROM intakes i
      WHERE i.client_id = p_client_id
      ORDER BY i.created_at DESC
      LIMIT 1
    ),
    'medical', (
      SELECT row_to_json(m)
      FROM intake_medical m
      JOIN intakes i ON i.id = m.intake_id
      WHERE i.client_id = p_client_id
      ORDER BY i.created_at DESC
      LIMIT 1
    ),
    'employment', (
      SELECT row_to_json(e)
      FROM intake_employment e
      JOIN intakes i ON i.id = e.intake_id
      WHERE i.client_id = p_client_id
      ORDER BY i.created_at DESC
      LIMIT 1
    ),
    'observations', (
      SELECT coalesce(jsonb_agg(row_to_json(o)), '[]'::jsonb)
      FROM observations o
      JOIN intakes i ON i.id = o.intake_id
      WHERE i.client_id = p_client_id
    ),
    'barriers', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('name', b.name, 'category', b.category)), '[]'::jsonb)
      FROM barriers b
      JOIN intake_barriers ib ON ib.barrier_id = b.id
      JOIN intakes i ON i.id = ib.intake_id
      WHERE i.client_id = p_client_id
    ),
    'documents', (
      SELECT coalesce(jsonb_agg(row_to_json(d)), '[]'::jsonb)
      FROM documents d
      WHERE d.client_id = p_client_id
    ),
    'isp_goals', (
      SELECT coalesce(jsonb_agg(row_to_json(g)), '[]'::jsonb)
      FROM isp_goals g
      WHERE g.client_id = p_client_id
    ),
    'supportive_services', (
      SELECT coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb)
      FROM supportive_services s
      WHERE s.client_id = p_client_id
    ),
    'follow_up', (
      SELECT row_to_json(f)
      FROM follow_ups f
      WHERE f.client_id = p_client_id
      ORDER BY f.contact_date DESC
      LIMIT 1
    ),
    'sections', (
      SELECT coalesce(jsonb_object_agg(section_key, status), '{}'::jsonb)
      FROM intake_sections s
      JOIN intakes i ON i.id = s.intake_id
      WHERE i.client_id = p_client_id
    )
  )
  INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_client_intake_bundle(uuid) IS 'Aggregates all intake related data, including relational medical, employment, and observation tables.';
