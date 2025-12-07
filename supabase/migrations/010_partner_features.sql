-- Migration: Partner Features Visibility Control
-- Replaces visible_modules array with partner_features table for better control
-- This allows admins to toggle which PartnerHub sections are visible per partner

-- STEP 1: Create partner_features table
CREATE TABLE IF NOT EXISTS public.partner_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(partner_id, feature)
);

-- STEP 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partner_features_partner_id ON public.partner_features(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_features_enabled ON public.partner_features(partner_id, enabled) WHERE enabled = true;

-- STEP 3: Migrate existing visible_modules data to partner_features
-- Default features list (matches the 8 features from requirements)
DO $$
DECLARE
  partner_record RECORD;
  feature_name TEXT;
  default_features TEXT[] := ARRAY[
    'company_profile',
    'deliverables',
    'booth_options',
    'vip_guest_list',
    'payments',
    'legal_branding',
    'nominations',
    'media_assets'
  ];
BEGIN
  -- For each partner, migrate visible_modules to partner_features
  FOR partner_record IN SELECT id, visible_modules FROM public.partners WHERE visible_modules IS NOT NULL
  LOOP
    -- If visible_modules is empty or null, enable all default features
    IF partner_record.visible_modules IS NULL OR array_length(partner_record.visible_modules, 1) IS NULL THEN
      -- Insert all default features as enabled
      FOREACH feature_name IN ARRAY default_features
      LOOP
        INSERT INTO public.partner_features (partner_id, feature, enabled)
        VALUES (partner_record.id, feature_name, true)
        ON CONFLICT (partner_id, feature) DO NOTHING;
      END LOOP;
    ELSE
      -- Map visible_modules to partner_features
      -- Enable features that are in visible_modules
      FOREACH feature_name IN ARRAY default_features
      LOOP
        INSERT INTO public.partner_features (partner_id, feature, enabled)
        VALUES (
          partner_record.id, 
          feature_name, 
          feature_name = ANY(partner_record.visible_modules)
        )
        ON CONFLICT (partner_id, feature) DO UPDATE SET enabled = EXCLUDED.enabled;
      END LOOP;
    END IF;
  END LOOP;
  
  -- For partners without visible_modules, create all default features as enabled
  FOR partner_record IN SELECT id FROM public.partners WHERE visible_modules IS NULL OR array_length(visible_modules, 1) IS NULL
  LOOP
    FOREACH feature_name IN ARRAY default_features
    LOOP
      INSERT INTO public.partner_features (partner_id, feature, enabled)
      VALUES (partner_record.id, feature_name, true)
      ON CONFLICT (partner_id, feature) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- STEP 4: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_partner_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_features_updated_at
  BEFORE UPDATE ON public.partner_features
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_features_updated_at();

-- STEP 5: Set up RLS policies
ALTER TABLE public.partner_features ENABLE ROW LEVEL SECURITY;

-- Partners can read their own features
DROP POLICY IF EXISTS "Partners can read their own features" ON public.partner_features;
CREATE POLICY "Partners can read their own features" ON public.partner_features
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can read/write all features
DROP POLICY IF EXISTS "Admins can manage all partner features" ON public.partner_features;
CREATE POLICY "Admins can manage all partner features" ON public.partner_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'sef_admin', 'superadmin')
    )
  );

-- STEP 6: Drop visible_modules column (after migration is complete)
-- Note: This is commented out initially - uncomment after verifying migration worked
-- ALTER TABLE public.partners DROP COLUMN IF EXISTS visible_modules;

-- STEP 7: Add comment for documentation
COMMENT ON TABLE public.partner_features IS 'Controls which PartnerHub sections are visible for each partner. Features can be toggled on/off by admins.';
COMMENT ON COLUMN public.partner_features.feature IS 'Feature name: company_profile, deliverables, booth_options, vip_guest_list, payments, legal_branding, nominations, media_assets';
COMMENT ON COLUMN public.partner_features.enabled IS 'Whether this feature is visible in the PartnerHub for this partner';

