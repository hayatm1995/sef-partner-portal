-- Ensure superadmin RLS policies are correctly set up
-- This migration double-checks and fixes any policy issues

-- First, check if policies exist and drop them
DO $$
BEGIN
  -- Drop all existing superadmin/SEF admin policies on partners
  DROP POLICY IF EXISTS "SEF Admins can view all partners" ON public.partners;
  DROP POLICY IF EXISTS "SEF Admins can manage all partners" ON public.partners;
  DROP POLICY IF EXISTS "Superadmins can view all partners" ON public.partners;
  DROP POLICY IF EXISTS "Superadmins can manage all partners" ON public.partners;
  
  -- Drop all existing superadmin/SEF admin policies on partner_users
  DROP POLICY IF EXISTS "SEF Admins can view all partner_users" ON public.partner_users;
  DROP POLICY IF EXISTS "Superadmins can view all partner_users" ON public.partner_users;
END $$;

-- Create comprehensive SELECT policy for partners (read access)
CREATE POLICY "Superadmins can view all partners" ON public.partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND (role = 'sef_admin' OR role = 'superadmin')
    )
  );

-- Create comprehensive ALL policy for partners (full CRUD)
CREATE POLICY "Superadmins can manage all partners" ON public.partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND (role = 'sef_admin' OR role = 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND (role = 'sef_admin' OR role = 'superadmin')
    )
  );

-- Create comprehensive policy for partner_users
CREATE POLICY "Superadmins can view all partner_users" ON public.partner_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND (role = 'sef_admin' OR role = 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND (role = 'sef_admin' OR role = 'superadmin')
    )
  );

-- Add helpful comment
COMMENT ON POLICY "Superadmins can view all partners" ON public.partners IS 
  'Allows users with role = superadmin OR sef_admin in partner_users to view all partners';

COMMENT ON POLICY "Superadmins can manage all partners" ON public.partners IS 
  'Allows users with role = superadmin OR sef_admin in partner_users to manage all partners';

