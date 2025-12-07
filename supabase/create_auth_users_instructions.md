# Instructions: Create Auth Users for Sheraa Admins

## IMPORTANT: Create Auth Users First

Before running `setup_sheraa_admins.sql`, you must create the auth users in Supabase Dashboard.

## Steps:

1. **Go to Supabase Dashboard** → **Authentication** → **Users**

2. **Click "Add User"** → **"Create new user"**

3. **For each user, create with:**
   - Email: (see list below)
   - Password: Leave blank or auto-generate (they'll use magic link)
   - Auto Confirm User: ✅ **CHECK THIS** (so they can log in immediately)

## Users to Create:

### Superadmins:
- **h.malik@sheraa.ae** (Hayati)
- **hayat.malik6@gmail.com** (Hayat Malik) - *May already exist*

### Admins:
- **s.sohail@sheraa.ae** (Sidiqa Sohail)
- **y.yassin@sheraa.ae** (Yousuf Yassin)
- **a.ahmad@sheraa.ae** (Adeel Ahmad)
- **s.nasir@sheraa.ae** (Sumaiya Nasir)

## After Creating Auth Users:

1. Run `setup_sheraa_admins.sql` in Supabase SQL Editor
2. The script will:
   - Create "Sheraa" partner (if it doesn't exist)
   - Link all users to `partner_users` table with correct roles
   - Verify all users are set up correctly

## Verification:

After running the SQL, check the results:
- All users should show "✅ Ready" status
- Superadmins should have `role = 'superadmin'`
- Admins should have `role = 'admin'`
- All should be linked to "Sheraa" partner

## Login:

Users can now:
1. Go to the app login page
2. Enter their email
3. Click "Send Magic Link"
4. Check email and click the magic link to log in

