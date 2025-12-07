import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Mail, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { handleMagicLinkCallback, isMagicLinkCallback } from '@/utils/magicLinkHandler';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithMagicLink, loginWithGoogle, loginWithMicrosoft, loginAsTestUser, user, viewMode } = useAuth();

  // Helper function to get redirect URL based on role
  // Updated to use proper dashboard routes: /admin/dashboard and /partner/dashboard
  const getRedirectUrl = React.useCallback((userRole) => {
    if (!userRole) return '/Login';
    
    // STRICT role-based routing:
    // - superadmin → /admin/dashboard
    // - admin → /admin/dashboard  
    // - partner → /partner/dashboard
    if (userRole === 'superadmin' || userRole === 'sef_admin') {
      return '/admin/dashboard';
    }
    if (userRole === 'admin') {
      return '/admin/dashboard';
    }
    if (userRole === 'partner') {
      return '/partner/dashboard';
    }
    
    // Fallback to login if role is invalid
    return '/Login';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('🔐 Login form submitted for:', email);
      const { error } = await login(email, password);
      
      if (error) {
        console.error('❌ Login error:', error);
        toast.error(error.message || 'Login failed. Please check your credentials.');
        setIsLoading(false);
      } else {
        console.log('✅ Login successful! Redirecting based on role...');
        toast.success('Logged in successfully!');
        // Wait a bit for auth state to update, then redirect based on role
        setTimeout(() => {
          // Get redirect URL from location state or determine from role
          const from = location.state?.from?.pathname;
          // Only redirect to requested page if user has access (role-based check happens in routing)
          if (from && from !== '/Login') {
            console.log('🚀 Redirecting to requested page:', from);
            navigate(from, { replace: true });
          } else {
            // Will redirect in useEffect when user state updates based on role
            console.log('🚀 Will redirect based on role after auth state updates');
          }
        }, 500);
      }
    } catch (error) {
      console.error('❌ Login exception:', error);
      toast.error('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsMagicLinkLoading(true);
    try {
      const { error } = await loginWithMagicLink(email);
      
      if (error) {
        toast.error(error.message || 'Failed to send magic link');
      } else {
        setMagicLinkSent(true);
        toast.success('Magic link sent! Check your email.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await loginWithGoogle();
      if (error) {
        toast.error(error.message || 'Google login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      const { error } = await loginWithMicrosoft();
      if (error) {
        toast.error(error.message || 'Microsoft login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };

  const handleTestLogin = async () => {
    try {
      await loginAsTestUser();
      toast.success('Logged in as test user');
      // Small delay to ensure state updates, then redirect based on role
      setTimeout(() => {
        // Test user is superadmin, so redirect to control room
        navigate('/superadmin/control-room', { replace: true });
      }, 300);
    } catch (error) {
      console.error('Test login error:', error);
      toast.error('Failed to login as test user');
    }
  };

  // Redirect authenticated users away from login page
  React.useEffect(() => {
    if (user && user.role) {
      const redirectUrl = getRedirectUrl(user.role);
      console.log('[Login] User already authenticated, redirecting to:', redirectUrl, 'role:', user.role);
      navigate(redirectUrl, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Handle magic link callback after user clicks invite link
  React.useEffect(() => {
    const processMagicLink = async () => {
      if (isMagicLinkCallback()) {
        console.log('[Login] Processing magic link callback...');
        try {
          const roleInfo = await handleMagicLinkCallback();
          
          if (roleInfo.role) {
            console.log('[Login] Magic link processed, role:', roleInfo.role);
            toast.success('Welcome! Setting up your account...');
            
            // Wait for auth state to update, then redirect
            setTimeout(() => {
              const redirectUrl = getRedirectUrl(roleInfo.role);
              console.log('[Login] Redirecting after magic link:', redirectUrl);
              navigate(redirectUrl, { replace: true });
            }, 1000);
          } else {
            console.error('[Login] Failed to get role from magic link');
            toast.error('Failed to set up account. Please contact support.');
          }
        } catch (error) {
          console.error('[Login] Error processing magic link:', error);
          toast.error('An error occurred. Please try again.');
        }
      }
    };
    
    processMagicLink();
  }, [navigate]);

  // Check for bypass URL parameter
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('bypass') === 'true' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      localStorage.setItem('dev_bypass_auth', 'true');
      navigate('/Dashboard');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-orange-200 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">SEF</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Partner Portal
            </CardTitle>
            <CardDescription className="text-base">
              Sign in to access your partnership dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {magicLinkSent ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 text-center">
                  ✅ Magic link sent to <strong>{email}</strong>! Check your email and click the link to sign in.
                </p>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-blue-200 hover:bg-blue-50"
                onClick={handleMagicLink}
                disabled={isMagicLinkLoading || !email}
              >
                {isMagicLinkLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </>
                )}
              </Button>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 border-gray-200 hover:bg-gray-50"
                onClick={handleGoogleLogin}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 border-gray-200 hover:bg-gray-50"
                onClick={handleMicrosoftLogin}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Microsoft
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Show test user button only on localhost */}
            {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Dev Only</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-orange-200 hover:bg-orange-50"
                  onClick={handleTestLogin}
                >
                  Login as Test User (Localhost Only)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold"
                  onClick={() => {
                    console.log('🔓 Enabling dev bypass...');
                    localStorage.setItem('dev_bypass_auth', 'true');
                    // Force reload to apply bypass
                    window.location.href = '/Dashboard';
                  }}
                >
                  🔓 Bypass Auth & Go to Dashboard (Dev Mode)
                </Button>
              </>
            )}

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  <strong>Test Mode:</strong> Use "Login as Test User" to access the portal without credentials.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

