-- Migration: Create Partner Invitations Table (if not exists)
-- Tracks VIP guest list invitations for BELONG+ events

-- TABLE: partner_invitations
CREATE TABLE IF NOT EXISTS public.partner_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  event_type text NOT NULL CHECK (event_type IN ('opening_ceremony', 'sef_vault', 'closing_ceremony')),
  invite_count integer NOT NULL DEFAULT 1 CHECK (invite_count > 0),
  status text NOT NULL CHECK (status IN ('draft', 'submitted', 'processing', 'confirmed', 'rejected')) DEFAULT 'draft',
  notes text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_invitations_partner_id ON public.partner_invitations(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_event_type ON public.partner_invitations(event_type);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_status ON public.partner_invitations(status);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_partner_event ON public.partner_invitations(partner_id, event_type);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_partner_invitations_updated_at ON public.partner_invitations;
CREATE TRIGGER update_partner_invitations_updated_at BEFORE UPDATE ON public.partner_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.partner_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Partners can view their own invitations
CREATE POLICY "Partners can view own invitations"
  ON public.partner_invitations
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Partners can create invitations for their own partner_id
CREATE POLICY "Partners can create own invitations"
  ON public.partner_invitations
  FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Partners can update their own draft invitations
CREATE POLICY "Partners can update own draft invitations"
  ON public.partner_invitations
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
    AND status = 'draft'
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Partners can delete their own draft invitations
CREATE POLICY "Partners can delete own draft invitations"
  ON public.partner_invitations
  FOR DELETE
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
    AND status = 'draft'
  );

-- Admins can view all invitations
CREATE POLICY "Admins can view all invitations"
  ON public.partner_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
  );

-- Admins can update all invitations
CREATE POLICY "Admins can update all invitations"
  ON public.partner_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
  );

-- Add allocation columns to partners table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partners' 
    AND column_name = 'belong_plus_opening_ceremony_allocation'
  ) THEN
    ALTER TABLE public.partners 
    ADD COLUMN belong_plus_opening_ceremony_allocation integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partners' 
    AND column_name = 'belong_plus_sef_vault_allocation'
  ) THEN
    ALTER TABLE public.partners 
    ADD COLUMN belong_plus_sef_vault_allocation integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partners' 
    AND column_name = 'belong_plus_closing_ceremony_allocation'
  ) THEN
    ALTER TABLE public.partners 
    ADD COLUMN belong_plus_closing_ceremony_allocation integer DEFAULT 0;
  END IF;
END $$;


