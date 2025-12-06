-- ============================================
-- SEF Partner Portal Migration (idempotent)
-- IMPORTANT: Run STEP 1 first (as a separate execution) and wait for success/commit.
-- Then run STEP 2 in a second execution.
-- Some SQL clients (including the Supabase SQL editor) wrap the entire run in one
-- transaction. That causes Postgres to throw an error if you add an enum value and
-- reference it later in the same transaction. Running STEP 1 separately ensures the
-- enum change is committed before any DDL/DML references the new label.
-- ============================================

-- ========================
-- STEP 1: Enum creation
-- Run this block first (separate execution). Wait for success/commit before continuing.
-- ========================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create type if missing (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'user_role'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.user_role AS ENUM ('admin', 'marketing', 'operations', 'viewer', 'sef_admin');
  END IF;
END;
$$;

-- Ensure enum contains expected values (Postgres 14+ supports ADD VALUE IF NOT EXISTS)
DO $$
BEGIN
  BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'marketing';
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'operations';
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'viewer';
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'sef_admin';
  EXCEPTION WHEN undefined_function THEN
    -- Older Postgres: ADD VALUE IF NOT EXISTS not available. If you are on older PG and
    -- a value is missing, add it manually in a separate step using ALTER TYPE ... ADD VALUE 'label';
    PERFORM 1;
  END;
END;
$$;

-- After STEP 1 succeeds and is committed, run STEP 2 below in a second execution.
-- If you forget and run the whole file at once and your client wraps into a single transaction,
-- you'll get an error like: ERROR:  cannot alter type "user_role" because it is in use

-- ========================
-- STEP 2: Schema creation (run after STEP 1 commit)
-- ========================

-- TABLE: partners
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  tier TEXT,
  website_url TEXT,
  contract_status TEXT CHECK (contract_status IN ('Pending', 'Signed', 'In Review')) DEFAULT 'Pending',
  assigned_account_manager TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: partner_users
CREATE TABLE IF NOT EXISTS public.partner_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role public.user_role DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: exhibitor_stands
CREATE TABLE IF NOT EXISTS public.exhibitor_stands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  booth_number TEXT,
  status TEXT CHECK (status IN ('Assignment Pending', 'Pending', 'Assigned', 'Approved', 'Revisions Needed')) DEFAULT 'Assignment Pending',
  admin_comments TEXT,
  partner_artwork_url TEXT,
  admin_artwork_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: deliverables
CREATE TABLE IF NOT EXISTS public.deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Media Asset', 'PR Requirement', 'Document')) NOT NULL,
  status TEXT CHECK (status IN ('Pending Review', 'Approved', 'Rejected')) DEFAULT 'Pending Review',
  file_url TEXT,
  notes TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: nominations
CREATE TABLE IF NOT EXISTS public.nominations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('Judge', 'Speaker', 'Startup', 'Award Recipient')) NOT NULL,
  nominee_name TEXT NOT NULL,
  nominee_email TEXT,
  nominee_bio TEXT,
  status TEXT CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Rejected')) DEFAULT 'Submitted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: approvals
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  deliverable_id UUID REFERENCES public.deliverables(id) ON DELETE CASCADE,
  nomination_id UUID REFERENCES public.nominations(id) ON DELETE CASCADE,
  approver_id UUID REFERENCES public.partner_users(id),
  approval_type TEXT CHECK (approval_type IN ('deliverable', 'nomination', 'stand', 'other')) NOT NULL,
  status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Requested Changes')) DEFAULT 'Pending',
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: media_tracker
CREATE TABLE IF NOT EXISTS public.media_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT CHECK (media_type IN ('Logo', 'Banner', 'Video', 'Photo', 'Document', 'Other')) NOT NULL,
  file_url TEXT,
  status TEXT CHECK (status IN ('Uploaded', 'In Review', 'Approved', 'Rejected')) DEFAULT 'Uploaded',
  uploaded_by UUID REFERENCES public.partner_users(id),
  reviewed_by UUID REFERENCES public.partner_users(id),
  review_comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE: activity_log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.partner_users(id),
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_users_email ON public.partner_users(email);
CREATE INDEX IF NOT EXISTS idx_partner_users_partner_id ON public.partner_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_auth_user_id ON public.partner_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_stands_partner_id ON public.exhibitor_stands(partner_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_stands_status ON public.exhibitor_stands(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_partner_id ON public.deliverables(partner_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status ON public.deliverables(status);
CREATE INDEX IF NOT EXISTS idx_nominations_partner_id ON public.nominations(partner_id);
CREATE INDEX IF NOT EXISTS idx_nominations_status ON public.nominations(status);
CREATE INDEX IF NOT EXISTS idx_approvals_partner_id ON public.approvals(partner_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_media_tracker_partner_id ON public.media_tracker(partner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_partner_id ON public.notifications(partner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_activity_log_partner_id ON public.activity_log(partner_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exhibitor_stands_updated_at ON public.exhibitor_stands;
CREATE TRIGGER update_exhibitor_stands_updated_at BEFORE UPDATE ON public.exhibitor_stands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_deliverables_updated_at ON public.deliverables;
CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nominations_updated_at ON public.nominations;
CREATE TRIGGER update_nominations_updated_at BEFORE UPDATE ON public.nominations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_approvals_updated_at ON public.approvals;
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_media_tracker_updated_at ON public.media_tracker;
CREATE TRIGGER update_media_tracker_updated_at BEFORE UPDATE ON public.media_tracker
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitor_stands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own partner data" ON public.partners;
DROP POLICY IF EXISTS "Users can view their own partner_users" ON public.partner_users;
DROP POLICY IF EXISTS "Users can view their own exhibitor_stands" ON public.exhibitor_stands;
DROP POLICY IF EXISTS "Users can view their own deliverables" ON public.deliverables;
DROP POLICY IF EXISTS "Users can view their own nominations" ON public.nominations;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all partners" ON public.partners;
DROP POLICY IF EXISTS "SEF Admins can manage all" ON public.partners;

CREATE POLICY "Partner users can view their own partner" ON public.partners
  FOR SELECT USING (
    id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner users can view their own partner_users" ON public.partner_users
  FOR SELECT USING (
    auth_user_id = auth.uid() OR
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner admins can manage their partner_users" ON public.partner_users
  FOR ALL USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Partner users can view their own exhibitor_stands" ON public.exhibitor_stands
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner admins can manage their exhibitor_stands" ON public.exhibitor_stands
  FOR ALL USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Partner users can view their own deliverables" ON public.deliverables
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner admins can manage their deliverables" ON public.deliverables
  FOR ALL USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Partner users can view their own nominations" ON public.nominations
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner admins can manage their nominations" ON public.nominations
  FOR ALL USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Partner users can view their own approvals" ON public.approvals
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner users can view their own media_tracker" ON public.media_tracker
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner admins can manage their media_tracker" ON public.media_tracker
  FOR ALL USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Partner users can view their own notifications" ON public.notifications
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner users can update their own notifications" ON public.notifications
  FOR UPDATE USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner users can view their own activity_log" ON public.activity_log
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Partner users can insert their own activity_log" ON public.activity_log
  FOR INSERT WITH CHECK (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "SEF Admins can view all partners" ON public.partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

CREATE POLICY "SEF Admins can view all partner_users" ON public.partner_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

CREATE POLICY "SEF Admins can manage all exhibitor_stands" ON public.exhibitor_stands
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

CREATE POLICY "SEF Admins can manage all deliverables" ON public.deliverables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

CREATE POLICY "SEF Admins can manage all nominations" ON public.nominations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

CREATE POLICY "SEF Admins can manage all approvals" ON public.approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

CREATE POLICY "SEF Admins can manage all media_tracker" ON public.media_tracker
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

CREATE POLICY "SEF Admins can view all notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );

CREATE POLICY "SEF Admins can view all activity_log" ON public.activity_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'sef_admin'
    )
  );
