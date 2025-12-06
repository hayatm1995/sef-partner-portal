import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * RoleGuard component that protects routes based on user role
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string[]} props.allowedRoles - Array of allowed roles (e.g., ['admin', 'sef_admin'])
 * @param {boolean} props.requireAdmin - If true, requires admin or sef_admin role
 * @param {boolean} props.requirePartner - If true, requires partner role (not admin)
 */
export default function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requireAdmin = false,
  requirePartner = false 
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
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
    console.log('RoleGuard: No user, redirecting to login');
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  const userRole = user?.role || 'viewer';
  const isAdmin = ['admin', 'sef_admin', 'superadmin'].includes(userRole) || user?.is_super_admin;
  // Partner role: owner or admin roles in partner context
  // Check partner_user.role first, then fallback to user.role for partner routes
  const partnerRole = user?.partner_user?.role;
  const isPartnerOwner = partnerRole === 'owner' || partnerRole === 'admin';
  // Partner is either owner/admin in partner context, or not admin and not viewer
  const isPartner = isPartnerOwner || (!isAdmin && userRole !== 'viewer' && userRole !== 'sef_admin');

  // Check if user has required role
  let hasAccess = false;

  if (requireAdmin) {
    // Admin routes: only admin or sef_admin
    hasAccess = isAdmin;
  } else if (requirePartner) {
    // Partner routes: only partners (not admins)
    hasAccess = isPartner;
  } else if (allowedRoles.length > 0) {
    // Specific roles allowed
    hasAccess = allowedRoles.includes(userRole) || (isAdmin && allowedRoles.includes('admin'));
  } else {
    // No specific requirements, allow access to authenticated users
    hasAccess = true;
  }

  if (!hasAccess) {
    console.log('RoleGuard: Access denied. User role:', userRole, 'Required:', { requireAdmin, requirePartner, allowedRoles });
    return <Navigate to="/Unauthorized" replace />;
  }

  // User has access
  return <>{children}</>;
}

