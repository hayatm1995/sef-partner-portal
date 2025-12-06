# Migration Execution Instructions

## ⚠️ IMPORTANT: Two-Step Execution Required

This migration must be run in **two separate executions** to avoid Postgres transaction errors with enum creation.

---

## Step 1: Create Enum Type

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click **SQL Editor** → **New Query**

2. **Copy STEP 1 Only**
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy **only** the STEP 1 section (from line 1 to the end of the enum creation)
   - This includes:
     - UUID extension creation
     - Enum type creation with idempotent checks
     - Enum value additions

3. **Paste and Run**
   - Paste into SQL Editor
   - Click **Run** (or Cmd+Enter / Ctrl+Enter)
   - **Wait for success message**

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - The enum type is now committed to the database

---

## Step 2: Create Schema (Tables, Indexes, Triggers, Policies)

1. **Still in SQL Editor**
   - Click **New Query** (or clear the previous query)

2. **Copy STEP 2 Only**
   - From `supabase/migrations/001_initial_schema.sql`
   - Copy **only** the STEP 2 section (from "STEP 2: Schema creation" to the end)
   - This includes:
     - All table definitions
     - Indexes
     - Triggers
     - RLS policies

3. **Paste and Run**
   - Paste into SQL Editor
   - Click **Run**
   - **Wait for success message**

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - All tables, indexes, triggers, and policies are now created

---

## Verification Checklist

After both steps complete:

- [ ] Go to **Table Editor** in Supabase Dashboard
- [ ] Verify these tables exist:
  - ✅ `partners`
  - ✅ `partner_users`
  - ✅ `exhibitor_stands`
  - ✅ `deliverables`
  - ✅ `nominations`
  - ✅ `approvals`
  - ✅ `media_tracker`
  - ✅ `notifications`
  - ✅ `activity_log`

- [ ] Verify enum type exists:
  - Go to **Database** → **Types**
  - Should see `user_role` enum with values: admin, marketing, operations, viewer, sef_admin

---

## Why Two Steps?

Postgres wraps SQL execution in a transaction. When you:
1. Create an enum type
2. Reference that enum in a table definition

...all in the same transaction, Postgres throws:
```
ERROR: cannot alter type "user_role" because it is in use
```

By running STEP 1 separately, the enum is committed before STEP 2 references it.

---

## Troubleshooting

### Error: "type user_role already exists"
- ✅ This is fine! The enum already exists from a previous run
- Continue to STEP 2

### Error: "relation already exists"
- ✅ Tables already exist from a previous run
- The migration uses `CREATE TABLE IF NOT EXISTS`, so this is safe
- Continue - it will skip existing tables

### Error: "cannot alter type user_role because it is in use"
- ❌ You tried to run both steps together
- Solution: Run STEP 1 first, wait for commit, then run STEP 2

---

## Next Steps

After migration completes:
1. Run the seed script: `supabase/seed_production.sql`
2. Create an auth user in Supabase Dashboard
3. Test the connection in your app



