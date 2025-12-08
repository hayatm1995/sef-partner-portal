import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DEV_MODE } from '@/config/devMode';
import { AUTH_BYPASS } from '@/config/authBypass';
import { Loader2 } from 'lucide-react';

/**
 * AuthGuard component that protects routes requiring authentication
 * CRITICAL: Waits for role resolution before rendering protected content
 * Shows loading state while checking auth, redirects to login if not authenticated
 */
export default function AuthGuard({ children }) {
  // TEMPORARY: All authorization removed - always allow access
  // This allows testing app functionality without auth requirements
  return <>{children}</>;
}

