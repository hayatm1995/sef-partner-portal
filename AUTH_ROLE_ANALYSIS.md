# Authentication & Role Detection - Analysis & Fix Summary

## TASK 1 - Analysis Complete ✅

### Current State Analysis

#### 1. **Role Detection Sources**
- **Multiple utilities exist:**
  - `src/utils/auth.ts` - Has `getUserRole()` and `getUserRoleSync()`
  - `src/utils/role.ts` - Also has `getUserRole()` and `getUserRoleSync()` (with caching)
  - **Issue:** Duplicate implementations, inconsistent usage

#### 2. **Current Role Detection Flow**
1. Checks SUPERADMIN constant (hardcoded emails: hayat.malik6@gmail.com, h.malik@sheraa.ae)
2. Checks `app_metadata.role` and `app_metadata.partner_id`
3. Checks `user_metadata.role` and `user_metadata.partner_id`
4. Queries `partner_users` table (database source of truth)
5. Defaults to 'partner' if nothing found

#### 3. **AuthContext Implementation**
- Uses `getUserRole()` from `@/utils/auth`
- Stores `role` and `partnerId` in state
- Provides `useAuth()` hook with `user`, `role`, `partnerId`, `isSuperadmin`, etc.

#### 4. **Partner Filtering Logic**
- **Location:** `src/services/supabaseService.js` → `partnersService.getAll()`
- **Current behavior:**
  - Superadmin: Gets ALL partners (no filtering)
  - Admin: Gets only assigned partners via `admin_partner_map` ❌ **INCORRECT** (should see all)
  - Partner: Gets all (subject to RLS which filters to their partner)

#### 5. **Admin Sidebar Visibility**
- **Location:** `src/pages/Layout.jsx`
- **Current behavior:**
  - `isSuperAdmin`: Shows superadmin-only items (Control Room, VIP Invitations, System Analytics)
  - `isAdmin`: Shows admin items (Manage Partners, Review Deliverables, etc.)
  - `isPartner`: Shows partner navigation
  - ✅ **CORRECT** - Logic is sound

#### 6. **Error Banners**
- **Location:** `src/pages/admin/AdminPartners.jsx` (line 103)
- Shows error: "User not found in partner_users table"
- This happens when user exists in auth but not in partner_users

---

## TASK 2 - Implementation Complete ✅

### New Single-Source Implementation

#### 1. **Created `useCurrentUser` Hook**
- **File:** `src/hooks/useCurrentUser.ts`
- **Purpose:** Single-source hook for current user with role
- **Returns:**
  ```typescript
  {
    user: CurrentUser | null,
    isLoading: boolean,
    error: Error | null,
    isAuthenticated: boolean,
    isUnknown: boolean
  }
  ```

#### 2. **Created `fetchCurrentUser` Utility**
- **File:** `src/utils/currentUser.ts`
- **Purpose:** Utility function that can be used in contexts/providers
- **Logic:**
  1. Gets auth user from session
  2. Checks superadmin emails (hayat.malik6@gmail.com, h.malik@sheraa.ae)
  3. Fetches `partner_users` record
  4. Normalizes roles: 'sef_admin' → 'superadmin'
  5. Returns clean `CurrentUser` object

#### 3. **Updated AuthContext**
- **File:** `src/contexts/AuthContext.jsx`
- **Changes:**
  - Now uses `fetchCurrentUser()` utility (single source of truth)
  - Maintains backward compatibility with existing `useAuth()` interface
  - Maps 'unknown' role to `null` for legacy compatibility

#### 4. **Fixed Partner Filtering**
- **File:** `src/services/supabaseService.js`
- **Changes:**
  - ✅ **Superadmin:** Gets ALL partners (no filtering)
  - ✅ **Standard Admin:** Gets ALL partners (S2 model) - **FIXED**
  - ✅ **Partner:** Gets all (subject to RLS)

#### 5. **Sidebar Visibility**
- **File:** `src/pages/Layout.jsx`
- **Status:** ✅ Already correct
- **Behavior:**
  - Superadmins: See all admin items + superadmin-only items
  - Standard admins: See all admin items (no superadmin-only)
  - Partners: See partner navigation only

---

## Key Changes Summary

### ✅ Fixed Issues

1. **Single Source of Truth:** Created `useCurrentUser` hook and `fetchCurrentUser` utility
2. **Partner Filtering:** Standard admins now see ALL partners (S2 model)
3. **Role Detection:** Centralized in `fetchCurrentUser` utility
4. **Backward Compatibility:** AuthContext maintains existing interface

### 📋 Files Created/Modified

**Created:**
- `src/hooks/useCurrentUser.ts` - New hook for current user
- `src/utils/currentUser.ts` - Utility function for fetching current user

**Modified:**
- `src/contexts/AuthContext.jsx` - Uses new `fetchCurrentUser` utility
- `src/services/supabaseService.js` - Fixed partner filtering for admins

### 🔍 Critical Emails Handled

- **Superadmins:**
  - hayat.malik6@gmail.com
  - h.malik@sheraa.ae
- **Standard Admin:**
  - y.yassin@sheraa.ae

### ⚠️ Remaining Work

1. **Update Components:** Some components may still use old `getUserRole()` - can be migrated to `useCurrentUser` hook gradually
2. **Error Handling:** "User not found in partner_users" errors should be handled gracefully (show helpful message)
3. **Testing:** Test with all three user types (superadmin, admin, partner)

---

## Usage Examples

### Using the New Hook

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';

function MyComponent() {
  const { user, isLoading, error } = useCurrentUser();
  
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  if (!user) return <NotAuthenticated />;
  
  if (user.isSuperadmin) {
    // Superadmin UI
  } else if (user.isAdmin) {
    // Admin UI
  } else if (user.isPartner) {
    // Partner UI
  }
}
```

### Using in AuthContext (Already Done)

```typescript
// AuthContext now uses fetchCurrentUser internally
const currentUser = await fetchCurrentUser(authUserId);
setRole(currentUser.role === 'unknown' ? null : currentUser.role);
setPartnerId(currentUser.partnerId);
```

---

## Next Steps (Optional)

1. Gradually migrate components from `useAuth()` to `useCurrentUser()` for cleaner code
2. Add error boundaries for "unknown" users
3. Add helpful error messages when user not found in partner_users
4. Consider deprecating old `getUserRole()` utilities once migration is complete

