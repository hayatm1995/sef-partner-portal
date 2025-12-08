# Phase 1.A – RLS Analysis Report
## Supabase Row Level Security Policies Analysis

---

## EXECUTIVE SUMMARY

**Critical Finding**: All RLS policies rely on **database queries** to `partner_users` table, **NOT** on JWT claims. This means:
- Policies check: `EXISTS (SELECT 1 FROM partner_users WHERE auth_user_id = auth.uid() AND role = '...')`
- They do **NOT** check: `jwt.claims.role`, `auth.jwt()`, or `app_metadata.role`
- **Impact**: If user is not in `partner_users` table, ALL policies fail, even for superadmin emails

**Superadmin Override Issue**: Frontend has hardcoded email override, but RLS policies don't. If superadmin emails are not in `partner_users` table, RLS will block them.

---

## 1. PARTNERS TABLE RLS POLICIES

### Policy 1: "Partner users can view their own partner"
**Location**: `supabase/migrations/001_initial_schema.sql:248-254`

**SQL Condition**:
```sql
FOR SELECT USING (
  id IN (
    SELECT partner_id FROM public.partner_users 
    WHERE auth_user_id = auth.uid()
  )
)
```

**JWT Claims Expected**: 
- **NONE** - Uses `auth.uid()` only (from JWT `sub` claim)
- Queries `partner_users` table to get `partner_id`

**How JWT Satisfies**:
- JWT must have valid `sub` (user ID) claim
- User must exist in `partner_users` table with `auth_user_id = auth.uid()`
- User must have a `partner_id` set

**Impact**: 
- ✅ Partners can see their own partner record
- ❌ **BLOCKS partners if not in `partner_users` table**
- ❌ **BLOCKS superadmins if not in `partner_users` table**

---

### Policy 2: "Superadmins can view all partners" (Updated)
**Location**: `supabase/migrations/015_fix_superadmin_rls.sql:15-22` and `016_ensure_superadmin_policies.sql:19-26`

**SQL Condition**:
```sql
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND (role = 'sef_admin' OR role = 'superadmin')
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only
- Queries `partner_users` table to check role

**How JWT Satisfies**:
- JWT must have valid `sub` (user ID)
- User must exist in `partner_users` table
- User's `role` must be `'sef_admin'` OR `'superadmin'`

**Impact**:
- ✅ Superadmins with `role = 'superadmin'` or `'sef_admin'` in DB can see all partners
- ❌ **BLOCKS superadmins if not in `partner_users` table** (even with hardcoded email override)
- ❌ **BLOCKS superadmins if role is not exactly `'superadmin'` or `'sef_admin'`**

---

### Policy 3: "Superadmins can manage all partners"
**Location**: `supabase/migrations/015_fix_superadmin_rls.sql:25-39` and `016_ensure_superadmin_policies.sql:29-43`

**SQL Condition**:
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND (role = 'sef_admin' OR role = 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND (role = 'sef_admin' OR role = 'superadmin')
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only
- Queries `partner_users` table

**How JWT Satisfies**:
- Same as Policy 2, but for INSERT/UPDATE/DELETE operations

**Impact**:
- ✅ Superadmins can manage all partners (if in DB with correct role)
- ❌ **BLOCKS superadmins if not in `partner_users` table**

---

### Policy 4: "SEF Admins can manage all partners" (Legacy)
**Location**: `supabase/migrations/002_add_partner_management_fields.sql:26-33`

**SQL Condition**:
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'sef_admin'
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**How JWT Satisfies**:
- User must be in `partner_users` with `role = 'sef_admin'` (only, not `'superadmin'`)

**Impact**:
- ⚠️ **CONFLICT**: This policy only checks `'sef_admin'`, not `'superadmin'`
- May be overridden by Policy 3 (which checks both)
- ❌ **BLOCKS users with `role = 'superadmin'` if this policy is active**

---

## 2. PARTNER_USERS TABLE RLS POLICIES

### Policy 1: "Partner users can view their own partner_users"
**Location**: `supabase/migrations/001_initial_schema.sql:256-263`

**SQL Condition**:
```sql
FOR SELECT USING (
  auth_user_id = auth.uid() OR
  partner_id IN (
    SELECT partner_id FROM public.partner_users 
    WHERE auth_user_id = auth.uid()
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**How JWT Satisfies**:
- User can see their own row (`auth_user_id = auth.uid()`)
- OR user can see other users in same partner (`partner_id` match)

**Impact**:
- ✅ Partners can see their own row and teammates
- ❌ **BLOCKS if user not in `partner_users` table**

---

### Policy 2: "Partner admins can manage their partner_users"
**Location**: `supabase/migrations/001_initial_schema.sql:265-271`

**SQL Condition**:
```sql
FOR ALL USING (
  partner_id IN (
    SELECT partner_id FROM public.partner_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**How JWT Satisfies**:
- User must be in `partner_users` with `role = 'admin'` (partner-level admin, not SEF admin)

**Impact**:
- ✅ Partner admins can manage users in their partner
- ❌ **BLOCKS if user not in `partner_users` table**
- ⚠️ **Note**: This is for partner-level admins, not SEF admins

---

### Policy 3: "Superadmins can view all partner_users"
**Location**: `supabase/migrations/015_fix_superadmin_rls.sql:44-58` and `016_ensure_superadmin_policies.sql:46-60`

**SQL Condition**:
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND (role = 'sef_admin' OR role = 'superadmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND (role = 'sef_admin' OR role = 'superadmin')
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**How JWT Satisfies**:
- User must be in `partner_users` with `role = 'sef_admin'` OR `'superadmin'`

**Impact**:
- ✅ Superadmins can see all partner_users (if in DB)
- ❌ **BLOCKS superadmins if not in `partner_users` table**

---

### Policy 4: "SEF Admins can view all partner_users" (Legacy)
**Location**: `supabase/migrations/001_initial_schema.sql:386-393`

**SQL Condition**:
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'sef_admin'
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ⚠️ **CONFLICT**: Only checks `'sef_admin'`, not `'superadmin'`
- May be overridden by Policy 3

---

## 3. ADMIN_PARTNER_MAP TABLE RLS POLICIES

### Policy 1: "Superadmins can view all admin partner mappings"
**Location**: `supabase/migrations/014_admin_partner_map_and_disabled_field.sql:42-51`

**SQL Condition**:
```sql
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE auth_user_id = auth.uid()
    AND (role = 'superadmin' OR role = 'sef_admin')
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ Superadmins can see all mappings (if in DB)
- ❌ **BLOCKS if not in `partner_users` table**

---

### Policy 2: "Admins can view their own admin partner mappings"
**Location**: `supabase/migrations/014_admin_partner_map_and_disabled_field.sql:55-66`

**SQL Condition**:
```sql
FOR SELECT USING (
  admin_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
    AND admin_user_id = auth.uid()
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ Admins can see their own assignments
- ❌ **BLOCKS if not in `partner_users` table**

---

### Policy 3: "Superadmins can manage admin partner mappings"
**Location**: `supabase/migrations/014_admin_partner_map_and_disabled_field.sql:70-86`

**SQL Condition**:
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE auth_user_id = auth.uid()
    AND (role = 'superadmin' OR role = 'sef_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partner_users
    WHERE auth_user_id = auth.uid()
    AND (role = 'superadmin' OR role = 'sef_admin')
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ Superadmins can manage mappings (if in DB)
- ❌ **BLOCKS if not in `partner_users` table**

---

## 4. DELIVERABLES TABLE RLS POLICIES

### Policy 1: "Partner users can view their own deliverables"
**Location**: `supabase/migrations/001_initial_schema.sql:289-295`

**SQL Condition**:
```sql
FOR SELECT USING (
  partner_id IN (
    SELECT partner_id FROM public.partner_users 
    WHERE auth_user_id = auth.uid()
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ Partners can see their deliverables
- ❌ **BLOCKS if not in `partner_users` table**

---

### Policy 2: "Partner admins can manage their deliverables"
**Location**: `supabase/migrations/001_initial_schema.sql:297-303`

**SQL Condition**:
```sql
FOR ALL USING (
  partner_id IN (
    SELECT partner_id FROM public.partner_users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ Partner admins can manage deliverables
- ❌ **BLOCKS if not in `partner_users` table**

---

### Policy 3: "SEF Admins can manage all deliverables"
**Location**: `supabase/migrations/001_initial_schema.sql:404-411`

**SQL Condition**:
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'sef_admin'
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ SEF admins can manage all deliverables (if in DB with `role = 'sef_admin'`)
- ❌ **BLOCKS if not in `partner_users` table**
- ⚠️ **Only checks `'sef_admin'`, not `'superadmin'`** (may need update)

---

## 5. PARTNER_SUBMISSIONS TABLE RLS POLICIES

### Policy 1: "Partner users can view their own submissions"
**Location**: `supabase/migrations/003_add_partner_submissions.sql:36-42`

**SQL Condition**:
```sql
FOR SELECT USING (
  partner_id IN (
    SELECT partner_id FROM public.partner_users 
    WHERE auth_user_id = auth.uid()
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ Partners can see their submissions
- ❌ **BLOCKS if not in `partner_users` table**

---

### Policy 2: "Partner users can create their own submissions"
**Location**: `supabase/migrations/003_add_partner_submissions.sql:45-51`

**SQL Condition**:
```sql
FOR INSERT WITH CHECK (
  partner_id IN (
    SELECT partner_id FROM public.partner_users 
    WHERE auth_user_id = auth.uid()
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ Partners can create submissions
- ❌ **BLOCKS if not in `partner_users` table**

---

### Policy 3: "SEF Admins can view all submissions"
**Location**: `supabase/migrations/003_add_partner_submissions.sql:54-61`

**SQL Condition**:
```sql
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'sef_admin'
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ SEF admins can see all submissions (if in DB)
- ❌ **BLOCKS if not in `partner_users` table**
- ⚠️ **Only checks `'sef_admin'`, not `'superadmin'`**

---

### Policy 4: "SEF Admins can manage all submissions"
**Location**: `supabase/migrations/003_add_partner_submissions.sql:64-71`

**SQL Condition**:
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'sef_admin'
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ SEF admins can manage submissions (if in DB)
- ❌ **BLOCKS if not in `partner_users` table**
- ⚠️ **Only checks `'sef_admin'`, not `'superadmin'`**

---

## 6. NOMINATIONS TABLE RLS POLICIES

### Policy 1: "Partner users can view their own nominations"
**Location**: `supabase/migrations/001_initial_schema.sql:305-311`

**SQL Condition**:
```sql
FOR SELECT USING (
  partner_id IN (
    SELECT partner_id FROM public.partner_users 
    WHERE auth_user_id = auth.uid()
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ Partners can see their nominations
- ❌ **BLOCKS if not in `partner_users` table**

---

### Policy 2: "SEF Admins can manage all nominations"
**Location**: `supabase/migrations/001_initial_schema.sql:413-420`

**SQL Condition**:
```sql
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.partner_users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'sef_admin'
  )
)
```

**JWT Claims Expected**:
- **NONE** - Uses `auth.uid()` only

**Impact**:
- ✅ SEF admins can manage nominations (if in DB)
- ❌ **BLOCKS if not in `partner_users` table**
- ⚠️ **Only checks `'sef_admin'`, not `'superadmin'`**

---

## 7. FRONTEND SUPABASE CLIENT CONFIGURATION

### Location: `src/config/supabase.js`

**Configuration**:
```javascript
supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**JWT Claims Usage**:
- ❌ **NO JWT claims are set or used**
- Client uses standard Supabase client (no custom JWT manipulation)
- Relies on Supabase Auth's default JWT structure

**JWT Structure** (from Supabase Auth):
- `sub`: User ID (`auth.uid()`)
- `email`: User email
- `app_metadata`: Custom metadata (can be set by admin functions)
- `user_metadata`: User-provided metadata

**Current State**:
- Frontend does **NOT** set `app_metadata.role` or `app_metadata.partner_id`
- Frontend does **NOT** read JWT claims for role detection
- Frontend relies **ENTIRELY** on `partner_users` table queries

**Mismatch with RLS**:
- RLS policies also rely on `partner_users` table (consistent)
- But RLS has **NO fallback** for superadmin emails
- Frontend has email override, but RLS doesn't

---

## 8. CRITICAL ISSUES IDENTIFIED

### Issue 1: Superadmins Blocked if Not in `partner_users`
**Problem**: 
- All superadmin policies check: `EXISTS (SELECT 1 FROM partner_users WHERE auth_user_id = auth.uid() AND role = '...')`
- If superadmin emails (`hayat.malik6@gmail.com`, `h.malik@sheraa.ae`) are not in `partner_users` table, RLS blocks them

**Impact**:
- ❌ Superadmins cannot see partners
- ❌ Superadmins cannot see partner_users
- ❌ Superadmins cannot manage any data

**Root Cause**:
- RLS policies have **NO email-based override**
- Frontend has email override, but RLS doesn't respect it

---

### Issue 2: Standard Admins Not Covered
**Problem**:
- Most policies only check for `'sef_admin'` or `'superadmin'`
- **NO policies check for `role = 'admin'`** (standard admin role)
- S2 model says admins should see ALL partners, but RLS doesn't allow it

**Impact**:
- ❌ Standard admins (`role = 'admin'`) are **BLOCKED** from seeing all partners
- ❌ Standard admins cannot see deliverables/nominations across all partners
- ❌ Only superadmins can see everything

**Missing Policies**:
- No policy like: `"Admins can view all partners"` with `role = 'admin'`
- No policy like: `"Admins can view all deliverables"` with `role = 'admin'`

---

### Issue 3: Partners Blocked if Not in `partner_users`
**Problem**:
- All partner policies check: `partner_id IN (SELECT partner_id FROM partner_users WHERE auth_user_id = auth.uid())`
- If user not in `partner_users` table, they cannot see their own data

**Impact**:
- ❌ Partners cannot see their partner record
- ❌ Partners cannot see their deliverables
- ❌ Partners cannot create submissions

**Root Cause**:
- RLS requires user to exist in `partner_users` table
- No fallback mechanism

---

### Issue 4: Inconsistent Role Checks
**Problem**:
- Some policies check `role = 'sef_admin'` only
- Some policies check `role = 'sef_admin' OR role = 'superadmin'`
- No policies check `role = 'admin'` for admin access

**Impact**:
- ⚠️ Inconsistent behavior across tables
- Some tables allow `'superadmin'`, some don't
- Standard admins have no access anywhere

---

## 9. JWT vs DATABASE ROLE RESOLUTION

### Current Approach: Database-Only
- **RLS**: Queries `partner_users` table (no JWT claims)
- **Frontend**: Queries `partner_users` table (no JWT claims)
- **JWT**: Contains `sub` (user ID) only, no role/partner_id

### Expected Approach (if using JWT):
- **RLS**: Would check `jwt.claims.role` or `auth.jwt() ->> 'role'`
- **Frontend**: Would read `app_metadata.role` from JWT
- **JWT**: Would contain `app_metadata.role` and `app_metadata.partner_id`

### Mismatch:
- Frontend and RLS both use database queries (consistent)
- But neither has email-based override for superadmins
- JWT metadata is **NOT** being set or used

---

## 10. RECOMMENDATIONS

### Immediate Fixes Needed:

1. **Add Standard Admin Policies**:
   - Create policies for `role = 'admin'` to see all partners (S2 model)
   - Add to all tables: `deliverables`, `nominations`, `partner_submissions`, etc.

2. **Fix Superadmin Policies**:
   - Ensure all policies check `(role = 'sef_admin' OR role = 'superadmin')`
   - OR: Add email-based override function in RLS

3. **Add Fallback for Missing Users**:
   - Create RLS function that checks email if user not in `partner_users`
   - OR: Ensure all users are in `partner_users` table

4. **Sync JWT Metadata** (Optional but Recommended):
   - Set `app_metadata.role` and `app_metadata.partner_id` via Edge Function
   - Update RLS to check JWT claims as fallback
   - Reduces database queries

---

## SUMMARY TABLE

| Table | Partner Policy | Superadmin Policy | Admin Policy | Issue |
|-------|---------------|-------------------|--------------|-------|
| `partners` | ✅ Own partner | ✅ All (if in DB) | ❌ **MISSING** | Admins blocked |
| `partner_users` | ✅ Own + teammates | ✅ All (if in DB) | ❌ **MISSING** | Admins blocked |
| `admin_partner_map` | N/A | ✅ All (if in DB) | ✅ Own mappings | OK |
| `deliverables` | ✅ Own | ⚠️ Only `sef_admin` | ❌ **MISSING** | Inconsistent |
| `partner_submissions` | ✅ Own | ⚠️ Only `sef_admin` | ❌ **MISSING** | Inconsistent |
| `nominations` | ✅ Own | ⚠️ Only `sef_admin` | ❌ **MISSING** | Inconsistent |

**Legend**:
- ✅ = Policy exists and works
- ⚠️ = Policy exists but inconsistent (only checks `sef_admin`, not `superadmin`)
- ❌ = Policy missing

---

**End of RLS Analysis Report**

