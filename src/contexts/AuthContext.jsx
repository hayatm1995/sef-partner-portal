import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/config/supabase';
import { getUserRole, getUserRoleSync } from '@/utils/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        if (data.session?.user) {
          // Use getUserRole helper that checks both metadata and database
          const resolvedRole = await getUserRole(data.session.user);
          setRole(resolvedRole);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      setSession(session);
      if (session?.user) {
        // Use getUserRole helper that checks both metadata and database
        const resolvedRole = await getUserRole(session.user);
        setRole(resolvedRole);
      } else {
        setRole(null);
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
        const resolvedRole = await getUserRole(data.session.user);
        setRole(resolvedRole);
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
      app_metadata: { role: 'superadmin' },
      user_metadata: { full_name: 'Test Superadmin' },
    };
    
    setSession({ user: testUser });
    const resolvedRole = await getUserRole(testUser);
    setRole(resolvedRole);
    
    return { data: { user: testUser }, error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  };

  // Create enriched user object with all expected properties - memoized to update when session/role changes
  const enrichedUser = useMemo(() => {
    if (!session?.user) return null;
    
    const isSuperAdmin = role === 'superadmin' || role === 'sef_admin';
    const isAdmin = role === 'admin' || isSuperAdmin;
    const isPartner = role === 'partner';

    return {
      ...session.user,
      role: role || 'partner',
      is_super_admin: isSuperAdmin,
      is_admin: isAdmin,
      is_partner: isPartner,
      full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
      company_name: session.user.user_metadata?.company_name || null,
      partner_id: session.user.user_metadata?.partner_id || null,
      email: session.user.email,
    };
  }, [session, role]);

  const value = {
    session,
    user: enrichedUser,
    role,
    isSuperadmin: role === 'superadmin' || role === 'sef_admin',
    loading,
    logout,
    login,
    loginWithMagicLink,
    loginWithGoogle,
    loginWithMicrosoft,
    loginAsTestUser,
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
