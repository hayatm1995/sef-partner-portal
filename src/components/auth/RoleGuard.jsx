import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRoleSync } from '@/utils/auth';
import { Loader2 } from 'lucide-react';

/**
 * RoleGuard component that protects routes based on user role
 * Uses getUserRoleSync for immediate role checking without async
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string[]} props.allowedRoles - Array of allowed roles (e.g., ['admin', 'superadmin'])
 * @param {boolean} props.requireAdmin - If true, requires admin or superadmin role
 * @param {boolean} props.requirePartner - If true, requires partner role (not admin)
 */
export default function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requireAdmin = false,
  requirePartner = false 
}) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth - CRITICAL: Don't render protected content until role is loaded
  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    console.log('[RoleGuard] No user, redirecting to login');
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  // STRICT: Use resolved role from context (already checked against database)
  // Only 'superadmin' or 'partner' - no fallback behavior
  const userRole = role || getUserRoleSync(user, role);
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;
  const isPartner = userRole === 'partner';
  
  // Validate role - includes 'admin' now
  if (userRole && !['superadmin', 'admin', 'partner'].includes(userRole)) {
    console.error('[RoleGuard] Invalid role:', userRole);
    return <Navigate to="/Unauthorized" replace />;
  }

  // Check if user has required role
  let hasAccess = false;

  if (requireAdmin) {
    // Admin routes: require admin or superadmin
    hasAccess = isAdmin;
  } else if (requirePartner) {
    // Partner routes: STRICT - only partners (not admin/superadmin)
    hasAccess = isPartner && !isAdmin;
  } else if (allowedRoles.length > 0) {
    // Specific roles allowed
    hasAccess = allowedRoles.includes(userRole) || (isSuperAdmin && allowedRoles.includes('superadmin'));
  } else {
    // No specific requirements, allow access to authenticated users
    hasAccess = true;
  }

  if (!hasAccess) {
    console.log('[RoleGuard] Access denied. User role:', userRole, 'Required:', { requireAdmin, requirePartner, allowedRoles });
    return <Navigate to="/Unauthorized" replace />;
  }

  // User has access
  return <>{children}</>;
}

