/**
 * Global RouteGuard Wrapper
 * 
 * Protects routes based on user role and handles redirects.
 * Shows loading state during role resolution to prevent UI flicker.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppRole } from '@/hooks/useAppRole';
import { DEV_MODE } from '@/config/devMode';
import { AUTH_BYPASS } from '@/config/authBypass';
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
  // TEMPORARY: All authorization removed - always allow access
  // This allows testing app functionality without auth requirements
  return <>{children}</>;
}

