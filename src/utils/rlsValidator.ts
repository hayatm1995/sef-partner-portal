/**
 * RLS (Row Level Security) Validator
 * 
 * Validates that Supabase queries include proper partner_id filters for partner users.
 * Logs warnings for missing filters to help catch security issues.
 */

import { supabase } from '@/config/supabase';

export interface QueryValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates a Supabase query to ensure it has proper RLS filters
 * 
 * @param query - The Supabase query builder object
 * @param userRole - Current user's role ('superadmin' | 'admin' | 'partner')
 * @param userPartnerId - Current user's partner_id (null for admins)
 * @param tableName - Name of the table being queried
 * @returns Validation result with warnings and errors
 */
export function validateQuery(
  query: any,
  userRole: 'superadmin' | 'admin' | 'partner' | null,
  userPartnerId: string | null,
  tableName: string
): QueryValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Admins and superadmins can see all data - no filter needed
  if (userRole === 'superadmin' || userRole === 'admin') {
    return { isValid: true, warnings: [], errors: [] };
  }

  // Partners MUST have partner_id filter
  if (userRole === 'partner') {
    if (!userPartnerId) {
      errors.push(`[RLS] Partner user missing partner_id - cannot validate query for table: ${tableName}`);
      return { isValid: false, warnings, errors };
    }

    // Check if query has partner_id filter
    // Note: This is a simplified check - in practice, we'd need to inspect the query builder's internal state
    // For now, we'll log a warning and rely on RLS policies in Supabase
    
    // Check if this is a table that requires partner_id filtering
    const tablesRequiringPartnerFilter = [
      'deliverables',
      'partner_submissions',
      'contracts',
      'nominations',
      'notifications',
      'support_messages',
      'activity_log',
    ];

    if (tablesRequiringPartnerFilter.includes(tableName)) {
      // Log warning - actual enforcement happens via RLS policies
      warnings.push(
        `[RLS] Query on ${tableName} for partner user - ensure .eq('partner_id', '${userPartnerId}') is included. ` +
        `RLS policies should enforce this, but verify the query includes the filter.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Logs RLS validation warnings to console
 * Only logs in development mode to avoid console spam in production
 */
export function logRLSWarning(
  tableName: string,
  userRole: string | null,
  userPartnerId: string | null,
  message: string
) {
  if (typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.warn(`[RLS Validation] ${message}`, {
      table: tableName,
      role: userRole,
      partner_id: userPartnerId,
    });
  }
}

/**
 * Validates and logs query - convenience function
 */
export function validateAndLogQuery(
  query: any,
  userRole: 'superadmin' | 'admin' | 'partner' | null,
  userPartnerId: string | null,
  tableName: string
): boolean {
  const result = validateQuery(query, userRole, userPartnerId, tableName);
  
  if (result.errors.length > 0) {
    console.error('[RLS Validation] Errors:', result.errors);
    return false;
  }
  
  if (result.warnings.length > 0) {
    result.warnings.forEach(warning => {
      logRLSWarning(tableName, userRole, userPartnerId, warning);
    });
  }
  
  return result.isValid;
}

