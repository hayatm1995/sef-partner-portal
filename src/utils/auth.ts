import { supabase } from '@/config/supabase';
import { SUPERADMIN } from '@/constants/users';

/**
 * User role and partner information
 */
export interface UserRoleInfo {
  role: 'superadmin' | 'admin' | 'partner' | null;
  partner_id: string | null;
}

/**
 * Get user role and partner_id from multiple sources in priority order:
 * 1. SUPERADMIN constant (hardcoded override)
 * 2. app_metadata.role and app_metadata.partner_id (set by admin functions - most secure)
 * 3. user_metadata.role and user_metadata.partner_id (fallback)
 * 4. partner_users table (database source of truth)
 * 
 * Returns role and partner_id - no fallback to email checks
 * 
 * @param {Object} user - Supabase auth user object
 * @returns {Promise<UserRoleInfo>} - Resolved role and partner_id
 */
export async function getUserRole(user: any): Promise<UserRoleInfo> {
  if (!user) {
    return { role: null, partner_id: null };
  }

  // 1. Check for Superadmin Override (Hardcoded)
  if (
    user.id === SUPERADMIN.uid ||
    user.email?.toLowerCase() === SUPERADMIN.email.toLowerCase()
  ) {
    console.log('[getUserRole] Superadmin override');
    return { role: 'superadmin', partner_id: null };
  }

  // 2. Check app_metadata (secure, set by admin functions) - PRIORITY SOURCE
  const appRole = user.app_metadata?.role;
  const appPartnerId = user.app_metadata?.partner_id;
  
  if (appRole && ['superadmin', 'sef_admin', 'admin'].includes(appRole)) {
    console.log('[getUserRole] Role from app_metadata:', appRole, 'partner_id:', appPartnerId);
    return { 
      role: appRole === 'sef_admin' ? 'superadmin' : (appRole === 'admin' ? 'admin' : 'superadmin'),
      partner_id: appPartnerId || null 
    };
  }
  if (appRole === 'partner') {
    console.log('[getUserRole] Role from app_metadata: partner, partner_id:', appPartnerId);
    return { role: 'partner', partner_id: appPartnerId || null };
  }

  // 3. Check user_metadata (fallback)
  const userRole = user.user_metadata?.role;
  const userPartnerId = user.user_metadata?.partner_id;
  
  if (userRole && ['superadmin', 'sef_admin', 'admin'].includes(userRole)) {
    console.log('[getUserRole] Role from user_metadata:', userRole, 'partner_id:', userPartnerId);
    return { 
      role: userRole === 'sef_admin' ? 'superadmin' : (userRole === 'admin' ? 'admin' : 'superadmin'),
      partner_id: userPartnerId || null 
    };
  }
  if (userRole === 'partner') {
    console.log('[getUserRole] Role from user_metadata: partner, partner_id:', userPartnerId);
    return { role: 'partner', partner_id: userPartnerId || null };
  }

  // 4. Query partner_users table (database source of truth)
  try {
    const { data: partnerUser, error } = await supabase
      .from('partner_users')
      .select('role, partner_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!error && partnerUser) {
      const dbRole = partnerUser.role;
      const dbPartnerId = partnerUser.partner_id;
      console.log('[getUserRole] Role from partner_users table:', dbRole, 'partner_id:', dbPartnerId);
      
      // Normalize database roles to our role system
      if (['sef_admin', 'admin', 'superadmin'].includes(dbRole)) {
        return { 
          role: dbRole === 'sef_admin' ? 'superadmin' : (dbRole === 'admin' ? 'admin' : 'superadmin'),
          partner_id: dbPartnerId || null 
        };
      }
      // If role is 'partner' or any other value, return 'partner'
      return { role: 'partner', partner_id: dbPartnerId || null };
    }
  } catch (error) {
    console.warn('[getUserRole] Error querying partner_users:', error);
  }

  // 5. Default to partner (no email-domain fallback)
  console.log('[getUserRole] Defaulting to partner role');
  return { role: 'partner', partner_id: null };
}

/**
 * Get current user's role and partner_id from active session
 * Fetches fresh user data from Supabase auth
 * 
 * @returns {Promise<UserRoleInfo>}
 */
export async function getCurrentUserRole(): Promise<UserRoleInfo> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return { role: null, partner_id: null };
    }
    return await getUserRole(user);
  } catch (error) {
    console.error('[getCurrentUserRole] Error:', error);
    return { role: null, partner_id: null };
  }
}

/**
 * Synchronous version that uses cached role/partner_id or returns default
 * Use this when you need role/partner_id immediately without async
 * 
 * @param {Object} user - Supabase auth user object
 * @param {string} cachedRole - Previously resolved role
 * @param {string} cachedPartnerId - Previously resolved partner_id
 * @returns {UserRoleInfo}
 */
export function getUserRoleSync(
  user: any, 
  cachedRole: string | null = null,
  cachedPartnerId: string | null = null
): UserRoleInfo {
  if (!user) return { role: null, partner_id: null };
  
  // Use cached values if available
  if (cachedRole && ['superadmin', 'admin', 'partner'].includes(cachedRole)) {
    return { role: cachedRole as 'superadmin' | 'admin' | 'partner', partner_id: cachedPartnerId || null };
  }

  // Quick checks without database query
  if (
    user.id === SUPERADMIN.uid ||
    user.email?.toLowerCase() === SUPERADMIN.email.toLowerCase()
  ) {
    return { role: 'superadmin', partner_id: null };
  }

  const appRole = user.app_metadata?.role;
  const appPartnerId = user.app_metadata?.partner_id;
  
  if (appRole && ['superadmin', 'sef_admin', 'admin'].includes(appRole)) {
    return { 
      role: appRole === 'sef_admin' ? 'superadmin' : (appRole === 'admin' ? 'admin' : 'superadmin'),
      partner_id: appPartnerId || null 
    };
  }
  if (appRole === 'partner') {
    return { role: 'partner', partner_id: appPartnerId || null };
  }

  const userRole = user.user_metadata?.role;
  const userPartnerId = user.user_metadata?.partner_id;
  
  if (userRole && ['superadmin', 'sef_admin', 'admin'].includes(userRole)) {
    return { 
      role: userRole === 'sef_admin' ? 'superadmin' : (userRole === 'admin' ? 'admin' : 'superadmin'),
      partner_id: userPartnerId || null 
    };
  }
  if (userRole === 'partner') {
    return { role: 'partner', partner_id: userPartnerId || null };
  }

  // Default to partner if no metadata found (no email fallback)
  return { role: 'partner', partner_id: null };
}

/**
 * Update user's app_metadata with role and partner_id
 * This ensures the JWT contains these values for RLS policies
 * 
 * @param {string} userId - Auth user ID
 * @param {string} role - User role
 * @param {string} partnerId - Partner ID (optional)
 * @returns {Promise<boolean>} - Success status
 */
export async function updateUserMetadata(userId: string, role: string, partnerId: string | null = null): Promise<boolean> {
  try {
    // This requires admin API - should be done via Edge Function or backend
    // For now, we'll use a Supabase Edge Function or backend API
    console.log('[updateUserMetadata] Would update user metadata:', { userId, role, partnerId });
    
    // Note: Client-side cannot update app_metadata directly
    // This should be called from an Edge Function or backend API
    // The invite-partner Edge Function should handle this
    
    return true;
  } catch (error) {
    console.error('[updateUserMetadata] Error:', error);
    return false;
  }
}

