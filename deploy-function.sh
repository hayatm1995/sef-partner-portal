#!/bin/bash
# Deploy invite-partner Edge Function to Supabase
# Usage: SUPABASE_ACCESS_TOKEN=your_token_here ./deploy-function.sh

PROJECT_REF="kirjkysvssiyfdjkzmme"

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_ACCESS_TOKEN environment variable is not set"
  echo ""
  echo "To get your access token:"
  echo "1. Go to https://supabase.com/dashboard/account/tokens"
  echo "2. Generate a new access token"
  echo "3. Run: SUPABASE_ACCESS_TOKEN=your_token_here ./deploy-function.sh"
  exit 1
fi

echo "🚀 Deploying invite-partner Edge Function..."
npx supabase functions deploy invite-partner --project-ref $PROJECT_REF

if [ $? -eq 0 ]; then
  echo "✅ Deployment successful!"
  echo ""
  echo "Next steps:"
  echo "1. Set environment variables in Supabase Dashboard → Settings → Edge Functions → Secrets:"
  echo "   - SUPABASE_URL"
  echo "   - SUPABASE_SERVICE_ROLE_KEY"
  echo "   - RESEND_API_KEY"
  echo "   - VITE_SITE_URL (optional)"
  echo ""
  echo "2. Test the function from /admin/invite-partner page"
else
  echo "❌ Deployment failed. Check the error above."
  exit 1
fi

