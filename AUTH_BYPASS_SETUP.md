# Auth Bypass Setup for Vercel Deployment

## Overview
Temporary auth bypass has been implemented to ensure Vercel deployment stability. All authentication and authorization checks are disabled when `VITE_REACT_APP_DEMO=true` is set.

## Changes Made

### 1. New Config File
- **`src/config/authBypass.ts`** - Exports `AUTH_BYPASS` flag based on `VITE_REACT_APP_DEMO` env var

### 2. Updated Guard Components
All three guard components now check `AUTH_BYPASS` first:

- **`src/components/auth/AuthGuard.jsx`**
  - If `AUTH_BYPASS=true`: Returns children immediately (no redirects)
  - Original code preserved in `if (VITE_REACT_APP_DEMO === "false")` block

- **`src/components/auth/RouteGuard.jsx`**
  - If `AUTH_BYPASS=true`: Allows all routes, logs warning
  - Original redirect logic preserved in env check

- **`src/components/auth/RoleGuard.jsx`**
  - If `AUTH_BYPASS=true`: Allows all roles, logs warning
  - Original role checks preserved in env check

## Vercel Environment Variable Setup

### Step 1: Go to Vercel Dashboard
1. Navigate to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: **sefpartners**

### Step 2: Add Environment Variable
1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add the following:
   - **Name**: `VITE_REACT_APP_DEMO`
   - **Value**: `true`
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

### Step 3: Redeploy
After adding the env var, trigger a new deployment:
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment
- Or push a new commit to trigger automatic deployment

## Expected Behavior

### With `VITE_REACT_APP_DEMO=true`:
✅ All pages load without authentication  
✅ No redirects to `/Login`  
✅ No 401/403 errors  
✅ No "Unauthorized" pages  
✅ Demo mode at `/demo` works immediately  
✅ Console warnings logged (not blocking)  

### With `VITE_REACT_APP_DEMO=false` or unset:
✅ Original auth enforcement active  
✅ Redirects work as before  
✅ Role-based access control enforced  

## Reverting to Normal Auth

To restore normal authentication:
1. In Vercel Dashboard → Settings → Environment Variables
2. Either:
   - Delete `VITE_REACT_APP_DEMO` variable, OR
   - Set `VITE_REACT_APP_DEMO=false`
3. Redeploy

## Testing

After deployment with `VITE_REACT_APP_DEMO=true`:
1. Visit your Vercel URL: `https://sefpartners.vercel.app`
2. Should load without requiring login
3. All routes should be accessible
4. Check browser console for bypass warnings (not errors)

## Important Notes

⚠️ **This is a TEMPORARY measure for deployment stability**  
⚠️ **Original auth code is preserved and can be restored**  
⚠️ **Do not use in production with sensitive data**  
⚠️ **Remove bypass once auth issues are resolved**

