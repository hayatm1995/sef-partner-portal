-- Production Seed Script
-- Run this AFTER creating a Supabase Auth user
-- IMPORTANT: Replace 'YOUR_AUTH_USER_UUID' with the actual UUID from auth.users table

-- Step 1: Insert Demo Partner
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

-- Step 2: Get the partner ID and create partner_user linked to auth user
DO $$
DECLARE
  partner_uuid UUID;
  auth_user_uuid UUID;
BEGIN
  -- Get Demo Partner ID
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

  -- Get the first auth user (you should replace this with specific user lookup)
  -- For now, we'll use the most recent auth user
  SELECT id INTO auth_user_uuid
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no auth user exists, you need to create one first in Supabase Dashboard
  IF auth_user_uuid IS NULL THEN
    RAISE EXCEPTION 'No auth user found. Please create a user in Supabase Dashboard → Authentication → Users first, then update this script with the user UUID.';
  END IF;

  -- Insert Demo Partner Admin User
  INSERT INTO partner_users (partner_id, auth_user_id, full_name, email, role)
  SELECT 
    partner_uuid,
    auth_user_uuid,
    'Demo Partner Admin',
    (SELECT email FROM auth.users WHERE id = auth_user_uuid),
    'admin'::user_role
  ON CONFLICT (email) DO UPDATE
  SET 
    partner_id = partner_uuid,
    auth_user_id = auth_user_uuid,
    role = 'admin'::user_role;

  -- Step 3: Insert Exhibitor Stand with "Assignment Pending" status
  INSERT INTO exhibitor_stands (partner_id, booth_number, status, admin_comments)
  VALUES (
    partner_uuid,
    'A-101',
    'Assignment Pending',
    'Booth assignment pending. Please wait for admin confirmation.'
  )
  ON CONFLICT DO NOTHING;

  -- Step 4: Insert one deliverable request (Pending Review)
  INSERT INTO deliverables (partner_id, name, type, status, notes)
  VALUES (
    partner_uuid,
    'Company Logo - High Resolution',
    'Media Asset',
    'Pending Review',
    'Please upload high-resolution logo (minimum 300 DPI, PNG or SVG format)'
  )
  ON CONFLICT DO NOTHING;

  -- Step 5: Insert sample notification
  INSERT INTO notifications (partner_id, title, message, type)
  VALUES (
    partner_uuid,
    'Welcome to SEF Partner Portal',
    'Your account has been set up successfully. Please complete your deliverables and check your exhibitor stand status.',
    'info'
  )
  ON CONFLICT DO NOTHING;

  -- Step 6: Insert sample activity log entry
  INSERT INTO activity_log (partner_id, user_id, activity_type, description)
  SELECT 
    partner_uuid,
    pu.id,
    'account_created',
    'Demo Partner account created and configured'
  FROM partner_users pu
  WHERE pu.partner_id = partner_uuid AND pu.role = 'admin'
  LIMIT 1
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE 'Partner ID: %', partner_uuid;
  RAISE NOTICE 'Auth User ID: %', auth_user_uuid;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify data in Supabase Dashboard → Table Editor';
  RAISE NOTICE '2. Login with the auth user email';
  RAISE NOTICE '3. Dashboard should show "Demo Partner"';
  RAISE NOTICE '4. Exhibitor Stand should show "Assignment Pending"';
  RAISE NOTICE '5. Deliverables page should show 1 pending item';

END $$;

-- Verification Query
SELECT 
  'Partners' as table_name,
  COUNT(*) as record_count
FROM partners
WHERE name = 'Demo Partner'

UNION ALL

SELECT 
  'Partner Users',
  COUNT(*)
FROM partner_users pu
JOIN partners p ON pu.partner_id = p.id
WHERE p.name = 'Demo Partner'

UNION ALL

SELECT 
  'Exhibitor Stands',
  COUNT(*)
FROM exhibitor_stands es
JOIN partners p ON es.partner_id = p.id
WHERE p.name = 'Demo Partner'

UNION ALL

SELECT 
  'Deliverables',
  COUNT(*)
FROM deliverables d
JOIN partners p ON d.partner_id = p.id
WHERE p.name = 'Demo Partner' AND d.status = 'Pending Review'

UNION ALL

SELECT 
  'Notifications',
  COUNT(*)
FROM notifications n
JOIN partners p ON n.partner_id = p.id
WHERE p.name = 'Demo Partner';



