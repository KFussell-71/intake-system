-- Migration: Create optimized dashboard statistics view
-- Purpose: Eliminate race conditions and improve performance for dashboard queries
-- Created: 2026-02-01

-- Drop existing view if it exists
DROP VIEW IF EXISTS dashboard_stats_view;

-- Create optimized dashboard statistics view
CREATE OR REPLACE VIEW dashboard_stats_view AS
SELECT
  COUNT(DISTINCT c.id) AS total_clients,
  COUNT(DISTINCT CASE WHEN i.created_at > NOW() - INTERVAL '30 days' THEN c.id END) AS active_clients,
  COUNT(CASE WHEN i.completion_date IS NOT NULL THEN 1 END) AS completed_intakes,
  COUNT(CASE WHEN i.completion_date IS NULL AND i.report_date IS NOT NULL THEN 1 END) AS in_progress_intakes,
  COUNT(CASE WHEN i.completion_date IS NULL THEN 1 END) AS pending_intakes,
  ROUND(
    CASE 
      WHEN COUNT(i.id) > 0 THEN 
        (COUNT(CASE WHEN i.completion_date IS NOT NULL THEN 1 END)::NUMERIC / COUNT(i.id)::NUMERIC) * 100
      ELSE 0
    END
  ) AS completion_rate,
  ROUND(
    AVG(
      CASE 
        WHEN i.completion_date IS NOT NULL AND i.report_date IS NOT NULL THEN
          EXTRACT(EPOCH FROM (i.completion_date::TIMESTAMP - i.report_date::TIMESTAMP)) / 86400
      END
    )
  ) AS avg_completion_days,
  COUNT(CASE WHEN i.created_at > NOW() - INTERVAL '7 days' THEN 1 END) AS recent_activity
FROM clients c
LEFT JOIN intakes i ON c.id = i.client_id
WHERE c.deleted_at IS NULL;

-- Grant access to authenticated users
GRANT SELECT ON dashboard_stats_view TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW dashboard_stats_view IS 'Optimized view for dashboard statistics. Eliminates race conditions by calculating all metrics in a single atomic query.';
