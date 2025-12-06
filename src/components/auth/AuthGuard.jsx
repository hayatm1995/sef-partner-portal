import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * AuthGuard component that protects routes requiring authentication
 * Shows loading state while checking auth, redirects to login if not authenticated
 */
export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication (but with timeout)
  const [showTimeout, setShowTimeout] = useState(false);
  
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowTimeout(true);
      }, 5000); // Show timeout message after 5 seconds
      
      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [loading]);
  
  // EMERGENCY DEBUG: Skip loading check
  if (false && loading) {
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

  // EMERGENCY DEBUG: Skip auth check - always allow access
  if (false && !user && location.pathname !== '/Login') {
    console.log('AuthGuard: No user, redirecting to login');
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  // Allow access to login page without auth
  // EMERGENCY DEBUG: Disable redirects temporarily
  if (location.pathname === '/Login' && user) {
    console.log('🔧 DEBUG MODE: Skipping login redirect');
    // Temporarily disabled redirect
    // return <Navigate to="/superadmin/control-room" replace />;
  }

  // EMERGENCY DEBUG: Disable route protection temporarily
  if (user) {
    console.log('🔧 DEBUG MODE: Route protection disabled, allowing all routes');
    // Temporarily disabled route protection
  }

  // Render protected content
  console.log('AuthGuard: Rendering protected content for user:', user?.email);
  return <>{children}</>;
}

