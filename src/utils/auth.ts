import { supabase } from '@/config/supabase';
import { SUPERADMIN } from '@/constants/users';

/**
 * Get user role from multiple sources in priority order:
 * 1. SUPERADMIN constant (hardcoded override)
 * 2. app_metadata.role (set by admin functions - most secure)
 * 3. user_metadata.role (fallback)
 * 4. partner_users table (database source of truth)
 * 
 * Returns 'superadmin' or 'partner' - no fallback to email checks
 * 
 * @param {Object} user - Supabase auth user object
 * @returns {Promise<'superadmin' | 'partner' | null>} - Resolved role
 */
export async function getUserRole(user: any): Promise<'superadmin' | 'partner' | null> {
  if (!user) {
    return null;
  }

  // 1. Check for Superadmin Override (Hardcoded)
  if (
    user.id === SUPERADMIN.uid ||
    user.email?.toLowerCase() === SUPERADMIN.email.toLowerCase()
  ) {
    console.log('[getUserRole] Superadmin override');
    return 'superadmin';
  }

  // 2. Check app_metadata (secure, set by admin functions)
  const appRole = user.app_metadata?.role;
  if (appRole && ['superadmin', 'sef_admin', 'admin'].includes(appRole)) {
    console.log('[getUserRole] Role from app_metadata:', appRole);
    return 'superadmin';
  }
  if (appRole === 'partner') {
    console.log('[getUserRole] Role from app_metadata: partner');
    return 'partner';
  }

  // 3. Check user_metadata (fallback)
  const userRole = user.user_metadata?.role;
  if (userRole && ['superadmin', 'sef_admin', 'admin'].includes(userRole)) {
    console.log('[getUserRole] Role from user_metadata:', userRole);
    return 'superadmin';
  }
  if (userRole === 'partner') {
    console.log('[getUserRole] Role from user_metadata: partner');
    return 'partner';
  }

  // 4. Query partner_users table (database source of truth)
  try {
    const { data: partnerUser, error } = await supabase
      .from('partner_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (!error && partnerUser?.role) {
      const dbRole = partnerUser.role;
      console.log('[getUserRole] Role from partner_users table:', dbRole);
      
      // Normalize database roles to our role system
      if (['sef_admin', 'admin', 'superadmin'].includes(dbRole)) {
        return 'superadmin';
      }
      // If role is 'partner' or any other value, return 'partner'
      return 'partner';
    }
  } catch (error) {
    console.warn('[getUserRole] Error querying partner_users:', error);
  }

  // 5. Default to partner (no email-domain fallback)
  console.log('[getUserRole] Defaulting to partner role');
  return 'partner';
}

/**
 * Get current user's role from active session
 * Fetches fresh user data from Supabase auth
 * 
 * @returns {Promise<'superadmin' | 'partner' | null>}
 */
export async function getCurrentUserRole(): Promise<'superadmin' | 'partner' | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return null;
    }
    return await getUserRole(user);
  } catch (error) {
    console.error('[getCurrentUserRole] Error:', error);
    return null;
  }
}

/**
 * Synchronous version that uses cached role or returns default
 * Use this when you need a role immediately without async
 * 
 * @param {Object} user - Supabase auth user object
 * @param {string} cachedRole - Previously resolved role
 * @returns {'superadmin' | 'partner' | null}
 */
export function getUserRoleSync(
  user: any, 
  cachedRole: string | null = null
): 'superadmin' | 'partner' | null {
  if (!user) return null;
  if (cachedRole === 'superadmin' || cachedRole === 'partner') {
    return cachedRole;
  }

  // Quick checks without database query
  if (
    user.id === SUPERADMIN.uid ||
    user.email?.toLowerCase() === SUPERADMIN.email.toLowerCase()
  ) {
    return 'superadmin';
  }

  const appRole = user.app_metadata?.role;
  if (appRole && ['superadmin', 'sef_admin', 'admin'].includes(appRole)) {
    return 'superadmin';
  }
  if (appRole === 'partner') {
    return 'partner';
  }

  const userRole = user.user_metadata?.role;
  if (userRole && ['superadmin', 'sef_admin', 'admin'].includes(userRole)) {
    return 'superadmin';
  }
  if (userRole === 'partner') {
    return 'partner';
  }

  // Default to partner if no metadata found (no email fallback)
  return 'partner';
}

