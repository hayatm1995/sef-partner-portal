import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/config/supabase';
import { getUserRole, getUserRoleSync } from '@/utils/auth';
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
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        if (data.session?.user) {
          console.log('[AuthContext] Initializing auth for user:', {
            id: data.session.user.id,
            email: data.session.user.email
          });
          
          // Use getUserRole helper that checks both metadata and database
          const roleInfo = await getUserRole(data.session.user);
          
          console.log('[AuthContext] Resolved role info:', {
            role: roleInfo.role,
            partner_id: roleInfo.partner_id,
            user_id: data.session.user.id,
            email: data.session.user.email
          });
          
          setRole(roleInfo.role);
          setPartnerId(roleInfo.partner_id);
          
          // Sync metadata if needed (after initial load)
          // Don't block on this, just log if mismatch
          syncUserMetadata(data.session.user).catch(console.error);
        } else {
          console.log('[AuthContext] No session found');
          setRole(null);
          setPartnerId(null);
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event);
      setSession(session);
      if (session?.user) {
        console.log('[AuthContext] Processing auth state change for user:', {
          id: session.user.id,
          email: session.user.email,
          event
        });
        
        // Use getUserRole helper that checks both metadata and database
        const roleInfo = await getUserRole(session.user);
        
        console.log('[AuthContext] Resolved role info from state change:', {
          role: roleInfo.role,
          partner_id: roleInfo.partner_id,
          user_id: session.user.id,
          email: session.user.email
        });
        
        setRole(roleInfo.role);
        setPartnerId(roleInfo.partner_id);
        
        // After SIGNED_IN event, sync metadata
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          syncUserMetadata(session.user).catch(console.error);
        }
      } else {
        console.log('[AuthContext] No user in session, clearing role');
        setRole(null);
        setPartnerId(null);
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
        // Get role and partner_id from metadata/database
        const roleInfo = await getUserRole(data.session.user);
        setRole(roleInfo.role);
        setPartnerId(roleInfo.partner_id);
        
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
