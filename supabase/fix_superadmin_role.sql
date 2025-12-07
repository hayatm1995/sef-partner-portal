-- Fix Superadmin Role Script
-- Run this in Supabase SQL Editor to set your user as superadmin
--
-- INSTRUCTIONS:
-- 1. Replace 'hayat.malik6@gmail.com' with your actual email if different
-- 2. Run this script in Supabase SQL Editor
-- 3. After running, you may need to refresh your session (logout/login)

-- Step 1: Check current user data
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_app_meta_data->>'role' as app_metadata_role,
  u.raw_user_meta_data->>'role' as user_metadata_role,
  pu.id as partner_user_id,
  pu.role as partner_user_role,
  pu.partner_id
FROM auth.users u
LEFT JOIN partner_users pu ON pu.auth_user_id = u.id
WHERE u.email = 'hayat.malik6@gmail.com';

-- Step 2: Insert or Update partner_users record with superadmin role
-- This ensures the database has the correct role
-- Option A: Using email unique constraint (simpler)
INSERT INTO partner_users (auth_user_id, email, full_name, role, partner_id)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'hayat.malik6@gmail.com' LIMIT 1),
  'hayat.malik6@gmail.com',
  'Super Admin',
  'superadmin',
  NULL
)
ON CONFLICT (email) 
DO UPDATE SET
  role = 'superadmin',
  auth_user_id = (SELECT id FROM auth.users WHERE email = 'hayat.malik6@gmail.com' LIMIT 1),
  full_name = COALESCE(partner_users.full_name, 'Super Admin');

-- Alternative Option B: Using DO block (if Option A doesn't work)
-- Uncomment below if you get an error with Option A
/*
DO $$
DECLARE
  v_auth_user_id UUID;
  v_partner_user_id UUID;
BEGIN
  -- Get the auth user ID
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'hayat.malik6@gmail.com'
  LIMIT 1;
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email hayat.malik6@gmail.com not found in auth.users';
  END IF;
  
  -- Check if partner_user record exists
  SELECT id INTO v_partner_user_id
  FROM partner_users
  WHERE auth_user_id = v_auth_user_id
  LIMIT 1;
  
  IF v_partner_user_id IS NOT NULL THEN
    -- Update existing record
    UPDATE partner_users
    SET 
      role = 'superadmin',
      email = 'hayat.malik6@gmail.com',
      full_name = COALESCE(full_name, 'Super Admin')
    WHERE id = v_partner_user_id;
    
    RAISE NOTICE 'Updated existing partner_user record with superadmin role';
  ELSE
    -- Insert new record
    INSERT INTO partner_users (auth_user_id, email, full_name, role, partner_id)
    VALUES (
      v_auth_user_id,
      'hayat.malik6@gmail.com',
      'Super Admin',
      'superadmin',
      NULL
    );
    
    RAISE NOTICE 'Created new partner_user record with superadmin role';
  END IF;
END $$;
*/

-- Step 3: Update app_metadata via Supabase Admin API (requires service role key)
-- Note: This must be done via Edge Function or Admin API, not SQL
-- The app_metadata update will be handled by the sync-user-metadata Edge Function
-- Or you can manually update it in Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Find your user
-- 3. Edit user metadata
-- 4. Add to app_metadata: {"role": "superadmin"}

-- Step 4: Verify the update
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  pu.role as partner_user_role,
  pu.partner_id
FROM auth.users u
LEFT JOIN partner_users pu ON pu.auth_user_id = u.id
WHERE u.email = 'hayat.malik6@gmail.com';

-- Step 5: Check if SUPERADMIN constant matches
-- Compare the UID below with the one in src/constants/users.js
SELECT 
  id as auth_user_id,
  email,
  'e751fd63-bfb4-4c77-9fc7-9d25adb57406' as expected_uid,
  CASE 
    WHEN id = 'e751fd63-bfb4-4c77-9fc7-9d25adb57406' THEN '✅ UID MATCHES'
    ELSE '❌ UID DOES NOT MATCH'
  END as uid_match_status
FROM auth.users
WHERE email = 'hayat.malik6@gmail.com';

