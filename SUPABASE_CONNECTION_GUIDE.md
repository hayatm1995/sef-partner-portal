# Supabase Connection Guide

## ✅ Setup Complete

All code changes have been made to connect the app to a real Supabase backend.

---

## 📋 Step-by-Step Setup

### 1. Create `.env` File

Create a `.env` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Application Configuration
VITE_APP_URL=http://localhost:5173
VITE_BASE44_APP_ID=68f50edf823231efaa8f1c55
```

**To get your Supabase credentials:**
1. Go to https://supabase.com
2. Create a new project or select existing project
3. Go to **Settings** → **API**
4. Copy **Project URL** → `VITE_SUPABASE_URL`
5. Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

### 2. Run Database Migration

1. Go to Supabase Dashboard → **SQL Editor**
2. Open `supabase/migrations/001_initial_schema.sql`
3. Copy and paste the entire SQL into the editor
4. Click **Run** to execute
5. Verify tables are created in **Table Editor**

---

### 3. Seed Sample Data

1. Go to Supabase Dashboard → **SQL Editor**
2. Open `supabase/seed.sql`
3. **IMPORTANT**: Update the email in the seed script:
   ```sql
   'admin@demo.com',  -- CHANGE THIS TO YOUR TEST EMAIL
   ```
4. Copy and paste into SQL Editor
5. Click **Run** to execute
6. Verify data in **Table Editor**

**What gets created:**
- 1 partner: "Demo Partner"
- 1 partner_user: Admin user (with your email)
- Sample notification, deliverable, nomination, exhibitor stand

---

### 4. Create Supabase Auth User

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter the **same email** you used in the seed script
4. Set a password (or use "Auto-generate password")
5. Click **Create User**

**Important:** The email must match the email in `partner_users` table!

---

### 5. Test the Connection

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open browser console and run:
   ```javascript
   // Health check
   import { displayHealthCheckResults } from './src/utils/supabaseHealthCheck';
   displayHealthCheckResults();
   ```

3. Navigate to `http://localhost:5173`
   - Should redirect to `/Login` if not authenticated
   - Login with your Supabase user email/password
   - Should redirect to `/Dashboard`
   - Should see "Connected to Supabase" status card

---

## 🔍 Health Check Tests

The app includes automatic health checks that test:

1. ✅ **Read Partners Table** - Verifies database connection
2. ✅ **Insert Partner Record** - Tests write permissions
3. ✅ **Delete Partner Record** - Tests delete permissions
4. ✅ **Supabase Auth Connection** - Verifies auth service

You can run health checks manually:
```javascript
// In browser console
import { runHealthCheck } from './src/utils/supabaseHealthCheck';
const results = await runHealthCheck();
console.log(results);
```

---

## 🛡️ Authentication Flow

### Protected Routes
- All routes except `/Login` require authentication
- Unauthenticated users are redirected to `/Login`
- Authenticated users on `/Login` are redirected to `/Dashboard`

### Auth Loading State
- Shows loading spinner while checking authentication
- Prevents blank screen during auth check

### Test User Login
- **Only available on localhost** (for security)
- Tries to use real Supabase data if available
- Falls back to mock data if Supabase is not configured

---

## 📊 What's Connected

### ✅ Using Real Supabase Data:
- **Authentication** - Email/password, Magic Link, OAuth
- **Partners** - All partner data
- **Partner Users** - User accounts and roles
- **Deliverables** - File uploads and status
- **Nominations** - Speaker/judge submissions
- **Exhibitor Stands** - Booth management
- **Notifications** - In-app notifications

### ⚠️ Still Using Base44 (can be migrated):
- Contracts table
- Activity logs
- File storage (consider Supabase Storage)

---

## 🐛 Troubleshooting

### Blank Screen
- **Fixed**: Added `AuthGuard` component with loading state
- **Fixed**: Proper redirects for authenticated/unauthenticated users

### "Supabase not configured" Warning
- Check `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after adding `.env` file

### Login Fails
- Verify user exists in Supabase Auth
- Verify `partner_users` record exists with matching email
- Check browser console for errors

### Data Not Showing
- Verify RLS policies allow your user to read data
- Check that `partner_id` is correctly linked
- Verify seed data was inserted correctly

### Health Check Fails
- Check Supabase project is active
- Verify API keys are correct
- Check RLS policies allow operations
- Verify network connectivity

---

## ✅ Success Indicators

When everything is working, you should see:

1. ✅ **"Connected to Supabase"** status card on dashboard
2. ✅ Dashboard shows real partner data
3. ✅ Sidebar shows modules based on user role
4. ✅ Notifications load from database
5. ✅ Deliverables/Nominations show real data
6. ✅ No console errors related to Supabase

---

## 🚀 Next Steps

1. **Add more partners** via Supabase dashboard or admin panel
2. **Configure OAuth providers** (Google, Microsoft) in Supabase Auth settings
3. **Migrate file storage** to Supabase Storage
4. **Add contracts table** to Supabase schema
5. **Customize RLS policies** based on your security requirements

---

**Status**: ✅ Ready to connect to real Supabase instance!



