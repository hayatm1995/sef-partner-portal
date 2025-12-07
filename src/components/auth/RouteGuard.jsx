/**
 * Global RouteGuard Wrapper
 * 
 * Protects routes based on user role and handles redirects.
 * Shows loading state during role resolution to prevent UI flicker.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoleSync } from '@/utils/role';
import { Loader2 } from 'lucide-react';

/**
 * RouteGuard component that protects routes based on user role
 * 
 * Rules:
 * - Superadmin/Admin accessing /partner/* → redirect to /admin/dashboard
 * - Partner accessing /admin/* → redirect to /partner/dashboard
 * - Shows loading state while role is being determined
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 */
export default function RouteGuard({ children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth and role - CRITICAL: Don't render until role is loaded
  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    console.log('[RouteGuard] No user, redirecting to login');
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  // Get resolved role
  const userRole = role || getUserRoleSync(user, role, null)?.role;
  
  // Validate role
  if (!userRole || !['superadmin', 'admin', 'partner'].includes(userRole)) {
    console.error('[RouteGuard] Invalid role:', userRole);
    return <Navigate to="/Unauthorized" replace />;
  }

  const isSuperadmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin' || isSuperadmin;
  const isPartner = userRole === 'partner';

  // Redirect logic: Prevent role-based route access violations
  const pathname = location.pathname;

  // Superadmin/Admin trying to access partner routes → redirect to admin dashboard
  if ((isSuperadmin || isAdmin) && pathname.startsWith('/partner/')) {
    console.log('[RouteGuard] Admin user accessing partner route, redirecting to /admin/dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Partner trying to access admin routes → redirect to partner dashboard
  if (isPartner && (pathname.startsWith('/admin/') || pathname.startsWith('/superadmin/'))) {
    console.log('[RouteGuard] Partner user accessing admin route, redirecting to /partner/dashboard');
    return <Navigate to="/partner/dashboard" replace />;
  }

  // User has correct role for the route
  console.log('[RouteGuard] Access granted for role:', userRole, 'on path:', pathname);
  return <>{children}</>;
}

