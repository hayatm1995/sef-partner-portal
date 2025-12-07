/**
 * Centralized Role Management Helper
 * 
 * Provides role resolution with memoization to prevent UI flicker.
 * Role is cached per user session to avoid repeated database queries.
 */

import { supabase } from '@/config/supabase';
import { SUPERADMIN } from '@/constants/users';

/**
 * User role and partner information
 */
export interface UserRoleInfo {
  role: 'superadmin' | 'admin' | 'partner' | null;
  partner_id: string | null;
}

// In-memory cache for role resolution (prevents UI flicker)
const roleCache = new Map<string, { roleInfo: UserRoleInfo; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear role cache for a specific user
 */
export function clearRoleCache(userId: string | null) {
  if (userId) {
    roleCache.delete(userId);
    console.log('[role] Cache cleared for user:', userId);
  }
}

/**
 * Clear all role cache
 */
export function clearAllRoleCache() {
  roleCache.clear();
  console.log('[role] All role cache cleared');
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
    console.log('[getUserRole] No user provided');
    return { role: null, partner_id: null };
  }

  // Check cache first (prevents UI flicker)
  const cached = roleCache.get(user.id);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[getUserRole] Using cached role:', cached.roleInfo.role, 'for user:', user.id);
    return cached.roleInfo;
  }

  console.log('[getUserRole] Resolving role for user:', user.id, user.email);

  // 1. Check for Superadmin Override (Hardcoded)
  // Check both UID and email for multiple superadmins
  const superadminEmails = [
    'hayat.malik6@gmail.com',
    'h.malik@sheraa.ae'
  ];
  
  if (
    user.id === SUPERADMIN.uid ||
    superadminEmails.some(email => user.email?.toLowerCase() === email.toLowerCase())
  ) {
    console.log('[getUserRole] Superadmin override detected');
    const roleInfo = { role: 'superadmin' as const, partner_id: null };
    roleCache.set(user.id, { roleInfo, timestamp: Date.now() });
    return roleInfo;
  }

  // 2. Check app_metadata (secure, set by admin functions) - PRIORITY SOURCE
  const appRole = user.app_metadata?.role;
  const appPartnerId = user.app_metadata?.partner_id;
  
  if (appRole && ['superadmin', 'sef_admin', 'admin'].includes(appRole)) {
    console.log('[getUserRole] Role from app_metadata:', appRole, 'partner_id:', appPartnerId);
    const roleInfo = { 
      role: appRole === 'sef_admin' ? 'superadmin' : (appRole === 'admin' ? 'admin' : 'superadmin'),
      partner_id: appPartnerId || null 
    };
    roleCache.set(user.id, { roleInfo, timestamp: Date.now() });
    return roleInfo;
  }
  if (appRole === 'partner') {
    console.log('[getUserRole] Role from app_metadata: partner, partner_id:', appPartnerId);
    const roleInfo = { role: 'partner' as const, partner_id: appPartnerId || null };
    roleCache.set(user.id, { roleInfo, timestamp: Date.now() });
    return roleInfo;
  }

  // 3. Check user_metadata (fallback)
  const userRole = user.user_metadata?.role;
  const userPartnerId = user.user_metadata?.partner_id;
  
  if (userRole && ['superadmin', 'sef_admin', 'admin'].includes(userRole)) {
    console.log('[getUserRole] Role from user_metadata:', userRole, 'partner_id:', userPartnerId);
    const roleInfo = { 
      role: userRole === 'sef_admin' ? 'superadmin' : (userRole === 'admin' ? 'admin' : 'superadmin'),
      partner_id: userPartnerId || null 
    };
    roleCache.set(user.id, { roleInfo, timestamp: Date.now() });
    return roleInfo;
  }
  if (userRole === 'partner') {
    console.log('[getUserRole] Role from user_metadata: partner, partner_id:', userPartnerId);
    const roleInfo = { role: 'partner' as const, partner_id: userPartnerId || null };
    roleCache.set(user.id, { roleInfo, timestamp: Date.now() });
    return roleInfo;
  }

  // 4. Query partner_users table (database source of truth)
  try {
    console.log('[getUserRole] Querying partner_users table for user:', user.id);
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
      let roleInfo: UserRoleInfo;
      if (['sef_admin', 'admin', 'superadmin'].includes(dbRole)) {
        roleInfo = { 
          role: dbRole === 'sef_admin' ? 'superadmin' : (dbRole === 'admin' ? 'admin' : 'superadmin'),
          partner_id: dbPartnerId || null 
        };
      } else {
        // If role is 'partner' or any other value, return 'partner'
        roleInfo = { role: 'partner' as const, partner_id: dbPartnerId || null };
      }
      
      roleCache.set(user.id, { roleInfo, timestamp: Date.now() });
      return roleInfo;
    }
  } catch (error) {
    console.warn('[getUserRole] Error querying partner_users:', error);
  }

  // 5. Default to partner (no email-domain fallback)
  console.log('[getUserRole] Defaulting to partner role');
  const roleInfo = { role: 'partner' as const, partner_id: null };
  roleCache.set(user.id, { roleInfo, timestamp: Date.now() });
  return roleInfo;
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
      console.log('[getCurrentUserRole] No user found or error:', error);
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
  if (!user) {
    console.log('[getUserRoleSync] No user provided');
    return { role: null, partner_id: null };
  }
  
  // Use cached values if available
  if (cachedRole && ['superadmin', 'admin', 'partner'].includes(cachedRole)) {
    console.log('[getUserRoleSync] Using provided cached role:', cachedRole);
    return { role: cachedRole as 'superadmin' | 'admin' | 'partner', partner_id: cachedPartnerId || null };
  }

  // Check in-memory cache
  const cached = roleCache.get(user.id);
  if (cached) {
    console.log('[getUserRoleSync] Using in-memory cached role:', cached.roleInfo.role);
    return cached.roleInfo;
  }

  // Quick checks without database query
  const superadminEmails = [
    'hayat.malik6@gmail.com',
    'h.malik@sheraa.ae'
  ];
  
  if (
    user.id === SUPERADMIN.uid ||
    superadminEmails.some(email => user.email?.toLowerCase() === email.toLowerCase())
  ) {
    console.log('[getUserRoleSync] Superadmin override');
    return { role: 'superadmin', partner_id: null };
  }

  const appRole = user.app_metadata?.role;
  const appPartnerId = user.app_metadata?.partner_id;
  
  if (appRole && ['superadmin', 'sef_admin', 'admin'].includes(appRole)) {
    console.log('[getUserRoleSync] Role from app_metadata:', appRole);
    return { 
      role: appRole === 'sef_admin' ? 'superadmin' : (appRole === 'admin' ? 'admin' : 'superadmin'),
      partner_id: appPartnerId || null 
    };
  }
  if (appRole === 'partner') {
    console.log('[getUserRoleSync] Role from app_metadata: partner');
    return { role: 'partner', partner_id: appPartnerId || null };
  }

  const userRole = user.user_metadata?.role;
  const userPartnerId = user.user_metadata?.partner_id;
  
  if (userRole && ['superadmin', 'sef_admin', 'admin'].includes(userRole)) {
    console.log('[getUserRoleSync] Role from user_metadata:', userRole);
    return { 
      role: userRole === 'sef_admin' ? 'superadmin' : (userRole === 'admin' ? 'admin' : 'superadmin'),
      partner_id: userPartnerId || null 
    };
  }
  if (userRole === 'partner') {
    console.log('[getUserRoleSync] Role from user_metadata: partner');
    return { role: 'partner', partner_id: userPartnerId || null };
  }

  // Default to partner if no metadata found (no email fallback)
  console.log('[getUserRoleSync] Defaulting to partner role');
  return { role: 'partner', partner_id: null };
}

/**
 * Memoize role for a user to prevent UI flicker
 * This is called after role is resolved to cache it
 * 
 * @param {string} userId - User ID
 * @param {UserRoleInfo} roleInfo - Resolved role info
 */
export function memoizeRole(userId: string, roleInfo: UserRoleInfo) {
  roleCache.set(userId, { roleInfo, timestamp: Date.now() });
  console.log('[memoizeRole] Cached role for user:', userId, roleInfo.role);
}

