# Create Login Credentials - Quick Setup

## For: hayat.malik@sheraa.ae

Follow these steps to create your login credentials:

---

## Step 1: Create Auth User in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project: `kirjkysvssiyfdjkzmme`

2. **Navigate to Authentication**
   - Click **Authentication** in the left sidebar
   - Click **Users** tab

3. **Add User**
   - Click **Add User** button (top right)
   - Select **Create new user**

4. **Enter User Details**
   - **Email**: `hayat.malik@sheraa.ae`
   - **Password**: `hayat123`
   - **Auto Confirm User**: ✅ Check this box (so you can login immediately)
   - Click **Create User**

5. **Verify User Created**
   - You should see the user in the users list
   - Note the UUID (you don't need to copy it, the script will find it)

---

## Step 2: Run User Setup Script

1. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Run Setup Script**
   - Open `supabase/create_user_setup.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**

3. **Verify Success**
   - You should see messages like:
     ```
     ✅ User setup completed successfully!
     Partner ID: [uuid]
     Auth User ID: [uuid]
     Email: hayat.malik@sheraa.ae
     ```

---

## Step 3: Test Login

1. **Open Your App**
   - Go to `http://localhost:5173`
   - You should see the login page

2. **Login**
   - **Email**: `hayat.malik@sheraa.ae`
   - **Password**: `hayat123`
   - Click **Sign In**

3. **Verify Dashboard**
   - Should redirect to Dashboard
   - Should show "Connected to Supabase" (green status card)
   - Should show "Demo Partner" as partner name
   - Should show your name: "Hayat Malik"

---

## Troubleshooting

### "Auth user not found" error
- **Solution**: Make sure you created the auth user in Step 1 before running the script

### "Cannot login" after setup
- **Check**: Verify `partner_users.email` matches `auth.users.email` exactly
- **Check**: Verify `partner_users.auth_user_id` matches `auth.users.id`
- **Check**: Make sure "Auto Confirm User" was checked when creating the auth user

### Dashboard shows empty data
- **Check**: Verify the seed data was inserted (exhibitor stand, deliverable, notification)
- **Check**: Browser console for any errors
- **Check**: Network tab for failed API requests

---

## What Gets Created

- ✅ Partner: "Demo Partner" (Platinum tier, Signed contract)
- ✅ Partner User: "Hayat Malik" (admin role, linked to auth user)
- ✅ Exhibitor Stand: Booth A-101 (Assignment Pending status)
- ✅ Deliverable: Company Logo (Pending Review status)
- ✅ Notification: Welcome message

---

**After completing these steps, you should be able to login successfully!**



