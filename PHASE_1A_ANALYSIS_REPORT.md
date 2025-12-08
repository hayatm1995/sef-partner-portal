# Phase 1.A – Analysis Report
## SEF Partner Hub - Role Detection, Partner Fetching, Navigation & Broken Areas

---

## 1. ROLE DETECTION

### Primary Role Detection Mechanisms

#### A. `src/utils/currentUser.ts` - `fetchCurrentUser()`
- **Purpose**: Single source of truth for user role detection
- **How it reads user**: 
  - Gets `authUserId` parameter
  - Calls `supabase.auth.getUser()` to fetch auth user
- **Role determination logic**:
  1. **Hardcoded superadmin emails** (highest priority):
     - `hayat.malik6@gmail.com`
     - `h.malik@sheraa.ae`
     - If email matches → returns `role: 'superadmin'` **even if not in partner_users**
  2. **Queries `partner_users` table**:
     - `SELECT id, role, partner_id, full_name, email, is_disabled FROM partner_users WHERE auth_user_id = ?`
     - Normalizes DB roles: `sef_admin` → `superadmin`, `admin` → `admin`, else → `partner`
  3. **Fallback**: If not in `partner_users` but superadmin email → `superadmin`, else → `unknown`
- **Returns**: `CurrentUser` object with `role`, `partnerId`, `isSuperadmin`, `isAdmin`, `isPartner`

#### B. `src/contexts/AuthContext.jsx` - `AuthProvider`
- **Purpose**: Global auth context provider
- **How it reads user**:
  - Gets session via `supabase.auth.getSession()`
  - Uses `fetchCurrentUser(session.user.id)` for role resolution
- **Role determination**:
  - Delegates to `fetchCurrentUser()` utility
  - Maps `'unknown'` role to `null` for legacy compatibility
  - Stores `role` and `partnerId` in state
- **Exposes**: `role`, `partnerId`, `isSuperadmin`, `user` (enriched), `loading`

#### C. `src/hooks/useCurrentUser.ts` - `useCurrentUser()`
- **Purpose**: React Query hook wrapper around `fetchCurrentUser()`
- **How it reads user**:
  - First query: Gets `authUserId` from `supabase.auth.getUser()`
  - Second query: Calls `fetchCurrentUser(authUserId)`
- **Role determination**: Same as `fetchCurrentUser()` (delegates to it)
- **Returns**: `{ user, isLoading, error, isAuthenticated, isUnknown }`

#### D. `src/utils/auth.ts` - `getUserRole()` & `getUserRoleSync()`
- **Purpose**: Legacy role detection (still used in some places)
- **How it reads user**: Takes `user` object as parameter
- **Role determination priority**:
  1. Hardcoded superadmin (UID or email match)
  2. `app_metadata.role` (JWT metadata)
  3. `user_metadata.role` (fallback)
  4. `partner_users` table query
  5. Defaults to `'partner'`
- **Note**: This is a **duplicate** of `fetchCurrentUser()` logic but returns different format

#### E. `src/utils/getUserRole.js` - `getUserRole()` & `getUserRoleSync()`
- **Purpose**: Another legacy role detection (older version)
- **How it reads user**: Takes `user` object as parameter
- **Role determination**: Similar to `auth.ts` but simpler (no `partner_id` return)
- **Note**: **Duplicate logic** - should be consolidated

#### F. `src/hooks/useUserPartner.js` - `useUserPartner()`
- **Purpose**: Fetches partner context from `v_user_partner_context` view
- **How it reads user**: Takes `authUserId` parameter
- **Query**: `SELECT * FROM v_user_partner_context WHERE auth_user_id = ?`
- **Returns**: `partner_id`, `partner_role`, `partner_name`, etc.
- **Note**: Uses database view, not direct table queries

### Summary of Role Detection
- **Primary source**: `fetchCurrentUser()` in `src/utils/currentUser.ts`
- **Context provider**: `AuthContext` uses `fetchCurrentUser()`
- **Superadmin override**: Hardcoded emails always return `superadmin` even if missing from `partner_users`
- **Database source**: `partner_users` table with `auth_user_id` lookup
- **Issues**: Multiple duplicate implementations (`auth.ts`, `getUserRole.js`, `currentUser.ts`)

---

## 2. PARTNER FETCHING LOGIC

### Primary Partner Fetching Functions

#### A. `src/services/supabaseService.js` - `partnersService.getAll()`
- **Purpose**: Fetch partners with role-based filtering
- **Query logic**:
  - **For superadmin/admin**: 
    - `SELECT * FROM partners ORDER BY created_at DESC`
    - **No filtering** - RLS handles permissions (S2 model: admins see ALL partners)
  - **For partner role**:
    - `SELECT * FROM partners` (subject to RLS - RLS filters to their `partner_id` only)
  - **If `partnerId` provided**: Filters by `WHERE id = partnerId`
- **Handles multiple rows**: Returns array (allows multiple partners for admins)
- **Handles no rows**: Returns empty array `[]`
- **Assumptions**: 
  - Superadmins/admins see ALL partners (S2 model)
  - Partners only see their own (via RLS)
  - RLS policies must be correctly configured

#### B. `src/services/supabaseService.js` - `partnersService.getById()`
- **Purpose**: Fetch single partner by ID
- **Query**: `SELECT * FROM partners WHERE id = ? LIMIT 1`
- **Handles no rows**: Throws error (no fallback)
- **Assumptions**: Partner exists and user has permission (RLS enforced)

#### C. `src/services/supabaseService.js` - `partnersService.getByUserEmail()`
- **Purpose**: Get partner for a user by email
- **Query logic**:
  1. `SELECT partner_id FROM partner_users WHERE email = ?`
  2. `SELECT * FROM partners WHERE id = ?`
- **Handles no rows**: Returns `null` if user not found
- **Assumptions**: User exists in `partner_users` table

#### D. `src/pages/PartnerHub.jsx` - Partner fetching
- **Purpose**: Fetch partner data for Partner Hub page
- **Query logic**:
  1. First tries: `SELECT *, partners(*) FROM partner_users WHERE auth_user_id = ?`
  2. Fallback: `partnerUsersService.getByEmail(user.email)`
  3. Then: `partnersService.getById(currentPartnerId)`
- **Handles no rows**: Returns `null`, shows loading state
- **Assumptions**: User has `partner_id` in `partner_users` table

#### E. `src/hooks/useUserPartner.js` - `useUserPartner()`
- **Purpose**: Fetch partner context from view
- **Query**: `SELECT * FROM v_user_partner_context WHERE auth_user_id = ?`
- **Handles no rows**: Returns `null` (PGRST116 error is OK)
- **Assumptions**: View exists and is accessible

### Summary of Partner Fetching
- **Primary service**: `partnersService.getAll()` with role-based filtering
- **S2 Model**: Admins see ALL partners (no `admin_partner_map` filtering)
- **RLS dependency**: All queries rely on RLS policies for security
- **Multiple sources**: Direct queries, service functions, hooks, views
- **Issues**: 
  - Inconsistent error handling (some throw, some return null)
  - RLS blocking queries when role not properly set in JWT

---

## 3. ADMIN / PARTNER NAVIGATION CONTROL

### Route Guards

#### A. `src/components/auth/AuthGuard.jsx`
- **Purpose**: Ensures user is authenticated
- **Logic**:
  - Waits for `role` to be resolved (shows loading if `loading || (session && !role)`)
  - Redirects to `/Login` if no session/user
  - Renders children only after role is confirmed
- **Protection level**: Authentication only (not role-based)

#### B. `src/components/auth/RoleGuard.jsx`
- **Purpose**: Protects routes based on specific roles
- **Props**: `requireAdmin`, `requirePartner`, `allowedRoles[]`
- **Logic**:
  - Waits for `role` from `useAuth()`
  - Uses `getUserRoleSync()` as fallback if role not in context
  - Validates role is one of: `['superadmin', 'admin', 'partner']`
  - **requireAdmin**: Allows `admin` OR `superadmin`
  - **requirePartner**: Allows ONLY `partner` (excludes admin/superadmin)
  - **allowedRoles**: Specific role array
- **Redirects**: `/Unauthorized` if access denied

#### C. `src/components/auth/RouteGuard.jsx`
- **Purpose**: Prevents role-based route access violations
- **Logic**:
  - Waits for `role` resolution
  - **Admin/superadmin accessing `/partner/*`**: Redirects to `/admin/dashboard` (unless `?viewAs=partnerId`)
  - **Partner accessing `/admin/*` or `/superadmin/*`**: Redirects to `/partner/dashboard`
  - Allows "view as partner" via query param for admins
- **Protection level**: Route path-based

#### D. `src/pages/index.jsx` - Route definitions
- **Purpose**: Main route configuration
- **Logic**:
  - Wraps routes in `<AuthGuard><RouteGuard>`
  - Uses `<RoleGuard requireAdmin={true}>` for admin routes
  - Validates role before rendering routes
  - Shows `NoPartnerProfileFound` if role invalid
- **Admin routes**: `/admin/*` paths
- **Partner routes**: `/partner/*` paths (implicit)

#### E. `src/pages/Layout.jsx` - Sidebar navigation
- **Purpose**: Controls sidebar menu visibility
- **Logic**:
  - Uses `role` from `useAuth()`
  - `isSuperAdmin`, `isAdmin`, `isPartner` flags
  - Conditionally renders menu items based on role
  - Shows "View as Partner" dropdown for admins
- **Menu items**:
  - **Superadmin**: All items + superadmin-only config
  - **Admin**: All operational items (no superadmin config)
  - **Partner**: Only partner hub items

### Summary of Navigation Control
- **Three-layer protection**: `AuthGuard` → `RouteGuard` → `RoleGuard`
- **Sidebar**: Role-based menu rendering in `Layout.jsx`
- **Route paths**: `/admin/*` for admins, `/partner/*` for partners
- **Issues**: 
  - Role must be resolved before any guards work (loading states critical)
  - Multiple guards can conflict if role resolution is slow

---

## 4. ADMIN DASHBOARD METRICS ISSUE

### Problem
- **Error**: `AdminDashboardMetrics is not defined`
- **Location**: `src/pages/Dashboard.jsx`
- **Lines**: 298, 354

### Analysis
- **Component exists**: `src/components/dashboard/AdminDashboardMetrics.tsx` ✅
- **Component is exported**: `export default function AdminDashboardMetrics` ✅
- **Import statement**: **MISSING** ❌
- **Usage**: Component is used but never imported:
  ```tsx
  // Line 298: <AdminDashboardMetrics isSuperAdmin={true} />
  // Line 354: <AdminDashboardMetrics isSuperAdmin={false} assignedPartners={assignedPartners} />
  ```
- **Import section** (lines 1-35): No import for `AdminDashboardMetrics`
- **Other imports present**: `AdminNotificationWidget`, `QuickActions`, `PartnerDashboard`, etc.

### Root Cause
**Missing import statement** in `src/pages/Dashboard.jsx`:
```tsx
// Should be added:
import AdminDashboardMetrics from "../components/dashboard/AdminDashboardMetrics";
```

### Fix Required
Add import statement at top of `Dashboard.jsx` file.

---

## 5. MANAGE PARTNERS ISSUE

### Problem
- **Error**: "User not found in partner_users" or empty partner list
- **Location**: `src/pages/admin/AdminPartners.jsx`
- **Line**: 103

### Analysis

#### Error Message Source
- **Line 103**: 
  ```javascript
  const errorMsg = `User ${user?.email} (${user?.id}) not found in partner_users table. Please create a row with role = 'superadmin' or 'sef_admin'`;
  ```
- **Context**: Inside `partnersService.getAll()` query function
- **Trigger**: When `userRoleCheck` is null/undefined after querying `partner_users`

#### Query Logic (lines 81-106)
1. **Step 1**: Queries `partner_users` table:
   ```sql
   SELECT role, email, full_name, auth_user_id 
   FROM partner_users 
   WHERE auth_user_id = user?.id
   ```
2. **Step 2**: If no row found (`!userRoleCheck`), throws error with message
3. **Step 3**: Direct test query to `partners` table (bypassing service)
4. **Step 4**: Calls `partnersService.getAll()` with role

#### Root Causes
1. **User missing from `partner_users` table**:
   - Superadmin emails (`hayat.malik6@gmail.com`, `h.malik@sheraa.ae`) should work via email override in `fetchCurrentUser()`
   - But `AdminPartners.jsx` does **direct DB query** that doesn't use email override
   - If user not in `partner_users`, query returns null → error thrown

2. **RLS blocking queries**:
   - Lines 110-144: Direct query test shows RLS errors
   - Error code `42501` = permission denied
   - RLS policies expect role in JWT `app_metadata` or `partner_users` table

3. **Role resolution timing**:
   - Query enabled condition: `enabled: isAdmin && !!user && (!!userRole || isSuperAdmin)`
   - If `userRole` is null but user is superadmin email, query may not run
   - Or query runs but RLS blocks because JWT doesn't have role

#### Issues Identified
1. **Inconsistent role detection**: `AdminPartners.jsx` does its own DB query instead of using `fetchCurrentUser()`
2. **No email override**: Direct query doesn't check superadmin emails
3. **RLS dependency**: Queries fail if JWT `app_metadata.role` not set
4. **Error handling**: Throws error instead of graceful fallback

### Fix Required
1. Use `fetchCurrentUser()` instead of direct `partner_users` query
2. Add email-based superadmin check before throwing error
3. Ensure JWT `app_metadata.role` is set (via Edge Function or sync)
4. Add fallback to direct query if service fails

---

## 6. PARTNER HUB ISSUE

### Problem
- **Symptom**: Partner Hub is blank / not showing partner details
- **Location**: `src/pages/PartnerHub.jsx`

### Analysis

#### Partner Fetching Logic (lines 68-138)
1. **Query 1** (lines 68-108): Fetches `partner_user` data:
   - Tries: `SELECT *, partners(*) FROM partner_users WHERE auth_user_id = ?`
   - Fallback: `partnerUsersService.getByEmail(user.email)`
   - **Enabled only if**: `!!user && (!!user.id || !!user.email) && !viewAsPartnerId && role === 'partner'`
   - **Issue**: If `role` is not `'partner'` yet, query doesn't run

2. **Partner ID Resolution** (line 111):
   ```javascript
   const resolvedPartnerId = viewAsPartnerId || partnerId || partnerUserData?.partner_id || partner?.id;
   ```
   - **Issue**: If all are null/undefined, `currentPartnerId` is null

3. **Query 2** (lines 122-138): Fetches partner data:
   - `partnersService.getById(currentPartnerId)`
   - **Enabled only if**: `!!currentPartnerId && !isAdminGlobalView`
   - **Issue**: If `currentPartnerId` is null, query never runs

4. **Loading State** (lines 119, 141):
   - Shows loading if `authLoading || (role === 'partner' && !currentPartnerId && loadingPartnerUser)`
   - **Issue**: If `role` is not `'partner'` yet, loading state may not show, but partner data never loads

#### Root Causes
1. **Role resolution dependency**: Partner Hub queries depend on `role === 'partner'` being set
2. **Partner ID missing**: If `partnerId` from context is null, and `partnerUserData` query fails, no partner ID
3. **Query enabled conditions**: Too strict - queries don't run if role not yet resolved
4. **No fallback**: If all partner ID sources fail, page shows blank

#### Issues Identified
1. **Circular dependency**: Partner Hub needs `role` to be `'partner'`, but role resolution may depend on `partner_users` query
2. **Missing partner_id**: If user not in `partner_users` or `partner_id` is null, no data loads
3. **Loading state logic**: May exit loading before partner data is fetched
4. **No error state**: Blank page instead of error message

### Fix Required
1. Make partner fetching independent of role (use `partnerId` from context)
2. Add fallback queries if primary query fails
3. Show error state if partner not found
4. Ensure `partnerId` is set in `AuthContext` before Partner Hub loads

---

## SUMMARY OF ISSUES

### Critical Issues
1. **AdminDashboardMetrics**: Missing import statement
2. **AdminPartners**: Direct DB query doesn't use email override, throws error if user missing
3. **Partner Hub**: Queries depend on role being `'partner'`, but role may not be resolved yet

### Architectural Issues
1. **Multiple role detection implementations**: `auth.ts`, `getUserRole.js`, `currentUser.ts` (duplicate logic)
2. **Inconsistent partner fetching**: Some use services, some use direct queries, some use views
3. **RLS dependency**: Queries fail if JWT `app_metadata.role` not set
4. **No email override in direct queries**: `AdminPartners.jsx` doesn't check superadmin emails

### Recommended Fixes (Priority Order)
1. **Fix AdminDashboardMetrics import** (trivial - 1 line)
2. **Consolidate role detection** to single source (`fetchCurrentUser()`)
3. **Add email override** to `AdminPartners.jsx` before throwing error
4. **Fix Partner Hub** query enabled conditions to not depend on role
5. **Ensure JWT metadata sync** via Edge Function or backend

---

**End of Analysis Report**

