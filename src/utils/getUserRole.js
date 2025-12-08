// 🚫 DEPRECATED — Do not use for role logic.
// Use fetchCurrentUser() + useAppRole() instead.

import { supabase } from '@/config/supabase';
import { SUPERADMIN } from '@/constants/users';

/**
 * Get user role from multiple sources:
 * 1. SUPERADMIN constant (hardcoded override)
 * 2. app_metadata.role (set by admin functions)
 * 3. user_metadata.role (fallback)
 * 4. partner_users table (database source of truth)
 * 
 * @param {Object} user - Supabase auth user object
 * @returns {Promise<string>} - Role: 'superadmin', 'admin', or 'partner'
 */
export async function getUserRole(user) {
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
  if (appRole && ['superadmin', 'sef_admin', 'admin', 'partner'].includes(appRole)) {
    console.log('[getUserRole] Role from app_metadata:', appRole);
    // Normalize sef_admin to superadmin
    return appRole === 'sef_admin' ? 'superadmin' : appRole;
  }

  // 3. Check user_metadata (fallback)
  const userRole = user.user_metadata?.role;
  if (userRole && ['superadmin', 'sef_admin', 'admin', 'partner'].includes(userRole)) {
    console.log('[getUserRole] Role from user_metadata:', userRole);
    return userRole === 'sef_admin' ? 'superadmin' : userRole;
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
      if (dbRole === 'sef_admin') {
        return 'superadmin';
      }
      if (['admin', 'superadmin'].includes(dbRole)) {
        return dbRole;
      }
      // If role is 'partner' or any other value, return 'partner'
      return 'partner';
    }
  } catch (error) {
    console.warn('[getUserRole] Error querying partner_users:', error);
  }

  // 5. Default to partner
  console.log('[getUserRole] Defaulting to partner role');
  return 'partner';
}

/**
 * Synchronous version that uses cached role or returns default
 * Use this when you need a role immediately without async
 */
export function getUserRoleSync(user, cachedRole = null) {
  if (!user) return null;
  if (cachedRole) return cachedRole;

  // Quick checks without database query
  if (
    user.id === SUPERADMIN.uid ||
    user.email?.toLowerCase() === SUPERADMIN.email.toLowerCase()
  ) {
    return 'superadmin';
  }

  const appRole = user.app_metadata?.role;
  if (appRole && ['superadmin', 'sef_admin', 'admin', 'partner'].includes(appRole)) {
    return appRole === 'sef_admin' ? 'superadmin' : appRole;
  }

  const userRole = user.user_metadata?.role;
  if (userRole && ['superadmin', 'sef_admin', 'admin', 'partner'].includes(userRole)) {
    return userRole === 'sef_admin' ? 'superadmin' : userRole;
  }

  // Default to partner if no metadata found
  return 'partner';
}

