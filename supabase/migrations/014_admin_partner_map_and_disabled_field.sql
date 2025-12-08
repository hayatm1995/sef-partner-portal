-- Migration: Admin Partner Assignment & User Disable Functionality
-- Creates admin_partner_map join table and adds is_disabled field to partner_users

-- ============================================
-- 1. Ensure auth_user_id is unique in partner_users
-- ============================================
-- First, add a UNIQUE constraint on auth_user_id if it doesn't exist
-- This is required for the foreign key reference in admin_partner_map
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partner_users_auth_user_id_key'
    AND conrelid = 'public.partner_users'::regclass
  ) THEN
    ALTER TABLE public.partner_users
    ADD CONSTRAINT partner_users_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- ============================================
-- 2. Create admin_partner_map table
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_partner_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES public.partner_users(auth_user_id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(admin_user_id, partner_id) -- Prevent duplicate assignments
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_partner_map_admin_user_id ON public.admin_partner_map(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_partner_map_partner_id ON public.admin_partner_map(partner_id);

-- Enable RLS
ALTER TABLE public.admin_partner_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_partner_map
-- Superadmins can view all mappings
DROP POLICY IF EXISTS "Superadmins can view all admin partner mappings" ON public.admin_partner_map;
CREATE POLICY "Superadmins can view all admin partner mappings"
  ON public.admin_partner_map
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users
      WHERE auth_user_id = auth.uid()
      AND (role = 'superadmin' OR role = 'sef_admin')
    )
  );

-- Admins can view their own mappings
DROP POLICY IF EXISTS "Admins can view their own admin partner mappings" ON public.admin_partner_map;
CREATE POLICY "Admins can view their own admin partner mappings"
  ON public.admin_partner_map
  FOR SELECT
  USING (
    admin_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.partner_users
      WHERE auth_user_id = auth.uid()
      AND role = 'admin'
      AND admin_user_id = auth.uid()
    )
  );

-- Superadmins can insert/update/delete mappings
DROP POLICY IF EXISTS "Superadmins can manage admin partner mappings" ON public.admin_partner_map;
CREATE POLICY "Superadmins can manage admin partner mappings"
  ON public.admin_partner_map
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users
      WHERE auth_user_id = auth.uid()
      AND (role = 'superadmin' OR role = 'sef_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users
      WHERE auth_user_id = auth.uid()
      AND (role = 'superadmin' OR role = 'sef_admin')
    )
  );

-- ============================================
-- 3. Add is_disabled field to partner_users
-- ============================================
ALTER TABLE public.partner_users
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_partner_users_is_disabled ON public.partner_users(is_disabled);

-- ============================================
-- 4. Create helper view for admin assigned partners
-- ============================================
CREATE OR REPLACE VIEW public.v_admin_assigned_partners AS
SELECT 
  apm.admin_user_id,
  apm.partner_id,
  apm.created_at as assigned_at,
  p.name as partner_name,
  p.tier as partner_tier,
  p.contract_status,
  pu.full_name as admin_name,
  pu.email as admin_email,
  pu.role as admin_role
FROM public.admin_partner_map apm
INNER JOIN public.partners p ON p.id = apm.partner_id
INNER JOIN public.partner_users pu ON pu.auth_user_id = apm.admin_user_id;

-- Grant access to authenticated users
GRANT SELECT ON public.v_admin_assigned_partners TO authenticated;

-- ============================================
-- 5. Update RLS policies for partner_users to respect is_disabled
-- ============================================
-- Note: Existing RLS policies will continue to work
-- The is_disabled check should be handled in application logic
-- to force logout when user is disabled

-- ============================================
-- 6. Add comment for documentation
-- ============================================
COMMENT ON TABLE public.admin_partner_map IS 'Maps admin users to assigned partners. Used for scoping admin access to specific partners.';
COMMENT ON COLUMN public.partner_users.is_disabled IS 'When true, user account is disabled and should be logged out immediately.';

