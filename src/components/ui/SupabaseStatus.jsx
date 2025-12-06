import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isSupabaseConfigured } from '@/config/supabase';
import { runHealthCheck } from '@/utils/supabaseHealthCheck';

/**
 * Component to display Supabase connection status
 * Shows in the dashboard when Supabase is connected
 */
export default function SupabaseStatus() {
  const [status, setStatus] = useState({
    loading: true,
    configured: false,
    connected: false,
    message: '',
  });

  useEffect(() => {
    const checkStatus = async () => {
      if (!isSupabaseConfigured) {
        setStatus({
          loading: false,
          configured: false,
          connected: false,
          message: 'Supabase not configured',
        });
        return;
      }

      try {
        const results = await runHealthCheck();
        setStatus({
          loading: false,
          configured: true,
          connected: results.success,
          message: results.success 
            ? 'Connected to Supabase' 
            : 'Connection issues detected',
        });
      } catch (error) {
        setStatus({
          loading: false,
          configured: true,
          connected: false,
          message: error.message,
        });
      }
    };

    checkStatus();
  }, []);

  if (!isSupabaseConfigured || !status.configured) {
    return null; // Don't show if not configured
  }

  if (status.loading) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">Checking Supabase connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 ${status.connected ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status.connected ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-600" />
                <span className="font-semibold text-gray-900">Supabase</span>
              </div>
              <p className="text-sm text-gray-600">{status.message}</p>
            </div>
          </div>
          <Badge variant={status.connected ? 'default' : 'destructive'}>
            {status.connected ? 'Connected' : 'Error'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}



