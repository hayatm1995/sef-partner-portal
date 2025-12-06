-- Migration: Add metadata field to notifications table and update RLS

-- Add metadata column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.notifications 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Update type CHECK constraint to include new types
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'success', 'warning', 'error', 'message', 'action_required'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_partner_id_created_at 
  ON public.notifications(partner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_read 
  ON public.notifications(read) WHERE read = false;

-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Partners can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Partners can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;

-- RLS Policy: Partners can view their own notifications
CREATE POLICY "Partners can view own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- RLS Policy: Partners can update their own notifications (mark as read)
CREATE POLICY "Partners can update own notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- RLS Policy: Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON public.notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
  );

-- RLS Policy: Admins can create notifications
CREATE POLICY "Admins can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin')
    )
    OR
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );


