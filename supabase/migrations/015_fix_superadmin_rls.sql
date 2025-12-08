-- Fix RLS policy to allow both 'superadmin' and 'sef_admin' roles
-- This ensures superadmins can view all partners regardless of role name variant
-- 
-- IMPORTANT: This migration fixes the issue where superadmins see 0 partners
-- because RLS was only checking for 'sef_admin' but users might have 'superadmin'

-- Drop existing SEF Admin policies
DROP POLICY IF EXISTS "SEF Admins can view all partners" ON public.partners;
DROP POLICY IF EXISTS "SEF Admins can manage all partners" ON public.partners;
DROP POLICY IF EXISTS "Superadmins can view all partners" ON public.partners;
DROP POLICY IF EXISTS "Superadmins can manage all partners" ON public.partners;

-- Create new policies that check for both 'superadmin' and 'sef_admin' roles
-- Using SELECT policy for read access
CREATE POLICY "Superadmins can view all partners" ON public.partners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND (role = 'sef_admin' OR role = 'superadmin')
    )
  );

-- Using ALL policy for full CRUD access
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

-- Also update partner_users policy
DROP POLICY IF EXISTS "SEF Admins can view all partner_users" ON public.partner_users;
DROP POLICY IF EXISTS "Superadmins can view all partner_users" ON public.partner_users;
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

