-- Migration: Enhance Partner Messages Table
-- Adds sender_role and deliverable_id columns

-- Add sender_role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_messages' 
    AND column_name = 'sender_role'
  ) THEN
    ALTER TABLE public.partner_messages 
    ADD COLUMN sender_role TEXT CHECK (sender_role IN ('admin', 'partner')) DEFAULT 'partner';
  END IF;
END $$;

-- Add deliverable_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_messages' 
    AND column_name = 'deliverable_id'
  ) THEN
    ALTER TABLE public.partner_messages 
    ADD COLUMN deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update existing rows to have sender_role based on sender_id
-- This is a best-effort update - we'll determine role from partner_users table
UPDATE public.partner_messages pm
SET sender_role = CASE 
  WHEN EXISTS (
    SELECT 1 FROM public.partner_users pu 
    WHERE pu.auth_user_id = pm.sender_id 
    AND (pu.role IN ('admin', 'sef_admin', 'superadmin') OR pu.role = 'admin')
  ) THEN 'admin'
  ELSE 'partner'
END
WHERE sender_role IS NULL;

-- Create index for deliverable_id queries
CREATE INDEX IF NOT EXISTS idx_partner_messages_deliverable_id ON public.partner_messages(deliverable_id);

-- Create index for sender_role queries
CREATE INDEX IF NOT EXISTS idx_partner_messages_sender_role ON public.partner_messages(sender_role);

