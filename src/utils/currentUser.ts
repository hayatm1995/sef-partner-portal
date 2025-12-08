import { supabase } from '@/config/supabase';
import type { CurrentUser } from '@/hooks/useCurrentUser';

/**
 * Fetch current user with role from database
 * This is the single source of truth for user role detection
 * 
 * @param authUserId - Auth user ID from Supabase session
 * @returns Promise<CurrentUser | null>
 */
export async function fetchCurrentUser(authUserId: string | null): Promise<CurrentUser | null> {
  if (!authUserId) return null;

  try {
    // Get auth user - with error handling
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.warn('[fetchCurrentUser] Error getting auth user:', authError);
      return null;
    }
    
    if (!authUser || authUser.id !== authUserId) {
      console.warn('[fetchCurrentUser] Auth user mismatch or not found');
      return null;
    }

    const email = authUser.email || '';
    
    // Check for superadmin emails (hardcoded)
    const superadminEmails = [
      'hayat.malik6@gmail.com',
      'h.malik@sheraa.ae'
    ];
    
    const isSuperadminEmail = superadminEmails.some(e => email.toLowerCase() === e.toLowerCase());
    
    // Fetch partner_users record
    const { data: partnerUser, error: partnerUserError } = await supabase
      .from('partner_users')
      .select('id, role, partner_id, full_name, email, is_disabled')
      .eq('auth_user_id', authUserId)
      .single();

    // PGRST116 = not found - this is OK for users not in partner_users
    if (partnerUserError && partnerUserError.code !== 'PGRST116') {
      console.error('[fetchCurrentUser] Error fetching partner_users:', partnerUserError);
      // Continue with role detection even if query fails
    }

    // Determine role
    let role: 'superadmin' | 'admin' | 'partner' | 'unknown' = 'unknown';
    
    // Superadmin emails always get superadmin role, even if not in partner_users
    if (isSuperadminEmail) {
      role = 'superadmin';
    } else if (partnerUser?.role) {
      // Normalize database roles
      if (partnerUser.role === 'superadmin' || partnerUser.role === 'sef_admin') {
        role = 'superadmin';
      } else if (partnerUser.role === 'admin') {
        role = 'admin';
      } else {
        role = 'partner';
      }
    } else {
      // User exists in auth but not in partner_users
      // If superadmin email, they should still be superadmin
      // Otherwise, mark as unknown
      role = isSuperadminEmail ? 'superadmin' : 'unknown';
    }

    const isSuperadmin = role === 'superadmin';
    const isAdmin = role === 'admin' || isSuperadmin;
    const isPartner = role === 'partner';

    return {
      authUserId: authUser.id,
      email,
      fullName: partnerUser?.full_name || authUser.user_metadata?.full_name || email.split('@')[0],
      role,
      isSuperadmin,
      isAdmin,
      isPartner,
      partnerId: partnerUser?.partner_id || null,
      partnerUserId: partnerUser?.id || null,
      isDisabled: partnerUser?.is_disabled || false,
    };
  } catch (error) {
    console.error('[fetchCurrentUser] Error:', error);
    return null;
  }
}

