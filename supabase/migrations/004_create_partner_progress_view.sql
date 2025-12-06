-- Migration: Create Partner Progress View
-- Calculates progress percentage based on approved submissions

-- Drop view if exists
DROP VIEW IF EXISTS public.v_partner_progress;

-- Create view to calculate partner progress
CREATE VIEW public.v_partner_progress AS
SELECT 
  p.id AS partner_id,
  p.name AS partner_name,
  COUNT(DISTINCT d.id) AS total_deliverables,
  COUNT(DISTINCT CASE WHEN ps.status = 'approved' THEN ps.id END) AS approved_submissions,
  COUNT(DISTINCT CASE WHEN ps.status = 'pending' THEN ps.id END) AS pending_submissions,
  COUNT(DISTINCT CASE WHEN ps.status = 'rejected' THEN ps.id END) AS rejected_submissions,
  CASE 
    WHEN COUNT(DISTINCT d.id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(DISTINCT CASE WHEN ps.status = 'approved' THEN ps.id END)::NUMERIC / 
       NULLIF(COUNT(DISTINCT d.id), 0)) * 100
    )
  END AS progress_percentage,
  NOW() AS calculated_at
FROM public.partners p
LEFT JOIN public.deliverables d ON d.partner_id = p.id
LEFT JOIN public.partner_submissions ps ON ps.deliverable_id = d.id
GROUP BY p.id, p.name;

-- Grant access to authenticated users
GRANT SELECT ON public.v_partner_progress TO authenticated;
GRANT SELECT ON public.v_partner_progress TO anon;

-- Add comment
COMMENT ON VIEW public.v_partner_progress IS 'Calculates partner progress percentage based on approved submissions vs total deliverables';


