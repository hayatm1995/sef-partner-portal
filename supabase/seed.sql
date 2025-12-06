-- Seed script for Supabase database
-- Run this in Supabase SQL Editor after running the migration

-- Insert Demo Partner
INSERT INTO partners (name, tier, contract_status, assigned_account_manager, website_url)
VALUES (
  'Demo Partner',
  'Platinum',
  'Signed',
  'Sarah Johnson',
  'https://demo-partner.com'
)
ON CONFLICT DO NOTHING
RETURNING id;

-- Get the partner ID (you'll need to replace this with actual UUID after first insert)
-- For now, we'll use a subquery
DO $$
DECLARE
  partner_uuid UUID;
BEGIN
  -- Get or create Demo Partner
  SELECT id INTO partner_uuid
  FROM partners
  WHERE name = 'Demo Partner'
  LIMIT 1;

  -- If partner doesn't exist, create it
  IF partner_uuid IS NULL THEN
    INSERT INTO partners (name, tier, contract_status, assigned_account_manager, website_url)
    VALUES ('Demo Partner', 'Platinum', 'Signed', 'Sarah Johnson', 'https://demo-partner.com')
    RETURNING id INTO partner_uuid;
  END IF;

  -- Insert Demo Partner User (admin role)
  -- Replace 'admin@demo.com' with your actual test email
  INSERT INTO partner_users (partner_id, full_name, email, role)
  VALUES (
    partner_uuid,
    'Demo Admin',
    'admin@demo.com',  -- CHANGE THIS TO YOUR TEST EMAIL
    'admin'
  )
  ON CONFLICT (email) DO UPDATE
  SET partner_id = partner_uuid, role = 'admin';

  -- Insert sample notification
  INSERT INTO notifications (partner_id, title, message)
  VALUES (
    partner_uuid,
    'Welcome to SEF Partner Portal',
    'Your account has been set up successfully. Start by uploading your deliverables and submitting nominations.'
  )
  ON CONFLICT DO NOTHING;

  -- Insert sample deliverable
  INSERT INTO deliverables (partner_id, name, type, status, notes)
  VALUES (
    partner_uuid,
    'Company Logo',
    'Media Asset',
    'Pending Review',
    'High-resolution logo for event materials'
  )
  ON CONFLICT DO NOTHING;

  -- Insert sample nomination
  INSERT INTO nominations (partner_id, category, nominee_name, nominee_email, nominee_bio, status)
  VALUES (
    partner_uuid,
    'Speaker',
    'John Doe',
    'john.doe@demo.com',
    'Expert in technology and innovation with 10+ years of experience.',
    'Submitted'
  )
  ON CONFLICT DO NOTHING;

  -- Insert sample exhibitor stand
  INSERT INTO exhibitor_stands (partner_id, booth_number, status, admin_comments)
  VALUES (
    partner_uuid,
    'A-101',
    'Assigned',
    'Booth assigned. Please submit artwork by deadline.'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seed data inserted successfully. Partner ID: %', partner_uuid;
END $$;

-- Verify the data
SELECT 
  p.name as partner_name,
  pu.full_name as user_name,
  pu.email,
  pu.role,
  (SELECT COUNT(*) FROM deliverables WHERE partner_id = p.id) as deliverables_count,
  (SELECT COUNT(*) FROM nominations WHERE partner_id = p.id) as nominations_count,
  (SELECT COUNT(*) FROM notifications WHERE partner_id = p.id) as notifications_count
FROM partners p
LEFT JOIN partner_users pu ON pu.partner_id = p.id
WHERE p.name = 'Demo Partner';



