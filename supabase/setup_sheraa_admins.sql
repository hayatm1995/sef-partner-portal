-- Setup Sheraa Admins and Superadmins
-- This script creates/updates all admin users for Sheraa
-- Run this in Supabase SQL Editor
--
-- IMPORTANT: Auth users must be created FIRST in Supabase Dashboard → Authentication → Users
-- After creating auth users, run this script to link them to partner_users table

-- Step 1: Create or get "Sheraa" partner (for organizers)
DO $$
DECLARE
  sheraa_partner_id UUID;
BEGIN
  -- Check if Sheraa partner exists
  SELECT id INTO sheraa_partner_id
  FROM partners
  WHERE name = 'Sheraa' OR name ILIKE '%sheraa%'
  LIMIT 1;
  
  -- If not exists, create it
  -- Omit contract_status to use the default value
  IF sheraa_partner_id IS NULL THEN
    INSERT INTO partners (name, tier, assigned_account_manager, website_url)
    VALUES (
      'Sheraa',
      'Organizer',
      'SEF Team',
      'https://sheraa.ae'
    )
    RETURNING id INTO sheraa_partner_id;
    
    RAISE NOTICE 'Created Sheraa partner with ID: %', sheraa_partner_id;
  ELSE
    RAISE NOTICE 'Sheraa partner already exists with ID: %', sheraa_partner_id;
  END IF;
END $$;

-- Step 2: Setup Superadmins
-- Superadmins: h.malik@sheraa.ae (Hayati) and hayat.malik6@gmail.com (Hayat Malik)

DO $$
DECLARE
  sheraa_partner_id UUID;
  auth_user_id UUID;
  user_email TEXT;
  user_name TEXT;
  user_role user_role;  -- changed to enum type
BEGIN
  -- Get Sheraa partner ID
  SELECT id INTO sheraa_partner_id
  FROM partners
  WHERE name = 'Sheraa'
  LIMIT 1;
  
  -- Superadmin 1: h.malik@sheraa.ae
  user_email := 'h.malik@sheraa.ae';
  user_name := 'Hayati';
  user_role := 'superadmin';
  
  -- Get auth user
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  IF auth_user_id IS NULL THEN
    RAISE WARNING 'Auth user not found for % - Please create in Supabase Dashboard → Authentication → Users first', user_email;
  ELSE
    -- Insert or update partner_user
    INSERT INTO partner_users (auth_user_id, email, full_name, role, partner_id)
    VALUES (auth_user_id, user_email, user_name, user_role, sheraa_partner_id)
    ON CONFLICT (email) DO UPDATE
    SET 
      auth_user_id = EXCLUDED.auth_user_id,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      partner_id = EXCLUDED.partner_id;
    
    RAISE NOTICE '✅ Superadmin created/updated: % (%)', user_name, user_email;
  END IF;
  
  -- Superadmin 2: hayat.malik6@gmail.com
  user_email := 'hayat.malik6@gmail.com';
  user_name := 'Hayat Malik';
  user_role := 'superadmin';
  
  -- Get auth user
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;
  
  IF auth_user_id IS NULL THEN
    RAISE WARNING 'Auth user not found for % - Please create in Supabase Dashboard → Authentication → Users first', user_email;
  ELSE
    -- Insert or update partner_user
    INSERT INTO partner_users (auth_user_id, email, full_name, role, partner_id)
    VALUES (auth_user_id, user_email, user_name, user_role, sheraa_partner_id)
    ON CONFLICT (email) DO UPDATE
    SET 
      auth_user_id = EXCLUDED.auth_user_id,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      partner_id = EXCLUDED.partner_id;
    
    RAISE NOTICE '✅ Superadmin created/updated: % (%)', user_name, user_email;
  END IF;
END $$;

-- Step 3: Setup Admins
-- Admins: s.sohail@sheraa.ae, y.yassin@sheraa.ae, a.ahmad@sheraa.ae, s.nasir@sheraa.ae

DO $$
DECLARE
  sheraa_partner_id UUID;
  auth_user_id UUID;
  admin_records RECORD;
  user_role user_role;  -- added enum variable for loop entries
BEGIN
  -- Get Sheraa partner ID
  SELECT id INTO sheraa_partner_id
  FROM partners
  WHERE name = 'Sheraa'
  LIMIT 1;
  
  -- Array of admin records
  FOR admin_records IN
    SELECT * FROM (VALUES
      ('s.sohail@sheraa.ae', 'Sidiqa Sohail', 'admin'),
      ('y.yassin@sheraa.ae', 'Yousuf Yassin', 'admin'),
      ('a.ahmad@sheraa.ae', 'Adeel Ahmad', 'admin'),
      ('s.nasir@sheraa.ae', 'Sumaiya Nasir', 'admin')
    ) AS t(email, full_name, role)
  LOOP
    -- Validate/assign role into enum variable (this also ensures invalid labels error early)
    user_role := admin_records.role::user_role;
    -- Get auth user
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = admin_records.email
    LIMIT 1;
    
    IF auth_user_id IS NULL THEN
      RAISE WARNING 'Auth user not found for % - Please create in Supabase Dashboard → Authentication → Users first', admin_records.email;
    ELSE
      -- Insert or update partner_user
      INSERT INTO partner_users (auth_user_id, email, full_name, role, partner_id)
      VALUES (auth_user_id, admin_records.email, admin_records.full_name, user_role, sheraa_partner_id)
      ON CONFLICT (email) DO UPDATE
      SET 
        auth_user_id = EXCLUDED.auth_user_id,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        partner_id = EXCLUDED.partner_id;
      
      RAISE NOTICE '✅ Admin created/updated: % (%)', admin_records.full_name, admin_records.email;
    END IF;
  END LOOP;
END $$;

-- Step 4: Verify all users were created
SELECT 
  pu.email,
  pu.full_name,
  pu.role,
  p.name as partner_name,
  CASE 
    WHEN u.id IS NULL THEN '❌ Auth user missing'
    WHEN pu.auth_user_id IS NULL THEN '❌ Auth link missing'
    ELSE '✅ Ready'
  END as status
FROM partner_users pu
LEFT JOIN partners p ON p.id = pu.partner_id
LEFT JOIN auth.users u ON u.id = pu.auth_user_id
WHERE pu.email IN (
  'h.malik@sheraa.ae',
  'hayat.malik6@gmail.com',
  's.sohail@sheraa.ae',
  'y.yassin@sheraa.ae',
  'a.ahmad@sheraa.ae',
  's.nasir@sheraa.ae'
)
ORDER BY 
  CASE pu.role
    WHEN 'superadmin' THEN 1
    WHEN 'admin' THEN 2
    ELSE 3
  END,
  pu.full_name;

-- Step 5: Summary
SELECT 
  role,
  COUNT(*) as count,
  STRING_AGG(full_name, ', ' ORDER BY full_name) as users
FROM partner_users
WHERE email IN (
  'h.malik@sheraa.ae',
  'hayat.malik6@gmail.com',
  's.sohail@sheraa.ae',
  'y.yassin@sheraa.ae',
  'a.ahmad@sheraa.ae',
  's.nasir@sheraa.ae'
)
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'superadmin' THEN 1
    WHEN 'admin' THEN 2
    ELSE 3
  END;
