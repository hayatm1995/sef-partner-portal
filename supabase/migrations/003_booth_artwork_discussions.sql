-- Migration: Add booth_artwork and booth_discussions tables
-- These tables support Phase A of Exhibitor Stands functionality

-- TABLE: booth_artwork
-- Stores artwork files uploaded by partners for their booths
CREATE TABLE IF NOT EXISTS public.booth_artwork (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id uuid REFERENCES public.exhibitor_stands(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- TABLE: booth_discussions
-- Stores chat messages between partners and admins about booths
CREATE TABLE IF NOT EXISTS public.booth_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id uuid REFERENCES public.exhibitor_stands(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('partner','admin')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_booth_artwork_booth_id ON public.booth_artwork(booth_id);
CREATE INDEX IF NOT EXISTS idx_booth_discussions_booth_id ON public.booth_discussions(booth_id);
CREATE INDEX IF NOT EXISTS idx_booth_discussions_created_at ON public.booth_discussions(created_at);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.booth_artwork ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_discussions ENABLE ROW LEVEL SECURITY;

-- booth_artwork policies
-- Partners can view their own booth artwork
CREATE POLICY "Partners can view own booth artwork"
  ON public.booth_artwork
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitor_stands es
      JOIN public.partners p ON es.partner_id = p.id
      JOIN public.partner_users pu ON pu.partner_id = p.id
      WHERE es.id = booth_artwork.booth_id
      AND pu.auth_user_id = auth.uid()
    )
  );

-- Partners can insert artwork for their own booth
CREATE POLICY "Partners can insert own booth artwork"
  ON public.booth_artwork
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exhibitor_stands es
      JOIN public.partners p ON es.partner_id = p.id
      JOIN public.partner_users pu ON pu.partner_id = p.id
      WHERE es.id = booth_artwork.booth_id
      AND pu.auth_user_id = auth.uid()
    )
  );

-- Admins can view all booth artwork
CREATE POLICY "Admins can view all booth artwork"
  ON public.booth_artwork
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.role IN ('admin', 'sef_admin')
    )
  );

-- booth_discussions policies
-- Partners can view discussions for their own booths
CREATE POLICY "Partners can view own booth discussions"
  ON public.booth_discussions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitor_stands es
      JOIN public.partners p ON es.partner_id = p.id
      JOIN public.partner_users pu ON pu.partner_id = p.id
      WHERE es.id = booth_discussions.booth_id
      AND pu.auth_user_id = auth.uid()
    )
  );

-- Partners can insert messages for their own booths
CREATE POLICY "Partners can insert own booth messages"
  ON public.booth_discussions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exhibitor_stands es
      JOIN public.partners p ON es.partner_id = p.id
      JOIN public.partner_users pu ON pu.partner_id = p.id
      WHERE es.id = booth_discussions.booth_id
      AND pu.auth_user_id = auth.uid()
      AND booth_discussions.sender_role = 'partner'
    )
  );

-- Admins can view all booth discussions
CREATE POLICY "Admins can view all booth discussions"
  ON public.booth_discussions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.role IN ('admin', 'sef_admin')
    )
  );

-- Admins can insert messages for any booth
CREATE POLICY "Admins can insert booth messages"
  ON public.booth_discussions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.role IN ('admin', 'sef_admin')
    )
    AND booth_discussions.sender_role = 'admin'
  );


