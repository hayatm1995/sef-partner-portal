# Deploy invite-partner Edge Function

## Option 1: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   You can find your project ref in the Supabase Dashboard → Settings → General → Reference ID

4. **Deploy the function**:
   ```bash
   supabase functions deploy invite-partner
   ```

## Option 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Edge Functions** in the left sidebar
3. Click **Create a new function** or select **invite-partner** if it exists
4. Copy the contents of `supabase/functions/invite-partner/index.ts`
5. Paste into the function editor
6. Click **Deploy**

## Option 3: Using npx (No Installation Required)

```bash
npx supabase functions deploy invite-partner --project-ref YOUR_PROJECT_REF
```

You'll be prompted to login if not already authenticated.

## Required Environment Variables

Make sure these are set in your Supabase project:

1. Go to **Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key (found in Settings → API)
   - `RESEND_API_KEY` - Your Resend API key
   - `VITE_SITE_URL` (optional) - Defaults to `https://sefpartners.vercel.app`
   - `SUPABASE_SITE_URL` (optional) - Alternative to VITE_SITE_URL

## Verify Deployment

After deployment, test the function:

1. Go to **Edge Functions** → **invite-partner**
2. Click **Invoke** tab
3. Use the test interface or call from your frontend

## Testing

Test from the Admin → Invite Partner page:
1. Login as admin or superadmin
2. Navigate to `/admin/invite-partner`
3. Enter partner name and email
4. Click "Send Invite"
5. Check that the partner receives the email with magic link

