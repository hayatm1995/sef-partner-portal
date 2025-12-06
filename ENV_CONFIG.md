# Environment Configuration Guide

## Changing Domains and API URLs

This project supports environment variables to configure different domains for development, staging, and production.

## Setup

1. **Create a `.env` file** in the root directory (copy from example below)

2. **Configure your domains:**

```bash
# Supabase Configuration (Required for Authentication)
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Application URL (used for email links, etc.)
# Development: http://localhost:5173
# Production: https://yourdomain.com
VITE_APP_URL=http://localhost:5173

# Base44 App ID
VITE_BASE44_APP_ID=68f50edf823231efaa8f1c55
```

## Environment Variables

### `VITE_SUPABASE_URL` ⚠️ **REQUIRED**
- **Purpose:** Your Supabase project URL
- **Where to find:** Supabase Dashboard → Settings → API → Project URL
- **Example:** `https://your-project.supabase.co`
- **Required:** Yes (for authentication)

### `VITE_SUPABASE_ANON_KEY` ⚠️ **REQUIRED**
- **Purpose:** Your Supabase anonymous/public key
- **Where to find:** Supabase Dashboard → Settings → API → anon/public key
- **Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Required:** Yes (for authentication)

### `VITE_APP_URL`
- **Purpose:** Your application's public URL
- **Default:** Current window origin
- **Development:** `http://localhost:5173`
- **Production:** `https://partners.sharjahef.com` or your custom domain
- **Used for:** Email links, redirects, sharing URLs

### `VITE_BASE44_APP_ID`
- **Purpose:** Your Base44 application ID
- **Default:** `68f50edf823231efaa8f1c55`
- **When to change:** If you're using a different Base44 app

## Examples

### Development
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173
VITE_BASE44_APP_ID=68f50edf823231efaa8f1c55
```

### Production
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://partners.sharjahef.com
VITE_BASE44_APP_ID=68f50edf823231efaa8f1c55
```

## Important Notes

1. **Restart Required:** After changing `.env` file, restart the dev server (`npm run dev`)

2. **Build Time:** Environment variables are embedded at build time, not runtime

3. **Security:** Never commit `.env` file to git (already in `.gitignore`)

4. **Vite Prefix:** All environment variables must start with `VITE_` to be accessible in the browser

## Changing the Dev Server Port

To change the local development server port, edit `vite.config.js`:

```js
export default defineConfig({
  server: {
    port: 3000, // Change to your desired port
    host: '0.0.0.0' // Allow access from network
  }
})
```

## Testing

After setting up your `.env` file, check the browser console in development mode - it will log the current configuration.

