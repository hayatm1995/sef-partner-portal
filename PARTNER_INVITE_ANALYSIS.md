# Partner Creation + Invite Flow - Analysis

## TASK 1 - Analysis Complete ✅

### Existing Implementation Found:

1. **Edge Function**: `supabase/functions/invite-partner/index.ts`
   - ✅ Already exists and is comprehensive
   - ✅ Validates admin access
   - ✅ Creates auth user if needed
   - ✅ Creates partner record
   - ✅ Creates partner_users with `role='partner'`
   - ✅ Generates magic link
   - ✅ Sends email via Resend
   - ✅ Handles existing users/partners gracefully

2. **Frontend Pages**:
   - ✅ `src/pages/admin/InvitePartner.tsx` - Basic invite page (uses Edge Function)
   - ❌ `/admin/partners/new` route referenced but doesn't exist
   - ⚠️ `CreatePartnerDialog.jsx` - Uses base44 (external service, needs replacement)

3. **Current Flow**:
   - InvitePartner page calls Edge Function with `name` and `email`
   - Edge Function handles everything server-side
   - Returns success/error

### Issues Found:

1. **Missing Route**: `/admin/partners/new` is referenced but doesn't exist
2. **Limited Form**: InvitePartner page only has name + email + tier (optional)
3. **No Partner-Only Creation**: Can't create partner without inviting user
4. **Missing Fields**: No website, category, contact name separate from email

### What Works:

- ✅ Edge Function is solid and handles all edge cases
- ✅ Email sending via Resend is configured
- ✅ Role assignment (`role='partner'`) is correct
- ✅ Partner-user linking is correct

## Next Steps:

1. Create comprehensive "Add Partner" page at `/admin/partners/new`
2. Support both flows:
   - Create partner only (no email)
   - Create partner + invite user (with email)
3. Add all partner fields (name, tier, website, etc.)
4. Add route to index.jsx
5. Test end-to-end flow

