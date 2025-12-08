import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/config/supabase';
import { fetchCurrentUser } from '@/utils/currentUser';

/**
 * Current user with role information
 */
export interface CurrentUser {
  authUserId: string;
  email: string;
  fullName?: string;
  role: 'superadmin' | 'admin' | 'partner' | 'unknown';
  isSuperadmin: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  partnerId: string | null;
  partnerUserId: string | null;
  isDisabled?: boolean;
}

/**
 * Single-source hook for current user with role detection
 * 
 * This hook:
 * 1. Gets auth session user (id + email)
 * 2. Fetches partner_users record for that auth_user_id
 * 3. Returns a clean, typed object with all user info + role
 * 
 * Handles:
 * - Superadmin emails (hayat.malik6@gmail.com, h.malik@sheraa.ae)
 * - Standard admin (y.yassin@sheraa.ae)
 * - Partner users
 * - Unknown users (not in partner_users table)
 */
export function useCurrentUser() {
  // Get auth user ID first
  const { data: authUserId, isLoading: authLoading, error: authError } = useQuery({
    queryKey: ['authUserId'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user?.id || null;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch current user with role using the utility function
  const { data: currentUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['currentUser', authUserId],
    queryFn: () => fetchCurrentUser(authUserId || null),
    enabled: !!authUserId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = authLoading || userLoading;
  const error = authError || userError;

  return {
    user: currentUser,
    isLoading,
    error,
    // Convenience flags
    isAuthenticated: !!currentUser,
    isUnknown: currentUser?.role === 'unknown',
  };
}

