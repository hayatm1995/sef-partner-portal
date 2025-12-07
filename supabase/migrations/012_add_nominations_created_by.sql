-- Migration: Add created_by field to nominations table for RLS compliance
-- This field tracks which user (from auth.users) created the nomination

-- Add created_by column to nominations table
ALTER TABLE public.nominations
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_nominations_created_by ON public.nominations(created_by);

-- Add comment
COMMENT ON COLUMN public.nominations.created_by IS 'References auth.users.id - tracks which user created this nomination';

