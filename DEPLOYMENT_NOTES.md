# Backend API Deployment Notes

## Supabase Edge Function Deployment

The user creation API is implemented as a Supabase Edge Function. To deploy:

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to your Supabase project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. **Deploy the function**:
   ```bash
   supabase functions deploy admin-create-user
   ```

4. **Set environment variables** in Supabase Dashboard:
   - Go to Project Settings → Edge Functions
   - The function will automatically use:
     - `SUPABASE_URL` (auto-provided)
     - `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

## Alternative: Node.js Backend API

If you prefer a Node.js/Express backend, use the file at:
- `api/admin-create-user.js`

This can be deployed to:
- Vercel (as a serverless function)
- Netlify (as a serverless function)
- Railway/Render (as a Node.js app)
- Your own Express server

### Environment Variables Required:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Email Service Integration

The onboarding email template is ready in `userManagementService.js`. To send actual emails, integrate with:

- **Resend**: https://resend.com
- **SendGrid**: https://sendgrid.com
- **AWS SES**: https://aws.amazon.com/ses/
- **Postmark**: https://postmarkapp.com

Update the `sendOnboardingEmail` function in `userManagementService.js` to use your email service.

## Testing

1. Create a test user via `/admin/users`
2. Check Supabase Dashboard → Authentication → Users to verify auth user was created
3. Check `partner_users` table to verify record was inserted
4. Check `activity_log` table to verify activity was logged
5. Verify the recovery link is generated (check API response)

