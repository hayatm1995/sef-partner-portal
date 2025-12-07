-- Check Admin Users in Database
-- This query shows all users with admin or superadmin roles
-- Run this in Supabase SQL Editor to see what admins exist

-- Check all users in partner_users table with admin roles
SELECT 
  pu.id as partner_user_id,
  pu.auth_user_id,
  pu.email,
  pu.full_name,
  pu.role,
  pu.partner_id,
  p.name as partner_name,
  u.id as auth_user_id_from_auth,
  u.email as auth_email,
  u.raw_app_meta_data->>'role' as app_metadata_role,
  u.raw_user_meta_data->>'role' as user_metadata_role,
  CASE 
    WHEN pu.role IN ('admin', 'sef_admin', 'superadmin') THEN '✅ ADMIN'
    WHEN pu.role = 'partner' THEN 'Partner'
    ELSE 'Other'
  END as role_status
FROM partner_users pu
LEFT JOIN partners p ON p.id = pu.partner_id
LEFT JOIN auth.users u ON u.id = pu.auth_user_id
WHERE pu.role IN ('admin', 'sef_admin', 'superadmin')
ORDER BY 
  CASE pu.role
    WHEN 'superadmin' THEN 1
    WHEN 'sef_admin' THEN 2
    WHEN 'admin' THEN 3
    ELSE 4
  END,
  pu.full_name;

-- Summary count
SELECT 
  role,
  COUNT(*) as count
FROM partner_users
WHERE role IN ('admin', 'sef_admin', 'superadmin')
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'superadmin' THEN 1
    WHEN 'sef_admin' THEN 2
    WHEN 'admin' THEN 3
    ELSE 4
  END;

-- Check if there are any users without auth_user_id (orphaned records)
SELECT 
  pu.id,
  pu.email,
  pu.full_name,
  pu.role,
  '⚠️ Missing auth_user_id' as issue
FROM partner_users pu
WHERE pu.auth_user_id IS NULL
  AND pu.role IN ('admin', 'sef_admin', 'superadmin');

-- Check if there are auth users without partner_users records
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_app_meta_data->>'role' as app_metadata_role,
  '⚠️ No partner_users record' as issue
FROM auth.users u
WHERE u.raw_app_meta_data->>'role' IN ('admin', 'sef_admin', 'superadmin')
  AND NOT EXISTS (
    SELECT 1 FROM partner_users pu WHERE pu.auth_user_id = u.id
  );

