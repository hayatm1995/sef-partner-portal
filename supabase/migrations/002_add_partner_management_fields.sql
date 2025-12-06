-- Migration: Add Partner Management Fields
-- Adds POC contacts, visible_modules, and account manager assignment fields

-- Add POC contact fields to partners table
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS pr_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS pr_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS pr_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS operations_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS operations_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS operations_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS finance_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS finance_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS finance_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS marketing_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS marketing_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS marketing_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS visible_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS assigned_account_manager_id UUID REFERENCES public.partner_users(id) ON DELETE SET NULL;

-- Add index for account manager lookup
CREATE INDEX IF NOT EXISTS idx_partners_assigned_account_manager_id ON public.partners(assigned_account_manager_id);

-- Update RLS policies to allow SEF admins to manage all partners
DROP POLICY IF EXISTS "SEF Admins can manage all partners" ON public.partners;
CREATE POLICY "SEF Admins can manage all partners" ON public.partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );



