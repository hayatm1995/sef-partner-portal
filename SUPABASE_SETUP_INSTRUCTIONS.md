# Supabase Database Setup Instructions

## ✅ Complete Production Schema Setup

Follow these steps to set up your complete production database schema.

---

## Step 1: Run the Migration

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `kirjkysvssiyfdjkzmme`

2. **Open SQL Editor**
   - Click on **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy and Paste Migration**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click **Run** (or press Cmd+Enter / Ctrl+Enter)
   - Wait for execution to complete
   - You should see "Success. No rows returned"

5. **Verify Tables Created**
   - Go to **Table Editor** in the left sidebar
   - You should see these tables:
     - ✅ `partners`
     - ✅ `partner_users`
     - ✅ `exhibitor_stands`
     - ✅ `deliverables`
     - ✅ `nominations`
     - ✅ `approvals`
     - ✅ `media_tracker`
     - ✅ `notifications`
     - ✅ `activity_log`

---

## Step 2: Create Auth User

1. **Go to Authentication**
   - Click **Authentication** → **Users** in the left sidebar

2. **Add User**
   - Click **Add User** → **Create new user**
   - Enter email: `demo@partner.com` (or your preferred email)
   - Set a password (or use "Auto-generate password")
   - Click **Create User**

3. **Copy User UUID**
   - After creating the user, click on the user
   - Copy the **UUID** (it looks like: `123e4567-e89b-12d3-a456-426614174000`)
   - You'll need this for the seed script

---

## Step 3: Run Seed Script

1. **Open SQL Editor Again**
   - Click **SQL Editor** → **New Query**

2. **Update Seed Script**
   - Open `supabase/seed_production.sql`
   - The script will automatically use the most recent auth user
   - If you want to use a specific user, you can modify the script

3. **Run Seed Script**
   - Copy the entire contents of `supabase/seed_production.sql`
   - Paste into SQL Editor
   - Click **Run**

4. **Check Output**
   - You should see messages like:
     ```
     ✅ Seed data inserted successfully!
     Partner ID: [uuid]
     Auth User ID: [uuid]
     ```

5. **Verify Data**
   - Go to **Table Editor**
   - Check `partners` table - should have "Demo Partner"
   - Check `partner_users` table - should have admin user
   - Check `exhibitor_stands` table - should have stand with "Assignment Pending"
   - Check `deliverables` table - should have 1 item with "Pending Review"

---

## Step 4: Link Partner User to Auth User

The seed script should automatically link the partner_user to the auth user. If it doesn't work:

1. **Get Auth User UUID**
   - Go to **Authentication** → **Users**
   - Find your user and copy the UUID

2. **Update partner_users Table**
   - Go to **Table Editor** → `partner_users`
   - Find the "Demo Partner Admin" user
   - Update the `auth_user_id` field with the UUID from step 1
   - Update the `email` field to match the auth user email

---

## Step 5: Test the Connection

1. **Open Your App**
   - Go to `http://localhost:5173`
   - You should see the login page

2. **Login**
   - Use the email and password you created in Step 2
   - Click "Sign In"

3. **Verify Dashboard**
   - ✅ Should show "Connected to Supabase" (green status card)
   - ✅ Should show "Demo Partner" as the partner name
   - ✅ Should show partner data from database

4. **Check Exhibitor Stand**
   - Navigate to **Exhibitor Stand** page
   - Should show status: **"Assignment Pending"**
   - This confirms data is loading from database

5. **Check Deliverables**
   - Navigate to **Deliverables** page
   - Should show **1 pending item**: "Company Logo - High Resolution"
   - Status should be "Pending Review"

---

## Verification Checklist

After completing all steps, verify:

- [ ] All 9 tables exist in Table Editor
- [ ] `partners` table has "Demo Partner" record
- [ ] `partner_users` table has admin user with correct `auth_user_id`
- [ ] `exhibitor_stands` table has stand with status "Assignment Pending"
- [ ] `deliverables` table has 1 item with status "Pending Review"
- [ ] Can login with Supabase auth user
- [ ] Dashboard shows "Demo Partner" name
- [ ] Exhibitor Stand page shows "Assignment Pending"
- [ ] Deliverables page shows 1 pending item
- [ ] Green "Connected to Supabase" status card appears

---

## Troubleshooting

### Issue: Migration fails with "relation already exists"
**Solution**: Drop existing tables first, or use `DROP TABLE IF EXISTS` statements

### Issue: Seed script fails with "No auth user found"
**Solution**: Create an auth user first in Authentication → Users, then run seed script

### Issue: Can't login after seeding
**Solution**: 
- Verify `partner_users.email` matches `auth.users.email`
- Verify `partner_users.auth_user_id` matches `auth.users.id`
- Check browser console for errors

### Issue: RLS policies blocking access
**Solution**: 
- Verify `auth_user_id` is correctly set in `partner_users`
- Check that user role is 'admin' or 'sef_admin'
- Temporarily disable RLS to test: `ALTER TABLE partners DISABLE ROW LEVEL SECURITY;`

### Issue: Dashboard shows empty data
**Solution**:
- Check browser console for errors
- Verify RLS policies allow your user to read data
- Check that `partner_id` is correctly linked

---

## Next Steps

Once everything is working:

1. **Add More Partners**: Create additional partner records
2. **Configure OAuth**: Set up Google/Microsoft login in Authentication → Providers
3. **Customize RLS**: Adjust policies based on your security requirements
4. **Add More Data**: Insert additional deliverables, nominations, etc.

---

**Status**: Ready to execute! Follow the steps above to set up your production database.



