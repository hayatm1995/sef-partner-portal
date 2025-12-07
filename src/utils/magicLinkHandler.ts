/**
 * Magic Link Callback Handler
 * 
 * This handles the magic link sign-up flow:
 * 1. User clicks magic link from invite email
 * 2. Supabase redirects to /Login with hash parameters
 * 3. This handler extracts the session and updates app_metadata
 * 4. Redirects user based on their assigned role
 */

import { supabase } from '@/config/supabase';
import { getUserRole } from './auth';

/**
 * Handle magic link callback after user clicks invite link
 * Updates app_metadata with role and partner_id from partner_users table
 * 
 * @returns {Promise<{ role: string | null, partner_id: string | null }>}
 */
export async function handleMagicLinkCallback(): Promise<{ role: string | null; partner_id: string | null }> {
  try {
    // Get the session from URL hash (Supabase magic link flow)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('[handleMagicLinkCallback] No session found:', sessionError);
      return { role: null, partner_id: null };
    }

    const user = session.user;
    console.log('[handleMagicLinkCallback] Processing magic link for user:', user.email);

    // Get role and partner_id from partner_users table
    const roleInfo = await getUserRole(user);
    
    // If app_metadata doesn't have role/partner_id, we need to update it
    // This requires admin API, so we'll call an Edge Function
    const currentAppRole = user.app_metadata?.role;
    const currentAppPartnerId = user.app_metadata?.partner_id;
    
    if (currentAppRole !== roleInfo.role || currentAppPartnerId !== roleInfo.partner_id) {
      console.log('[handleMagicLinkCallback] Metadata mismatch, updating via Edge Function:', {
        current: { role: currentAppRole, partner_id: currentAppPartnerId },
        expected: roleInfo
      });
      
      // Call Edge Function to update app_metadata
      // This ensures JWT contains role and partner_id for RLS policies
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        
        if (accessToken) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/sync-user-metadata`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              role: roleInfo.role,
              partner_id: roleInfo.partner_id,
            }),
          });
          
          if (response.ok) {
            console.log('[handleMagicLinkCallback] Metadata synced successfully');
            // Refresh session to get updated JWT
            await supabase.auth.refreshSession();
          } else {
            console.warn('[handleMagicLinkCallback] Failed to sync metadata, will use database values');
          }
        }
      } catch (error) {
        console.error('[handleMagicLinkCallback] Error syncing metadata:', error);
        // Continue anyway - we'll use database values
      }
    }
    
    // Check if user needs to set password
    // Note: We can't directly check if password is set, but we can check if this is first login
    // For now, we'll let the SetPassword page handle the redirect logic
    
    return roleInfo;
  } catch (error) {
    console.error('[handleMagicLinkCallback] Error:', error);
    return { role: null, partner_id: null };
  }
}

/**
 * Check if user needs to set password
 * This is called after magic link login to determine if redirect to /auth/set-password is needed
 * 
 * @returns {Promise<boolean>} True if user should be redirected to set password
 */
export async function shouldRedirectToSetPassword(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check if user has encrypted_password set (indicates password exists)
    // Note: This is not directly accessible, so we'll use a different approach
    // We can check user metadata or rely on the fact that magic link users typically don't have passwords
    
    // For now, we'll check if this is a new user (created via magic link invite)
    // New users from invites typically don't have passwords set
    const isNewUser = user.created_at && 
      new Date(user.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000; // Created in last 24 hours
    
    // If user was created recently and has no password hint in metadata, redirect to set password
    // This is a heuristic - in production, you might want to track this in a database field
    if (isNewUser && !user.user_metadata?.password_set) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[shouldRedirectToSetPassword] Error:', error);
    return false;
  }
}

/**
 * Check if current URL is a magic link callback
 * Magic links have hash parameters like: #access_token=...&type=magiclink
 */
export function isMagicLinkCallback(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hash = window.location.hash;
  return hash.includes('access_token') && hash.includes('type=magiclink');
}

