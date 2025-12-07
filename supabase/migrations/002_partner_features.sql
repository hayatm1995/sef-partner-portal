-- Migration: Partner Features Table
-- This table allows admins to control which sections of PartnerHub are visible to each partner

-- Create partner_features table
CREATE TABLE IF NOT EXISTS partner_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(partner_id, feature)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partner_features_partner_id ON partner_features(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_features_feature ON partner_features(feature);
CREATE INDEX IF NOT EXISTS idx_partner_features_enabled ON partner_features(enabled);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partner_features_updated_at 
  BEFORE UPDATE ON partner_features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE partner_features ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins and superadmins can read all partner_features
CREATE POLICY "Admins can read all partner_features"
  ON partner_features
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_users
      WHERE partner_users.auth_user_id = auth.uid()
      AND partner_users.role IN ('admin', 'superadmin')
    )
  );

-- RLS Policy: Partners can only read their own partner_features
CREATE POLICY "Partners can read their own features"
  ON partner_features
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_users
      WHERE partner_users.auth_user_id = auth.uid()
      AND partner_users.partner_id = partner_features.partner_id
      AND partner_users.role = 'partner'
    )
  );

-- RLS Policy: Only admins and superadmins can insert/update/delete
CREATE POLICY "Admins can manage partner_features"
  ON partner_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM partner_users
      WHERE partner_users.auth_user_id = auth.uid()
      AND partner_users.role IN ('admin', 'superadmin')
    )
  );

-- Insert default features for existing partners (all enabled)
-- This ensures backward compatibility
DO $$
DECLARE
  partner_record RECORD;
  feature_list TEXT[] := ARRAY[
    'Company Profile',
    'Deliverables',
    'Booth Options',
    'VIP Guest List',
    'Media Uploads',
    'Payments',
    'Legal & Branding',
    'Speaker Requests',
    'Nominations'
  ];
  feature_name TEXT;
BEGIN
  FOR partner_record IN SELECT id FROM partners LOOP
    FOREACH feature_name IN ARRAY feature_list LOOP
      INSERT INTO partner_features (partner_id, feature, enabled)
      VALUES (partner_record.id, feature_name, true)
      ON CONFLICT (partner_id, feature) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Initialized default features for all existing partners';
END $$;

-- Add comment to table
COMMENT ON TABLE partner_features IS 'Controls which PartnerHub sections are visible to each partner';
COMMENT ON COLUMN partner_features.feature IS 'Name of the feature (e.g., "Company Profile", "Deliverables")';
COMMENT ON COLUMN partner_features.enabled IS 'Whether this feature is enabled for the partner';

