-- User Setup Script for hayat.malik@sheraa.ae
-- IMPORTANT: Create the auth user FIRST in Supabase Dashboard → Authentication → Users
-- Then run this script to link the partner_user record

-- Step 1: Ensure Demo Partner exists
INSERT INTO public.partners (name, tier, contract_status, assigned_account_manager, website_url)
VALUES (
  'Demo Partner',
  'Platinum',
  'Signed',
  'Sarah Johnson',
  'https://demo-partner.com'
)
ON CONFLICT DO NOTHING;

-- Step 2: Link partner_user to auth user
DO $$
DECLARE
  partner_uuid UUID;
  auth_user_uuid UUID;
  user_email TEXT := 'hayat.malik@sheraa.ae';
BEGIN
  -- Get Demo Partner ID
  SELECT id INTO partner_uuid
  FROM public.partners
  WHERE name = 'Demo Partner'
  LIMIT 1;

  -- If partner doesn't exist, create it
  IF partner_uuid IS NULL THEN
    INSERT INTO public.partners (name, tier, contract_status, assigned_account_manager, website_url)
    VALUES ('Demo Partner', 'Platinum', 'Signed', 'Sarah Johnson', 'https://demo-partner.com')
    RETURNING id INTO partner_uuid;
  END IF;

  -- Get auth user by email
  SELECT id INTO auth_user_uuid
  FROM auth.users
  WHERE email = user_email
  LIMIT 1;

  -- If auth user doesn't exist, raise error
  IF auth_user_uuid IS NULL THEN
    RAISE EXCEPTION 'Auth user with email % not found. Please create the user first in Supabase Dashboard → Authentication → Users', user_email;
  END IF;

  -- Insert or update partner_user
  INSERT INTO public.partner_users (partner_id, auth_user_id, full_name, email, role)
  VALUES (
    partner_uuid,
    auth_user_uuid,
    'Hayat Malik',
    user_email,
    'admin'::public.user_role
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    partner_id = partner_uuid,
    auth_user_id = auth_user_uuid,
    role = 'admin'::public.user_role,
    full_name = 'Hayat Malik';

  -- Ensure exhibitor stand exists
  INSERT INTO public.exhibitor_stands (partner_id, booth_number, status, admin_comments)
  VALUES (
    partner_uuid,
    'A-101',
    'Assignment Pending',
    'Booth assignment pending. Please wait for admin confirmation.'
  )
  ON CONFLICT DO NOTHING;

  -- Ensure deliverable exists
  INSERT INTO public.deliverables (partner_id, name, type, status, notes)
  VALUES (
    partner_uuid,
    'Company Logo - High Resolution',
    'Media Asset',
    'Pending Review',
    'Please upload high-resolution logo (minimum 300 DPI, PNG or SVG format)'
  )
  ON CONFLICT DO NOTHING;

  -- Ensure notification exists
  INSERT INTO public.notifications (partner_id, title, message, type)
  VALUES (
    partner_uuid,
    'Welcome to SEF Partner Portal',
    'Your account has been set up successfully. Please complete your deliverables and check your exhibitor stand status.',
    'info'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ User setup completed successfully!';
  RAISE NOTICE 'Partner ID: %', partner_uuid;
  RAISE NOTICE 'Auth User ID: %', auth_user_uuid;
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login with:';
  RAISE NOTICE 'Email: %', user_email;
  RAISE NOTICE 'Password: hayat123';

END $$;

-- Verification
SELECT 
  pu.email,
  pu.full_name,
  pu.role,
  p.name as partner_name,
  p.contract_status
FROM public.partner_users pu
JOIN public.partners p ON pu.partner_id = p.id
WHERE pu.email = 'hayat.malik@sheraa.ae';



