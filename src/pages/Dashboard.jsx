import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { 
  partnersService, 
  deliverablesService, 
  nominationsService, 
  notificationsService
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
  Zap
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
        throw error; // Re-throw to let React Query handle it
      }
    },
    enabled: !!user,
    retry: 2,
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
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
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
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });

  const safeAllPartners = Array.isArray(allPartners) ? allPartners : [];
  const safeAllDeliverables = Array.isArray(allDeliverables) ? allDeliverables : [];
  const safeAllNominations = Array.isArray(allNominations) ? allNominations : [];
  
  // Show loading state if any query is loading
  const isLoading = loadingPartners || loadingDeliverables || loadingNominations;
  
  // Show error state if any query has an error
  const hasError = partnersError || deliverablesError || nominationsError;
  
  const totalPartners = safeAllPartners.length;
  const pendingDeliverables = safeAllDeliverables.filter(d => d?.status === 'Pending Review' || d?.status === 'pending_review').length;
  const approvedDeliverables = safeAllDeliverables.filter(d => d?.status === 'Approved' || d?.status === 'approved').length;
  const rejectedDeliverables = safeAllDeliverables.filter(d => d?.status === 'Rejected' || d?.status === 'rejected').length;
  const pendingNominations = safeAllNominations.filter(n => n?.status && ['Submitted', 'Under Review', 'submitted', 'under_review'].includes(n.status)).length;
  const approvedNominations = safeAllNominations.filter(n => n?.status === 'Approved' || n?.status === 'approved').length;
  
  const totalAllocated = safeAllPartners.reduce((sum, p) => sum + (p?.allocated_amount || 0), 0);
  const deliverableApprovalRate = safeAllDeliverables.length > 0 
    ? Math.round((approvedDeliverables / safeAllDeliverables.length) * 100) 
    : 0;
  const nominationApprovalRate = safeAllNominations.length > 0
    ? Math.round((approvedNominations / safeAllNominations.length) * 100)
    : 0;

  const recentActivity = [];

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

  // Show error state
  if (hasError) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">
            {partnersError && `Partners: ${partnersError.message}`}
            {deliverablesError && `Deliverables: ${deliverablesError.message}`}
            {nominationsError && `Nominations: ${nominationsError.message}`}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

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

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border border-blue-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 group-hover:from-blue-500/10 group-hover:to-blue-600/20 transition-all duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">Active</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Partners</p>
                  <p className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent tabular-nums">{formatNumber(totalPartners)}</p>
                  <p className="text-sm text-gray-600 font-medium">Registered organizations</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border border-green-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/10 group-hover:from-green-500/10 group-hover:to-emerald-600/20 transition-all duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">Budget</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Allocated</p>
                  <div className="text-5xl font-bold bg-gradient-to-br from-green-600 to-emerald-500 bg-clip-text text-transparent tabular-nums">
                    <span className="text-2xl">AED</span> {formatNumber(totalAllocated)}
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Partnership budget</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border border-orange-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-600/10 group-hover:from-orange-500/10 group-hover:to-amber-600/20 transition-all duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-semibold">Pending</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Deliverables</p>
                  <p className="text-5xl font-bold bg-gradient-to-br from-orange-600 to-amber-500 bg-clip-text text-transparent tabular-nums">{formatNumber(pendingDeliverables)}</p>
                  <p className="text-sm text-gray-600 font-medium">{formatNumber(safeAllDeliverables.length)} total</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border border-purple-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/10 group-hover:from-purple-500/10 group-hover:to-violet-600/20 transition-all duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold">Review</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Nominations</p>
                  <p className="text-5xl font-bold bg-gradient-to-br from-purple-600 to-violet-500 bg-clip-text text-transparent tabular-nums">{formatNumber(pendingNominations)}</p>
                  <p className="text-sm text-gray-600 font-medium">{formatNumber(safeAllNominations.length)} total</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-2 border-indigo-100 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Approval Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Deliverable Approval Rate</span>
                    <span className="text-sm font-bold text-indigo-700">{deliverableApprovalRate}%</span>
                  </div>
                  <Progress value={deliverableApprovalRate} className="h-3" />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{approvedDeliverables} approved</span>
                    <span>{rejectedDeliverables} rejected</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Nomination Approval Rate</span>
                    <span className="text-sm font-bold text-purple-700">{nominationApprovalRate}%</span>
                  </div>
                  <Progress value={nominationApprovalRate} className="h-3" />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{approvedNominations} approved</span>
                    <span>{safeAllNominations.length - approvedNominations} pending/declined</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-700">{approvedDeliverables + approvedNominations}</p>
                      <p className="text-xs text-gray-600">Approved</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-yellow-700">{pendingDeliverables + pendingNominations}</p>
                      <p className="text-xs text-gray-600">Pending</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-red-700">{rejectedDeliverables}</p>
                      <p className="text-xs text-gray-600">Rejected</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-2 border-teal-100 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" />
                  Recent System Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, idx) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.user_email}</p>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

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

  // Admin-specific data (same as full dashboard but without superadmin features)
  const { data: allPartners = [], isLoading: loadingPartners, error: partnersError } = useQuery({
    queryKey: ['allPartners'],
    queryFn: async () => {
      try {
        console.log('[AdminDashboardLite] Fetching all partners...');
        const result = await partnersService.getAll();
        console.log('[AdminDashboardLite] Fetched partners:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('[AdminDashboardLite] Error fetching all partners:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });

  const { data: allDeliverables = [], isLoading: loadingDeliverables, error: deliverablesError } = useQuery({
    queryKey: ['allDeliverables'],
    queryFn: async () => {
      try {
        console.log('[AdminDashboardLite] Fetching all deliverables...');
        const result = await deliverablesService.getAll();
        console.log('[AdminDashboardLite] Fetched deliverables:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('[AdminDashboardLite] Error fetching all deliverables:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });

  const { data: allNominations = [], isLoading: loadingNominations, error: nominationsError } = useQuery({
    queryKey: ['allNominations'],
    queryFn: async () => {
      try {
        console.log('[AdminDashboardLite] Fetching all nominations...');
        const result = await nominationsService.getAll();
        console.log('[AdminDashboardLite] Fetched nominations:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('[AdminDashboardLite] Error fetching all nominations:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });

  const safeAllPartners = Array.isArray(allPartners) ? allPartners : [];
  const safeAllDeliverables = Array.isArray(allDeliverables) ? allDeliverables : [];
  const safeAllNominations = Array.isArray(allNominations) ? allNominations : [];
  
  // Show loading state if any query is loading
  const isLoading = loadingPartners || loadingDeliverables || loadingNominations;
  
  // Show error state if any query has an error
  const hasError = partnersError || deliverablesError || nominationsError;
  
  const totalPartners = safeAllPartners.length;
  const pendingDeliverables = safeAllDeliverables.filter(d => d?.status === 'Pending Review' || d?.status === 'pending_review').length;
  const approvedDeliverables = safeAllDeliverables.filter(d => d?.status === 'Approved' || d?.status === 'approved').length;
  const rejectedDeliverables = safeAllDeliverables.filter(d => d?.status === 'Rejected' || d?.status === 'rejected').length;
  const pendingNominations = safeAllNominations.filter(n => n?.status && ['Submitted', 'Under Review', 'submitted', 'under_review'].includes(n.status)).length;
  const approvedNominations = safeAllNominations.filter(n => n?.status === 'Approved' || n?.status === 'approved').length;
  
  const deliverableApprovalRate = safeAllDeliverables.length > 0 
    ? Math.round((approvedDeliverables / safeAllDeliverables.length) * 100) 
    : 0;
  const nominationApprovalRate = safeAllNominations.length > 0
    ? Math.round((approvedNominations / safeAllNominations.length) * 100)
    : 0;

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

  // Show error state
  if (hasError) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">
            {partnersError && `Partners: ${partnersError.message}`}
            {deliverablesError && `Deliverables: ${deliverablesError.message}`}
            {nominationsError && `Nominations: ${nominationsError.message}`}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
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

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border border-blue-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 group-hover:from-blue-500/10 group-hover:to-blue-600/20 transition-all duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">Active</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Partners</p>
                  <p className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent tabular-nums">{formatNumber(totalPartners)}</p>
                  <p className="text-sm text-gray-600 font-medium">Registered organizations</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border border-orange-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-600/10 group-hover:from-orange-500/10 group-hover:to-amber-600/20 transition-all duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 font-semibold">Pending</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Deliverables</p>
                  <p className="text-5xl font-bold bg-gradient-to-br from-orange-600 to-amber-500 bg-clip-text text-transparent tabular-nums">{formatNumber(pendingDeliverables)}</p>
                  <p className="text-sm text-gray-600 font-medium">{formatNumber(safeAllDeliverables.length)} total</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border border-purple-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/10 group-hover:from-purple-500/10 group-hover:to-violet-600/20 transition-all duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <Award className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200 font-semibold">Review</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Nominations</p>
                  <p className="text-5xl font-bold bg-gradient-to-br from-purple-600 to-violet-500 bg-clip-text text-transparent tabular-nums">{formatNumber(pendingNominations)}</p>
                  <p className="text-sm text-gray-600 font-medium">{formatNumber(safeAllNominations.length)} total</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03, y: -8 }}
            className="group"
          >
            <Card className="relative overflow-hidden border border-green-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/10 group-hover:from-green-500/10 group-hover:to-emerald-600/20 transition-all duration-300"></div>
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">Approved</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Approval Rate</p>
                  <p className="text-5xl font-bold bg-gradient-to-br from-green-600 to-emerald-500 bg-clip-text text-transparent tabular-nums">{deliverableApprovalRate}%</p>
                  <p className="text-sm text-gray-600 font-medium">Deliverables</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Performance Metrics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-2 border-indigo-100 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Approval Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Deliverable Approval Rate</span>
                    <span className="text-sm font-bold text-indigo-700">{deliverableApprovalRate}%</span>
                  </div>
                  <Progress value={deliverableApprovalRate} className="h-3" />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{approvedDeliverables} approved</span>
                    <span>{rejectedDeliverables} rejected</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Nomination Approval Rate</span>
                    <span className="text-sm font-bold text-purple-700">{nominationApprovalRate}%</span>
                  </div>
                  <Progress value={nominationApprovalRate} className="h-3" />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{approvedNominations} approved</span>
                    <span>{safeAllNominations.length - approvedNominations} pending/declined</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

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
