# Deployment Guide - SEF Partners Portal

## Prerequisites

- Node.js 18+ and npm
- Vercel account (or your preferred hosting platform)
- Supabase project
- Resend API key (for email)
- OpenAI API key (for AI features)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Resend (Email)
VITE_RESEND_API_KEY=your_resend_api_key

# OpenAI (AI Features)
VITE_OPENAI_API_KEY=your_openai_api_key

# Site URL (for email links)
VITE_SITE_URL=https://sefpartners.sheraa.ae

# Optional: Analytics
VITE_VERCEL_ANALYTICS_ID=your_analytics_id
```

## Vercel Deployment

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing this project

### Step 2: Configure Build Settings

- **Framework Preset**: Vite
- **Root Directory**: `./` (or leave default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add all variables from `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RESEND_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_SITE_URL`
- `VITE_VERCEL_ANALYTICS_ID` (optional)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Your app will be available at `your-project.vercel.app`

## Custom Domain Setup

### For sefpartners.sheraa.ae:

1. In Vercel project settings → Domains
2. Add `sefpartners.sheraa.ae`
3. Follow DNS configuration instructions:
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or add A record with Vercel's IP addresses
4. SSL certificate will be automatically provisioned by Vercel

## Supabase Setup

### Database Migrations

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order:
   - `001_initial_schema.sql`
   - `002_add_partner_management_fields.sql`
   - `003_add_partner_submissions.sql`
   - `004_deliverable_workflow_upgrade.sql`
   - `005_create_user_partner_context_view.sql`
   - `005_partner_messages.sql`
   - `006_partner_invitations.sql`
   - `007_notifications_metadata.sql`
   - `008_contracts_workflow.sql`
   - `009_exhibitor_stand_workflow.sql`

### Storage Buckets

Create the following storage buckets in Supabase:

1. **deliverables** - Public bucket for partner submissions
   - Policies: Partners can upload, admins can view all

2. **booth-artwork** - Public bucket for booth artwork
   - Policies: Partners can upload, admins can view all

### Row Level Security (RLS)

All tables have RLS enabled. Ensure policies are correctly set:
- Partners can only access their own data
- Admins can access all data
- Superadmins have full access

## Post-Deployment Checklist

### Functionality Tests

- [ ] User authentication (login/logout)
- [ ] Partner dashboard loads correctly
- [ ] Admin panel accessible to admins only
- [ ] Partner assignment to booths works
- [ ] Build option selection works
- [ ] File uploads for deliverables work
- [ ] Submission review workflow (approve/reject/request changes)
- [ ] Real-time messaging between admin and partners
- [ ] Notifications appear correctly
- [ ] AI helper features work (if enabled)
- [ ] Control room accessible to superadmins only
- [ ] CSV export works
- [ ] VIP guest list management works

### Security Checks

- [ ] RLS policies prevent unauthorized access
- [ ] Admin routes are protected
- [ ] API keys are not exposed in client code
- [ ] File uploads validate file types and sizes
- [ ] Rate limiting on API endpoints (if applicable)

### Performance

- [ ] Page load times < 3 seconds
- [ ] Images optimized
- [ ] Database queries optimized
- [ ] Real-time subscriptions don't cause memory leaks

## Monitoring & Analytics

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Add `@vercel/analytics` package if needed
3. Import and use in `main.jsx`:

```jsx
import { Analytics } from '@vercel/analytics/react';

// In your app component
<Analytics />
```

### Error Logging

Consider adding Sentry for error tracking:

1. Install: `npm install @sentry/react`
2. Configure in `main.jsx`:

```jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE,
});
```

## Troubleshooting

### Build Failures

- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check for TypeScript/ESLint errors

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check RLS policies aren't blocking queries
- Ensure migrations have been run

### Email Not Sending

- Verify Resend API key is correct
- Check Resend dashboard for rate limits
- Verify sender email is verified in Resend

### Real-time Features Not Working

- Check Supabase Realtime is enabled
- Verify channel subscriptions are set up correctly
- Check browser console for WebSocket errors

## Rollback Procedure

If deployment fails:

1. Go to Vercel Dashboard → Deployments
2. Find last successful deployment
3. Click "..." → "Promote to Production"

## Support

For issues or questions:
- Check Supabase logs: Dashboard → Logs
- Check Vercel logs: Dashboard → Deployments → View Logs
- Review browser console for client-side errors

