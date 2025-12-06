-- Migration: Add Partner Submissions Table
-- Tracks file submissions for deliverables

-- TABLE: partner_submissions
CREATE TABLE IF NOT EXISTS public.partner_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_by UUID REFERENCES public.partner_users(id),
  reviewed_by UUID REFERENCES public.partner_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_submissions_deliverable_id ON public.partner_submissions(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_partner_submissions_partner_id ON public.partner_submissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_submissions_status ON public.partner_submissions(status);
CREATE INDEX IF NOT EXISTS idx_partner_submissions_submitted_by ON public.partner_submissions(submitted_by);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_partner_submissions_updated_at ON public.partner_submissions;
CREATE TRIGGER update_partner_submissions_updated_at BEFORE UPDATE ON public.partner_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.partner_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Partner users can view their own submissions" ON public.partner_submissions;
CREATE POLICY "Partner users can view their own submissions" ON public.partner_submissions
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partner users can create their own submissions" ON public.partner_submissions;
CREATE POLICY "Partner users can create their own submissions" ON public.partner_submissions
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "SEF Admins can view all submissions" ON public.partner_submissions;
CREATE POLICY "SEF Admins can view all submissions" ON public.partner_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

DROP POLICY IF EXISTS "SEF Admins can manage all submissions" ON public.partner_submissions;
CREATE POLICY "SEF Admins can manage all submissions" ON public.partner_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );


