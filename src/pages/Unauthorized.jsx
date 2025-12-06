import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Unauthorized({ message }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getHomeUrl = () => {
    if (!user) return '/Login';
    const role = user?.role || 'viewer';
    if (role === 'superadmin' || role === 'sef_admin') {
      return '/superadmin/control-room';
    }
    if (role === 'admin') {
      return '/admin/partners';
    }
    return '/Dashboard';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-4">
      <Card className="w-full max-w-2xl border-red-200 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">
            Access Denied
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            {message || "You don't have permission to access this page."}
          </p>

          {user && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300">
              <p className="text-sm font-semibold text-gray-900 mb-2">Your Account:</p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Role:</span> {user.role || 'viewer'}</p>
                {user.company_name && (
                  <p><span className="font-medium">Company:</span> {user.company_name}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-4">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-orange-200 hover:bg-orange-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate(getHomeUrl())}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact your administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


