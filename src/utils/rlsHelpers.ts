/**
 * Row Level Security (RLS) Helpers
 * 
 * These helpers ensure that partner users can only access their own data,
 * while admins/superadmins can access all data.
 * 
 * The filtering is done client-side as a safety measure, but the primary
 * security should come from Supabase RLS policies on the database.
 */

import { supabase } from '@/config/supabase';

/**
 * Get the current user's partner_id from JWT
 * This comes from app_metadata.partner_id set during login/invite
 * 
 * @returns {Promise<string | null>}
 */
export async function getCurrentUserPartnerId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Get partner_id from app_metadata (most reliable, set by admin functions)
    const partnerId = user.app_metadata?.partner_id || user.user_metadata?.partner_id;
    return partnerId || null;
  } catch (error) {
    console.error('[getCurrentUserPartnerId] Error:', error);
    return null;
  }
}

/**
 * Get the current user's role from JWT
 * 
 * @returns {Promise<'superadmin' | 'admin' | 'partner' | null>}
 */
export async function getCurrentUserRole(): Promise<'superadmin' | 'admin' | 'partner' | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    const role = user.app_metadata?.role || user.user_metadata?.role;
    if (['superadmin', 'sef_admin', 'admin'].includes(role)) {
      return role === 'sef_admin' ? 'superadmin' : (role === 'admin' ? 'admin' : 'superadmin');
    }
    if (role === 'partner') {
      return 'partner';
    }
    return null;
  } catch (error) {
    console.error('[getCurrentUserRole] Error:', error);
    return null;
  }
}

/**
 * Check if current user is admin or superadmin
 * Admins can see all data, partners can only see their own
 * 
 * @returns {Promise<boolean>}
 */
export async function isAdminUser(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === 'superadmin' || role === 'admin';
}

/**
 * Add partner_id filter to a Supabase query if user is a partner
 * Admins/superadmins bypass this filter (can see all)
 * 
 * @param {any} query - Supabase query builder
 * @param {string | null} partnerId - Partner ID to filter by (if partner user)
 * @param {boolean} isAdmin - Whether user is admin/superadmin
 * @returns {any} - Query with filter applied (if partner)
 */
export function addPartnerFilter(query: any, partnerId: string | null, isAdmin: boolean): any {
  // Admins can see all data - no filter
  if (isAdmin) {
    return query;
  }
  
  // Partners can only see their own data - filter by partner_id
  if (partnerId) {
    return query.eq('partner_id', partnerId);
  }
  
  // No partner_id and not admin - return empty result
  return query.eq('partner_id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
}

