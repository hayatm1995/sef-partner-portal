-- Migration: Exhibitor Stand Workflow
-- Adds build_option to exhibitor_stands, category to deliverables, review_notes to partner_submissions
-- Seeds exhibitor deliverables

-- ============================================
-- STEP 1: Update exhibitor_stands table
-- ============================================

DO $$ 
BEGIN
  -- Add build_option column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exhibitor_stands' 
    AND column_name = 'build_option'
  ) THEN
    ALTER TABLE public.exhibitor_stands 
    ADD COLUMN build_option TEXT CHECK (build_option IN ('sef_built', 'custom_build')) DEFAULT 'sef_built';
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exhibitor_stands' 
    AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.exhibitor_stands 
    ADD COLUMN notes TEXT;
  END IF;

  -- Add last_updated_by column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'exhibitor_stands' 
    AND column_name = 'last_updated_by'
  ) THEN
    ALTER TABLE public.exhibitor_stands 
    ADD COLUMN last_updated_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Update existing rows to have default build_option
UPDATE public.exhibitor_stands 
SET build_option = 'sef_built' 
WHERE build_option IS NULL;

-- ============================================
-- STEP 2: Update deliverables table
-- ============================================

DO $$ 
BEGIN
  -- Add category column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'deliverables' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.deliverables 
    ADD COLUMN category TEXT;
  END IF;
END $$;

-- ============================================
-- STEP 3: Update partner_submissions table
-- ============================================

DO $$ 
BEGIN
  -- Add review_notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_submissions' 
    AND column_name = 'review_notes'
  ) THEN
    ALTER TABLE public.partner_submissions 
    ADD COLUMN review_notes TEXT;
  END IF;

  -- Update status enum to include new statuses if needed
  -- Check if status column exists and update constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'partner_submissions' 
    AND column_name = 'status'
  ) THEN
    -- Drop existing constraint if it exists
    ALTER TABLE public.partner_submissions 
    DROP CONSTRAINT IF EXISTS partner_submissions_status_check;
    
    -- Add new constraint with all statuses
    ALTER TABLE public.partner_submissions 
    ADD CONSTRAINT partner_submissions_status_check 
    CHECK (status IN ('pending', 'pending_review', 'under_review', 'approved', 'rejected', 'changes_requested', 'locked_for_printing'));
  END IF;
END $$;

-- ============================================
-- STEP 4: Seed Exhibitor Deliverables
-- ============================================

-- Note: These deliverables will be created as global templates (partner_id = NULL)
-- They can be assigned to specific partners later if needed

-- Function to seed exhibitor deliverables (idempotent)
DO $$
DECLARE
  deliverable_names TEXT[] := ARRAY[
    'Company Logo',
    'Brand Guidelines',
    'Event Staff List',
    'Insurance Certificate',
    'Risk Assessment / HSE Form',
    'Power & Utilities Requirements',
    'Booth Design Package',
    'Build Contractor Info'
  ];
  deliverable_name TEXT;
  deliverable_id UUID;
  is_custom_only BOOLEAN;
BEGIN
  FOREACH deliverable_name IN ARRAY deliverable_names
  LOOP
    -- Check if deliverable already exists
    SELECT id INTO deliverable_id
    FROM public.deliverables
    WHERE name = deliverable_name
    AND category = 'exhibitor'
    LIMIT 1;

    -- Determine if this is custom_build only
    is_custom_only := deliverable_name IN ('Booth Design Package', 'Build Contractor Info');

    IF deliverable_id IS NULL THEN
      -- Insert new deliverable
      INSERT INTO public.deliverables (
        name,
        type,
        category,
        is_required,
        notes,
        created_at,
        updated_at
      ) VALUES (
        deliverable_name,
        'Document',
        'exhibitor',
        CASE WHEN deliverable_name = 'Brand Guidelines' THEN FALSE ELSE TRUE END,
        CASE 
          WHEN is_custom_only THEN 'Required only for custom build booths'
          ELSE NULL
        END,
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;
END $$;

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_deliverables_category ON public.deliverables(category);

-- Create index for build_option queries
CREATE INDEX IF NOT EXISTS idx_exhibitor_stands_build_option ON public.exhibitor_stands(build_option);

