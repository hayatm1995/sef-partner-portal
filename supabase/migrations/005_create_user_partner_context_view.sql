-- Migration: Create User Partner Context View
-- Provides a unified view of user's partner context with partner_id, partner_role, and partner_name

-- Drop view if exists
DROP VIEW IF EXISTS public.v_user_partner_context;

-- Create view to provide user partner context
CREATE VIEW public.v_user_partner_context AS
SELECT 
  au.id AS auth_user_id,
  au.email AS auth_email,
  pu.id AS partner_user_id,
  pu.partner_id,
  pu.role AS partner_role,
  p.name AS partner_name,
  p.tier AS partner_tier,
  p.contract_status,
  pu.full_name,
  pu.email AS partner_user_email,
  pu.created_at AS partner_user_created_at
FROM auth.users au
LEFT JOIN public.partner_users pu ON pu.auth_user_id = au.id
LEFT JOIN public.partners p ON p.id = pu.partner_id;

-- Grant access to authenticated users
GRANT SELECT ON public.v_user_partner_context TO authenticated;
GRANT SELECT ON public.v_user_partner_context TO anon;

-- Add comment
COMMENT ON VIEW public.v_user_partner_context IS 'Provides unified view of user partner context with partner_id, partner_role, and partner_name';


