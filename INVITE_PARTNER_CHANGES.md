# Invite Partner Feature - Changes Summary

## Files Created

### 1. `src/services/emailService.ts` (NEW)
- Email service using Resend SDK
- Belong+ branded HTML template with purple/pink gradient
- Sends magic link invitations

### 2. `src/pages/admin/InvitePartner.jsx` (NEW)
- Admin-only page for inviting partners
- Form with Partner Name and Email fields
- Creates user via Supabase Admin API
- Sends branded email via Resend

## Files Modified

### 3. `src/pages/index.jsx`
- Added import for `InvitePartner`
- Added route: `/admin/invite-partner`

### 4. `src/pages/Layout.jsx`
- Added `UserPlus` icon import
- Added "Invite Partner" menu item to admin sidebar

### 5. `package.json` (REQUIRED UPDATE)
- Need to add: `"resend": "^3.0.0"` to dependencies

## Environment Variables Required

Add to `.env`:
```
VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
VITE_SITE_URL=https://portal.visitsef.com
# OR
VITE_APP_URL=https://portal.visitsef.com
```

## Installation Steps

1. Install Resend package:
   ```bash
   npm install resend
   ```

2. Add environment variables to `.env`

3. Verify Resend domain is configured in Resend dashboard

## Notes

- The feature uses the existing `createUserViaAPI` function which calls the Supabase Edge Function
- Magic link is generated via recovery link from user creation
- Email uses Belong+ branding (purple/pink gradient)
- Admin-only access enforced via role checks
