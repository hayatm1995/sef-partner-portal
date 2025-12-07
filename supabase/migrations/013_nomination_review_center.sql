-- Migration: Nomination Review Center
-- Adds 'hidden' status to nominations and creates nomination_logs table

-- Update nominations table to include 'hidden' status
ALTER TABLE public.nominations
  DROP CONSTRAINT IF EXISTS nominations_status_check;

ALTER TABLE public.nominations
  ADD CONSTRAINT nominations_status_check 
  CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Rejected', 'hidden'));

-- Add rejection_reason column if not exists
ALTER TABLE public.nominations
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add admin_comment column for hide reason
ALTER TABLE public.nominations
  ADD COLUMN IF NOT EXISTS admin_comment TEXT;

-- Add reviewed_by column to track admin who reviewed
ALTER TABLE public.nominations
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.partner_users(id) ON DELETE SET NULL;

-- Create nomination_logs table
CREATE TABLE IF NOT EXISTS public.nomination_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nomination_id UUID REFERENCES public.nominations(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES public.partner_users(id) ON DELETE SET NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nomination_logs_nomination_id ON public.nomination_logs(nomination_id);
CREATE INDEX IF NOT EXISTS idx_nomination_logs_admin_id ON public.nomination_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_nomination_logs_created_at ON public.nomination_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.nomination_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nomination_logs
-- Admins and superadmins can view all logs
DROP POLICY IF EXISTS "Admins can view all nomination logs" ON public.nomination_logs;
CREATE POLICY "Admins can view all nomination logs"
  ON public.nomination_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'sef_admin')
    )
  );

-- Admins and superadmins can insert logs
DROP POLICY IF EXISTS "Admins can insert nomination logs" ON public.nomination_logs;
CREATE POLICY "Admins can insert nomination logs"
  ON public.nomination_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'superadmin', 'sef_admin')
    )
  );

-- Add comment
COMMENT ON TABLE public.nomination_logs IS 'Tracks all status changes to nominations with admin_id, old_status, new_status, and reason';

