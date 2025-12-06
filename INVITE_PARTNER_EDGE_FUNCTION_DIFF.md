# Invite Partner Edge Function - Complete Diff

## Files to Create/Modify

### 1. NEW FILE: `supabase/functions/invite-partner/index.ts`
**Complete new Edge Function:**
- Validates admin authentication via JWT
- Creates partner user in Supabase Auth with role="partner", status="invited"
- Generates Supabase magic link
- Sends email via Resend using Belong+ template
- Returns `{ "status": "invited" }`

**Key features:**
- Uses `SUPABASE_SERVICE_ROLE_KEY` from Deno.env (server-side only)
- Uses `RESEND_API_KEY` from Deno.env (server-side only)
- Validates requesting user is admin/superadmin
- Creates user with metadata: `{ role: "partner", status: "invited", name }`
- Generates magic link using `supabaseAdmin.auth.admin.generateLink({ type: "magiclink" })`
- Sends email using Resend with Belong+ HTML template

### 2. MODIFY: `src/services/emailService.ts`
**ADD new export function (after line 184):**
```typescript
/**
 * Send partner magic link invite email (reusable function)
 * Used by Edge Functions and client-side code
 */
export async function sendPartnerMagicInvite(
  name: string,
  email: string,
  magicLinkUrl: string
): Promise<{ success: boolean; error?: string }> {
  return sendMagicLinkInvite({
    email,
    partnerName: name,
    magicLink: magicLinkUrl,
  });
}
```

**Note:** This is a wrapper around existing `sendMagicLinkInvite` for consistency.

### 3. MODIFY: `src/pages/admin/InvitePartner.tsx`
**REPLACE lines 22-81 (entire mutationFn):**

**BEFORE:**
```typescript
const invitePartnerMutation = useMutation({
  mutationFn: async (data) => {
    // ... current implementation using createUserViaAPI
  },
  // ...
});
```

**AFTER:**
```typescript
const invitePartnerMutation = useMutation({
  mutationFn: async (data) => {
    const { name, email } = data;
    
    // Get Supabase URL and session token
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Not authenticated. Please log in again.');
    }
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }
    
    // Call Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/invite-partner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
      },
      body: JSON.stringify({
        email,
        name,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to invite partner');
    }
    
    const result = await response.json();
    
    if (result.status !== 'invited') {
      throw new Error('Unexpected response from server');
    }
    
    return { success: true, message: 'Invitation sent successfully' };
  },
  // ... rest stays the same
});
```

### 4. NO CHANGES NEEDED: `src/services/emailService.ts` (template function)
The existing `generateBelongPlusEmailTemplate` and `sendMagicLinkInvite` functions are already correct and will be used by the Edge Function.

## Edge Function Implementation Details

### Environment Variables (Set in Supabase Dashboard → Edge Functions → Secrets):
- `SUPABASE_URL` (auto-provided by Supabase)
- `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Settings → API)
- `RESEND_API_KEY` (your Resend API key: `re_fkpZE4hS_AxB2uei72wV9aTisnYT55TyZ`)

### Magic Link Generation:
Uses `supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: "..." } })`

### Email Sending:
Edge Function will call Resend API directly (not through client-side emailService) to avoid exposing API keys.

## Summary of Changes

✅ **New:** `supabase/functions/invite-partner/index.ts` (complete Edge Function)
✅ **Modify:** `src/services/emailService.ts` (add wrapper function)
✅ **Modify:** `src/pages/admin/InvitePartner.tsx` (call Edge Function instead of direct API)
✅ **No changes:** Routing, other pages, styling, deliverables code

## Deployment Steps (After Approval)

1. Deploy Edge Function: `supabase functions deploy invite-partner`
2. Set secrets in Supabase Dashboard:
   - `RESEND_API_KEY=re_fkpZE4hS_AxB2uei72wV9aTisnYT55TyZ`
3. Restart dev server

