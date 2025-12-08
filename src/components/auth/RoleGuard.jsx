import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppRole } from '@/hooks/useAppRole';
import { DEV_MODE } from '@/config/devMode';
import { AUTH_BYPASS } from '@/config/authBypass';
import { Loader2 } from 'lucide-react';

/**
 * RoleGuard component that protects routes based on user role
 * Uses useAppRole() hook for consistent role detection
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
  // TEMPORARY: All authorization removed - always allow access
  // This allows testing app functionality without auth requirements
  return <>{children}</>;
}

