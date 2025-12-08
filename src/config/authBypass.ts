/**
 * Auth Bypass Configuration
 * 
 * Set VITE_REACT_APP_DEMO=true in .env (or Vercel env vars) to temporarily disable auth
 * This allows all pages to load without authentication requirements
 * 
 * IMPORTANT: This is for temporary deployment stability only
 */
export const AUTH_BYPASS = import.meta.env.VITE_REACT_APP_DEMO === "true";

