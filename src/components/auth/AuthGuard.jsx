import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * AuthGuard component that protects routes requiring authentication
 * CRITICAL: Waits for role resolution before rendering protected content
 * Shows loading state while checking auth, redirects to login if not authenticated
 */
export default function AuthGuard({ children }) {
  const { user, session, role, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication and role resolution
  // CRITICAL: Don't render protected content until role is loaded
  const [showTimeout, setShowTimeout] = useState(false);
  
  useEffect(() => {
    if (loading || (session && !role)) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
      }, 5000); // Show timeout message after 5 seconds
      
      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [loading, session, role]);
  
  // Wait for role resolution - CRITICAL for production
  if (loading || (session && !role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
          {showTimeout && (
            <p className="text-sm text-orange-600 mt-2">
              Taking longer than expected. Please check the console for errors.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (except for login page itself)
  if (!session && !user && location.pathname !== '/Login') {
    console.log('[AuthGuard] No user, redirecting to login');
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  // Render protected content - role is now guaranteed to be loaded
  return <>{children}</>;
}

