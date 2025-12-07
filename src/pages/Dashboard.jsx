import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { 
  partnersService, 
  deliverablesService, 
  nominationsService, 
  notificationsService,
  activityLogService
} from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Award, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  BarChart3,
  Zap,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import PartnerDashboard from "./PartnerDashboard";
import NoPartnerProfileFound from "../components/dashboard/NoPartnerProfileFound";
import Unauthorized from "./Unauthorized";
import AdminNotificationWidget from "../components/dashboard/AdminNotificationWidget";
import QuickActions from "../components/dashboard/QuickActions";

export default function Dashboard() {
  const { user, partner, partnerContext, role, loading } = useAuth();
  
  // Show loading state while role is being resolved
  if (loading || !role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Get user role from context (source of truth)
  const userRole = role;
  
  // Role-based routing logic
  console.log('🔐 Dashboard - Role Check:', {
    userRole,
    user: user?.email,
    partner: partner?.name,
    partnerContext: partnerContext?.partner_id
  });
  
  // If role is missing → show Access Denied
  if (!userRole) {
    return <Unauthorized message="Your role does not have dashboard access" />;
  }
  
  // If superadmin → show Admin Dashboard (full control panel)
  if (userRole === 'superadmin') {
    return <AdminFullDashboard />;
  }
  
  // If admin → show Admin Dashboard lite (no superadmin-only items)
  if (userRole === 'admin') {
    return <AdminDashboardLite />;
  }
  
  // If partner → show Partner Dashboard
  if (userRole === 'partner') {
    // Check if partner exists
    if (!partner && !partnerContext?.partner_id) {
      return <NoPartnerProfileFound userEmail={user?.email} />;
    }
    return <PartnerDashboard />;
  }
  
  // Fallback: Access Denied
  return <Unauthorized message="Your role does not have dashboard access" />;
}

// Format large numbers with K/M/B abbreviations
const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
};

// Admin Full Dashboard (Superadmin) - Full control panel
function AdminFullDashboard() {
  const { user } = useAuth();

  // Admin-specific data
  const { data: allPartners = [], isLoading: loadingPartners, error: partnersError } = useQuery({
    queryKey: ['allPartners'],
    queryFn: async () => {
      try {
        console.log('[AdminFullDashboard] Fetching all partners...');
        const result = await partnersService.getAll();
        console.log('[AdminFullDashboard] Fetched partners:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('[AdminFullDashboard] Error fetching all partners:', error);
        return []; // Return empty array instead of throwing
      }
    },
    enabled: !!user,
    retry: 1, // Reduce retries
    staleTime: 30000, // Cache for 30 seconds
  });

  const { data: allDeliverables = [], isLoading: loadingDeliverables, error: deliverablesError } = useQuery({
    queryKey: ['allDeliverables'],
    queryFn: async () => {
      try {
        console.log('[AdminFullDashboard] Fetching all deliverables...');
        const result = await deliverablesService.getAll();
        console.log('[AdminFullDashboard] Fetched deliverables:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('[AdminFullDashboard] Error fetching all deliverables:', error);
        return []; // Return empty array instead of throwing
      }
    },
    enabled: !!user,
    retry: 1, // Reduce retries
    staleTime: 30000,
  });

  const { data: allNominations = [], isLoading: loadingNominations, error: nominationsError } = useQuery({
    queryKey: ['allNominations'],
    queryFn: async () => {
      try {
        console.log('[AdminFullDashboard] Fetching all nominations...');
        const result = await nominationsService.getAll();
        console.log('[AdminFullDashboard] Fetched nominations:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('[AdminFullDashboard] Error fetching all nominations:', error);
        return []; // Return empty array instead of throwing (non-critical)
      }
    },
    enabled: !!user,
    retry: 1, // Reduce retries
    staleTime: 30000,
  });

  // Fetch recent activity logs
  const { data: recentActivityLogs = [], isLoading: loadingActivity } = useQuery({
    queryKey: ['recentActivityLogs'],
    queryFn: async () => {
      try {
        console.log('[AdminFullDashboard] Fetching recent activity logs...');
        const result = await activityLogService.getAll(10);
        console.log('[AdminFullDashboard] Fetched activity logs:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('[AdminFullDashboard] Error fetching activity logs:', error);
        // Non-critical - return empty array
        return [];
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000,
  });

  const safeAllPartners = Array.isArray(allPartners) ? allPartners : [];
  const safeAllDeliverables = Array.isArray(allDeliverables) ? allDeliverables : [];
  const safeAllNominations = Array.isArray(allNominations) ? allNominations : [];
  
  // Show loading state if any critical query is loading
  const isLoading = loadingPartners || loadingDeliverables;
  
  // Don't block on nominations loading (non-critical)
  // Nominations error is non-critical - dashboard can still function
  const hasNonCriticalError = nominationsError;
  
  // Log non-critical errors but don't block dashboard
  React.useEffect(() => {
    if (hasNonCriticalError) {
      console.warn('[AdminFullDashboard] Non-critical error loading nominations:', nominationsError);
    }
  }, [hasNonCriticalError, nominationsError]);
  
  const totalPartners = safeAllPartners.length;
  // Pending deliverables: check for 'pending', 'Pending Review', 'pending_review', etc.
  const pendingDeliverables = safeAllDeliverables.filter(d => {
    const status = d?.status?.toLowerCase() || '';
    return status.includes('pending') || status === 'pending_review';
  }).length;
  const approvedDeliverables = safeAllDeliverables.filter(d => d?.status === 'Approved' || d?.status === 'approved').length;
  const rejectedDeliverables = safeAllDeliverables.filter(d => d?.status === 'Rejected' || d?.status === 'rejected').length;
  // Total Submissions = count of all deliverables
  const totalSubmissions = safeAllDeliverables.length;
  const pendingNominations = safeAllNominations.filter(n => n?.status && ['Submitted', 'Under Review', 'submitted', 'under_review'].includes(n.status)).length;
  const approvedNominations = safeAllNominations.filter(n => n?.status === 'Approved' || n?.status === 'approved').length;
  
  const totalAllocated = safeAllPartners.reduce((sum, p) => sum + (p?.allocated_amount || 0), 0);
  const deliverableApprovalRate = safeAllDeliverables.length > 0 
    ? Math.round((approvedDeliverables / safeAllDeliverables.length) * 100) 
    : 0;
  const nominationApprovalRate = safeAllNominations.length > 0
    ? Math.round((approvedNominations / safeAllNominations.length) * 100)
    : 0;

  // Format recent activity from activity logs
  const recentActivity = (recentActivityLogs || []).slice(0, 10).map(log => ({
    id: log.id,
    type: log.activity_type || 'activity',
    description: log.description || 'Activity',
    partner: log.partner?.name || 'Unknown Partner',
    user: log.user?.full_name || log.user?.email || 'Unknown User',
    timestamp: log.created_at,
    metadata: log.metadata || {}
  }));

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't show error screen - errors are handled gracefully by returning empty arrays
  // Dashboard will show with available data
  
  // Show warning banner for non-critical errors (nominations)
  const showNominationsWarning = hasNonCriticalError;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Show warning banner for non-critical errors */}
      {showNominationsWarning && (
        <Card className="border-yellow-200 bg-yellow-50 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Could not load nominations data. Dashboard is showing other information.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Enhanced Admin Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">SEF 2026 Partnership Management - Full Control</p>
            </div>
          </div>
        </div>

        {/* Admin Dashboard Metrics - New Component */}
        <AdminDashboardMetrics isSuperAdmin={true} />

        {/* Admin Notification Widget */}
        <div className="mb-8">
          <AdminNotificationWidget />
        </div>

        {/* Quick Actions */}
        <QuickActions isAdmin={true} />
      </motion.div>
    </div>
  );
}

// Admin Dashboard Lite (Admin) - No superadmin-only items
function AdminDashboardLite() {
  const { user } = useAuth();

  // Get assigned partners for this admin (based on assigned_account_manager)
  const { data: assignedPartners = [] } = useQuery({
    queryKey: ['assignedPartners', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      try {
        const { supabase } = await import('@/config/supabase');
        const { data, error } = await supabase
          .from('partners')
          .select('id')
          .eq('assigned_account_manager', user.email);
        
        if (error) throw error;
        return data?.map(p => p.id) || [];
      } catch (error) {
        console.error('[AdminDashboardLite] Error fetching assigned partners:', error);
        return [];
      }
    },
    enabled: !!user?.email,
    staleTime: 60000, // Cache for 1 minute
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Show warning banner for non-critical errors */}
      {showNominationsWarning && (
        <Card className="border-yellow-200 bg-yellow-50 mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Could not load nominations data. Dashboard is showing other information.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Admin Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">SEF 2026 Partnership Management</p>
            </div>
          </div>
        </div>

        {/* Admin Dashboard Metrics - Filtered by assigned partners */}
        <AdminDashboardMetrics isSuperAdmin={false} assignedPartners={assignedPartners} />

        {/* Admin Notification Widget */}
        <div className="mb-8">
          <AdminNotificationWidget />
        </div>

        {/* Quick Actions */}
        <QuickActions isAdmin={true} />
      </motion.div>
    </div>
  );
}
