import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/config/supabase';
import { getUserRole, getUserRoleSync } from '@/utils/auth';
import { fetchCurrentUser } from '@/utils/currentUser';
import { SUPERADMIN } from '@/constants/users';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [partnerId, setPartnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  // View-as-partner state (does NOT overwrite primary role)
  const [viewingAsPartnerId, setViewingAsPartnerId] = useState(null);

  /**
   * Sync user role and partner_id to app_metadata after login
   * This ensures JWT contains these values for RLS policies
   */
  const syncUserMetadata = async (user) => {
    try {
      // Get role and partner_id from database
      const roleInfo = await getUserRole(user);
      
      // If app_metadata doesn't match, we need to update it via Edge Function
      // Client-side cannot update app_metadata directly
      const currentAppRole = user.app_metadata?.role;
      const currentAppPartnerId = user.app_metadata?.partner_id;
      
      if (currentAppRole !== roleInfo.role || currentAppPartnerId !== roleInfo.partner_id) {
        console.log('[syncUserMetadata] Metadata mismatch, would sync:', {
          current: { role: currentAppRole, partner_id: currentAppPartnerId },
          expected: roleInfo
        });
        
        // Call Edge Function to update app_metadata (if available)
        // For now, we'll rely on the invite-partner Edge Function to set this
        // Or we can create a sync-metadata Edge Function
      }
      
      return roleInfo;
    } catch (error) {
      console.error('[syncUserMetadata] Error:', error);
      return { role: null, partner_id: null };
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout to ensure loading always resolves (15 seconds max)
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('[AuthContext] Safety timeout reached - forcing loading to false');
        setLoading(false);
      }
    }, 15000);
    
    const init = async () => {
      try {
        // First, quickly check for session - don't wait for role resolution
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        setSession(data.session);
        
        // If no session, immediately stop loading and show landing page
        if (!data.session?.user) {
          console.log('[AuthContext] No session found - showing landing page');
          setRole(null);
          setPartnerId(null);
          setLoading(false);
          return;
        }
        
        // We have a session - now resolve role (but don't block UI)
        console.log('[AuthContext] Initializing auth for user:', {
          id: data.session.user.id,
          email: data.session.user.email
        });
        
        // Quick superadmin check first (email-based, no DB needed)
        const email = data.session.user.email || '';
        const superadminEmails = ['hayat.malik6@gmail.com', 'h.malik@sheraa.ae'];
        const isSuperadminEmail = superadminEmails.some(e => email.toLowerCase() === e.toLowerCase());
        
        if (isSuperadminEmail) {
          console.log('[AuthContext] Superadmin email detected - setting role immediately');
          setRole('superadmin');
          setPartnerId(null);
          setLoading(false);
          
          // Fetch full user data in background (non-blocking)
          fetchCurrentUser(data.session.user.id).then(currentUser => {
            if (isMounted && currentUser) {
              setPartnerId(currentUser.partnerId);
            }
          }).catch(console.error);
          return;
        }
        
        // For non-superadmins, fetch role from DB (with timeout)
        const fetchUserPromise = fetchCurrentUser(data.session.user.id);
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => {
            console.warn('[AuthContext] fetchCurrentUser timeout - using fallback');
            resolve(null);
          }, 3000) // 3 second timeout
        );
        
        const currentUser = await Promise.race([fetchUserPromise, timeoutPromise]);
        
        if (!isMounted) return;
        
        if (!currentUser) {
          console.warn('[AuthContext] Could not fetch current user - setting role to null');
          setRole(null);
          setPartnerId(null);
          setLoading(false);
          return;
        }
        
        // Check if user is disabled
        if (currentUser.isDisabled === true) {
          console.warn('[AuthContext] User is disabled, forcing logout');
          await supabase.auth.signOut();
          if (isMounted) {
            setSession(null);
            setRole(null);
            setPartnerId(null);
          }
          setLoading(false);
          return;
        }
        
        console.log('[AuthContext] Resolved role info:', {
          role: currentUser.role,
          partner_id: currentUser.partnerId,
          email: currentUser.email,
          isSuperadmin: currentUser.isSuperadmin,
          isAdmin: currentUser.isAdmin
        });
        
        if (isMounted) {
          // Map to legacy role format (null for unknown)
          const legacyRole = currentUser.role === 'unknown' ? null : currentUser.role;
          setRole(legacyRole);
          setPartnerId(currentUser.partnerId);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        if (isMounted) {
          setRole(null);
          setPartnerId(null);
        }
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      }
    };

    init();
    
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);
      setSession(session);
      
      if (!session) {
        console.log('[AuthContext] No user in session, clearing role');
        setRole(null);
        setPartnerId(null);
        setLoading(false);
        return;
      }
      
      if (session?.user) {
        console.log('[AuthContext] Processing auth state change for user:', {
          id: session.user.id,
          email: session.user.email,
          event
        });
        
        try {
          // Use new fetchCurrentUser utility (single source of truth)
          const currentUser = await fetchCurrentUser(session.user.id);
          
          if (!currentUser) {
            console.warn('[AuthContext] Could not fetch current user from state change');
            setRole(null);
            setPartnerId(null);
            setLoading(false);
            return;
          }
          
          // Check if user is disabled - force logout
          if (currentUser.isDisabled === true) {
            console.warn('[AuthContext] User is disabled, forcing logout');
            await supabase.auth.signOut();
            setSession(null);
            setRole(null);
            setPartnerId(null);
            setLoading(false);
            return;
          }
          
          console.log('[AuthContext] Resolved role info from state change:', {
            role: currentUser.role,
            partner_id: currentUser.partnerId,
            user_id: currentUser.authUserId,
            email: currentUser.email,
            isSuperadmin: currentUser.isSuperadmin,
            isAdmin: currentUser.isAdmin
          });
          
          // Map to legacy role format (null for unknown)
          const legacyRole = currentUser.role === 'unknown' ? null : currentUser.role;
          setRole(legacyRole);
          setPartnerId(currentUser.partnerId);
          setLoading(false);
          
          // After SIGNED_IN event, sync metadata
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            syncUserMetadata(session.user).catch(console.error);
          }
        } catch (error) {
          console.error('[AuthContext] Error in auth state change:', error);
          setRole(null);
          setPartnerId(null);
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (data?.session?.user) {
        // Use new fetchCurrentUser utility (single source of truth)
        const currentUser = await fetchCurrentUser(data.session.user.id);
        
        if (!currentUser) {
          console.warn('[AuthContext] Could not fetch current user after login');
          return { data: null, error: { message: 'Could not fetch user information' } };
        }
        
        // Check if user is disabled - force logout
        if (currentUser.isDisabled === true) {
          console.warn('[AuthContext] User is disabled, forcing logout');
          await supabase.auth.signOut();
          setSession(null);
          setRole(null);
          setPartnerId(null);
          return { data: null, error: { message: 'Account is disabled' } };
        }
        
        // Map to legacy role format (null for unknown)
        const legacyRole = currentUser.role === 'unknown' ? null : currentUser.role;
        setRole(legacyRole);
        setPartnerId(currentUser.partnerId);
        
        // Sync metadata to ensure JWT contains role and partner_id
        await syncUserMetadata(data.session.user);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error };
    }
  };

  const loginWithMagicLink = async (email) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/Login`,
        },
      });
      return { data, error };
    } catch (error) {
      console.error('Magic link error:', error);
      return { data: null, error };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/Login`,
        },
      });
      return { data, error };
    } catch (error) {
      console.error('Google login error:', error);
      return { data: null, error };
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/Login`,
        },
      });
      return { data, error };
    } catch (error) {
      console.error('Microsoft login error:', error);
      return { data: null, error };
    }
  };

  const loginAsTestUser = async () => {
    // For dev mode - create a mock session
    const testUser = {
      id: SUPERADMIN.uid,
      email: SUPERADMIN.email,
      app_metadata: { role: 'superadmin', partner_id: null },
      user_metadata: { full_name: 'Test Superadmin' },
    };
    
    setSession({ user: testUser });
    const roleInfo = await getUserRole(testUser);
    setRole(roleInfo.role);
    setPartnerId(roleInfo.partner_id);
    
    return { data: { user: testUser }, error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
    setPartnerId(null);
    setViewingAsPartnerId(null); // Clear view-as-partner state on logout
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
  };

  /**
   * Set viewing-as-partner mode
   * This does NOT change the actual role - it's just a view mode
   * @param {string | null} partnerId - Partner ID to view as, or null to exit
   */
  const setViewingAsPartner = (partnerId) => {
    console.log('[AuthContext] Setting view-as-partner:', partnerId);
    setViewingAsPartnerId(partnerId);
  };

  /**
   * Clear viewing-as-partner mode
   */
  const clearViewAsPartner = () => {
    console.log('[AuthContext] Clearing view-as-partner');
    setViewingAsPartnerId(null);
  };

  // Create enriched user object with all expected properties - memoized to update when session/role/partnerId changes
  const enrichedUser = useMemo(() => {
    if (!session?.user) return null;
    
    const isSuperAdmin = role === 'superadmin' || role === 'sef_admin';
    const isAdmin = role === 'admin' || isSuperAdmin;
    const isPartner = role === 'partner';

    // Get partner_id from: 1) state, 2) app_metadata, 3) user_metadata
    const effectivePartnerId = partnerId || 
      session.user.app_metadata?.partner_id || 
      session.user.user_metadata?.partner_id || 
      null;

    return {
      ...session.user,
      role: role || 'partner',
      is_super_admin: isSuperAdmin,
      is_admin: isAdmin,
      is_partner: isPartner,
      full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
      company_name: session.user.user_metadata?.company_name || null,
      partner_id: effectivePartnerId, // Use resolved partner_id
      email: session.user.email,
    };
  }, [session, role, partnerId]);

  const value = {
    session,
    user: enrichedUser,
    role,
    partnerId, // Expose partner_id in context
    isSuperadmin: role === 'superadmin' || role === 'sef_admin',
    loading,
    logout,
    login,
    loginWithMagicLink,
    loginWithGoogle,
    loginWithMicrosoft,
    loginAsTestUser,
    // View-as-partner functionality (does not change actual role)
    viewingAsPartnerId,
    setViewingAsPartner,
    clearViewAsPartner,
    // Legacy compatibility
    partner: null,
    partnerUser: null,
    partnerContext: null,
    viewMode: 'auto',
    switchViewMode: () => {},
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
