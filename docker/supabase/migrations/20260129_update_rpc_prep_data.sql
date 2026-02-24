-- Migration: 20260129_update_rpc_prep_data
-- Description: Updates get_client_intake_bundle to include the full raw 'data' JSONB column from intakes.
-- This ensures that dynamic fields like 'barriers' and 'support_services' are available to the AI Agent.

CREATE OR REPLACE FUNCTION get_client_intake_bundle(client_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'client', (
      SELECT jsonb_build_object(
        'id', c.id,
        'first_name', split_part(c.name, ' ', 1),
        'last_name', split_part(c.name, ' ', 2),
        'name', c.name,
        'phone', c.phone,
        'email', c.email
      )
      FROM clients c
      WHERE c.id = client_id
    ),

    'intake', (
      SELECT jsonb_build_object(
        'id', i.id,
        'intake_date', i.report_date,
        'report_date', i.report_date,
        'status', i.status,
        'form_data', i.data -- <--- ADDED: Access to raw form data (barriers, support needs)
      )
      FROM intakes i
      WHERE i.client_id = client_id
      ORDER BY i.created_at DESC
      LIMIT 1
    ),

    'documents', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'name', d.name,
          'type', d.type,
          'url', d.url,
          'uploaded_at', d.uploaded_at
        )
      ), '[]'::jsonb)
      FROM documents d
      WHERE d.client_id = client_id
    ),

    'employment_history', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', e.id,
          'job_title', e.job_title,
          'employer', e.employer,
          'start_date', e.start_date,
          'end_date', e.end_date,
          'notes', e.notes
        )
      ), '[]'::jsonb)
      FROM employment_history e
      WHERE e.client_id = client_id
    ),

    'isp_goals', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', g.id,
          'goal_type', g.goal_type,
          'target_date', g.target_date,
          'status', g.status,
          'notes', g.notes
        )
      ), '[]'::jsonb)
      FROM isp_goals g
      WHERE g.client_id = client_id
    ),

    'supportive_services', (
      SELECT coalesce(jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'service_type', s.service_type,
          'description', s.description,
          'status', s.status
        )
      ), '[]'::jsonb)
      FROM supportive_services s
      WHERE s.client_id = client_id
    ),

    'follow_up', (
      SELECT jsonb_build_object(
        'next_meeting_date', f.contact_date,
        'notes', f.notes
      )
      FROM follow_ups f
      WHERE f.client_id = client_id
      ORDER BY f.contact_date DESC
      LIMIT 1
    )
  );

  RETURN result;
END;
$$;
