-- Migration: Create Partner Messages Table
-- Enables messaging between partners and admins

-- TABLE: partner_messages
CREATE TABLE IF NOT EXISTS public.partner_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for faster queries (partner_id + created_at)
CREATE INDEX IF NOT EXISTS idx_partner_messages_partner_created ON public.partner_messages(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_messages_sender ON public.partner_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_partner_messages_is_read ON public.partner_messages(partner_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE public.partner_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Partners can view messages for their own partner_id
CREATE POLICY "Partners can view own messages"
  ON public.partner_messages
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Partners can send messages for their own partner_id
CREATE POLICY "Partners can send own messages"
  ON public.partner_messages
  FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

-- Partners can update read status for their own messages
CREATE POLICY "Partners can update own message read status"
  ON public.partner_messages
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.partner_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin', 'superadmin')
    )
  );

-- Admins can send messages for any partner
CREATE POLICY "Admins can send messages"
  ON public.partner_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin', 'superadmin')
    )
    AND sender_id = auth.uid()
  );

-- Admins can update read status for any message
CREATE POLICY "Admins can update message read status"
  ON public.partner_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin', 'superadmin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin', 'superadmin')
    )
  );


