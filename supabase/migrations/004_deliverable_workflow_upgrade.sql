-- Migration: Upgrade Deliverables to Full Workflow Management
-- Adds versioning, comments, admin notes, and priority

-- ============================================
-- STEP 1: Modify partner_submissions table
-- ============================================

-- Add versioning fields to partner_submissions
DO $$ 
BEGIN
  -- Add version column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_submissions' 
    AND column_name = 'version'
  ) THEN
    ALTER TABLE public.partner_submissions 
    ADD COLUMN version INTEGER DEFAULT 1;
  END IF;

  -- Add uploaded_by if it doesn't exist (may already exist as submitted_by)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_submissions' 
    AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.partner_submissions 
    ADD COLUMN uploaded_by UUID REFERENCES public.partner_users(id);
    
    -- Copy submitted_by to uploaded_by for existing records
    UPDATE public.partner_submissions 
    SET uploaded_by = submitted_by 
    WHERE uploaded_by IS NULL AND submitted_by IS NOT NULL;
  END IF;

  -- Ensure updated_at exists (should already exist)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_submissions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.partner_submissions 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create index for version queries
CREATE INDEX IF NOT EXISTS idx_partner_submissions_version ON public.partner_submissions(deliverable_id, version);

-- ============================================
-- STEP 2: Modify deliverables table
-- ============================================

-- Add admin_notes and priority to deliverables
DO $$ 
BEGIN
  -- Add admin_notes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deliverables' 
    AND column_name = 'admin_notes'
  ) THEN
    ALTER TABLE public.deliverables 
    ADD COLUMN admin_notes TEXT;
  END IF;

  -- Add priority if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deliverables' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.deliverables 
    ADD COLUMN priority TEXT CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium';
  END IF;
END $$;

-- ============================================
-- STEP 3: Create deliverable_comments table
-- ============================================

CREATE TABLE IF NOT EXISTS public.deliverable_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE NOT NULL,
  submission_id UUID REFERENCES public.partner_submissions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.partner_users(id) NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deliverable_comments_deliverable_id ON public.deliverable_comments(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_comments_submission_id ON public.deliverable_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_deliverable_comments_created_at ON public.deliverable_comments(created_at);

-- Enable RLS
ALTER TABLE public.deliverable_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deliverable_comments

-- Partners can view comments for their deliverables
CREATE POLICY "Partners can view own deliverable comments"
  ON public.deliverable_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.partner_users pu ON pu.partner_id = d.partner_id
      WHERE d.id = deliverable_comments.deliverable_id
      AND pu.auth_user_id = auth.uid()
    )
  );

-- Partners can create comments for their deliverables
CREATE POLICY "Partners can create own deliverable comments"
  ON public.deliverable_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.deliverables d
      JOIN public.partner_users pu ON pu.partner_id = d.partner_id
      WHERE d.id = deliverable_comments.deliverable_id
      AND pu.auth_user_id = auth.uid()
      AND pu.id = deliverable_comments.user_id
      AND deliverable_comments.is_admin = FALSE
    )
  );

-- Admins can view all comments
CREATE POLICY "Admins can view all deliverable comments"
  ON public.deliverable_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.role IN ('admin', 'sef_admin')
    )
  );

-- Admins can create comments
CREATE POLICY "Admins can create deliverable comments"
  ON public.deliverable_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.partner_users pu
      WHERE pu.auth_user_id = auth.uid()
      AND pu.role IN ('admin', 'sef_admin')
      AND pu.id = deliverable_comments.user_id
      AND deliverable_comments.is_admin = TRUE
    )
  );

-- ============================================
-- STEP 4: Function to auto-increment version
-- ============================================

-- Function to get next version number for a deliverable
CREATE OR REPLACE FUNCTION public.get_next_submission_version(deliverable_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO max_version
  FROM public.partner_submissions
  WHERE deliverable_id = deliverable_uuid;
  
  RETURN max_version + 1;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set version on insert
CREATE OR REPLACE FUNCTION public.set_submission_version()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.version IS NULL OR NEW.version = 1 THEN
    NEW.version := public.get_next_submission_version(NEW.deliverable_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_submission_version ON public.partner_submissions;
CREATE TRIGGER trigger_set_submission_version
  BEFORE INSERT ON public.partner_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_submission_version();


