-- Seed script for Exhibitor Stands (Phase B testing)
-- Run this in Supabase SQL Editor to create demo booths and artwork

-- Insert demo booths (only if they don't exist)
DO $$
DECLARE
  partner_uuid uuid;
  booth1_uuid uuid := gen_random_uuid();
  booth2_uuid uuid := gen_random_uuid();
  booth3_uuid uuid := gen_random_uuid();
BEGIN
  -- Get or create Demo Partner
  SELECT id INTO partner_uuid FROM partners WHERE name = 'Demo Partner' LIMIT 1;
  
  IF partner_uuid IS NULL THEN
    -- Create Demo Partner if it doesn't exist
    INSERT INTO partners (id, name, tier, contract_status)
    VALUES (gen_random_uuid(), 'Demo Partner', 'Platinum', 'Signed')
    RETURNING id INTO partner_uuid;
  END IF;

  -- Insert booth 1 (Assigned to Demo Partner)
  INSERT INTO exhibitor_stands (id, partner_id, booth_number, status, admin_comments, updated_at)
  VALUES (
    booth1_uuid,
    partner_uuid,
    'A-11',
    'Assigned',
    'Booth assigned. Please submit artwork by deadline.',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert booth 2 (Pending)
  INSERT INTO exhibitor_stands (id, partner_id, booth_number, status, admin_comments, updated_at)
  VALUES (
    booth2_uuid,
    partner_uuid,
    'B-27',
    'Pending',
    'Awaiting partner response.',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert booth 3 (Unassigned - no partner_id)
  INSERT INTO exhibitor_stands (id, partner_id, booth_number, status, admin_comments, updated_at)
  VALUES (
    booth3_uuid,
    NULL,
    'C-42',
    'Assignment Pending',
    'Booth available for assignment.',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert sample artwork for booth 1 (using placeholder URLs)
  -- In production, these would be actual Supabase Storage URLs
  INSERT INTO booth_artwork (booth_id, file_url, created_at)
  VALUES 
    (booth1_uuid, 'https://via.placeholder.com/800x600?text=Artwork+1', NOW() - INTERVAL '2 days'),
    (booth1_uuid, 'https://via.placeholder.com/800x600?text=Artwork+2', NOW() - INTERVAL '1 day')
  ON CONFLICT DO NOTHING;

  -- Insert sample artwork for booth 2
  INSERT INTO booth_artwork (booth_id, file_url, created_at)
  VALUES 
    (booth2_uuid, 'https://via.placeholder.com/800x600?text=Artwork+3', NOW() - INTERVAL '3 days')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully.';
  RAISE NOTICE 'Booth 1 ID: %', booth1_uuid;
  RAISE NOTICE 'Booth 2 ID: %', booth2_uuid;
  RAISE NOTICE 'Booth 3 ID: %', booth3_uuid;
END $$;

-- Verify the data
SELECT 
  es.id,
  es.booth_number,
  es.status,
  p.name as partner_name,
  (SELECT COUNT(*) FROM booth_artwork WHERE booth_id = es.id) as artwork_count
FROM exhibitor_stands es
LEFT JOIN partners p ON es.partner_id = p.id
ORDER BY es.created_at DESC;


