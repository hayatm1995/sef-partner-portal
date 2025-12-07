import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  partnersService,
  deliverablesService,
  nominationsService,
  partnerSubmissionsService,
  partnerProgressService,
  activityLogService,
} from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  UserCheck,
  FileText,
  Award,
  Image as ImageIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Upload,
  Eye,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

// Format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
};

interface AdminDashboardMetricsProps {
  isSuperAdmin?: boolean;
  assignedPartners?: string[]; // Partner IDs assigned to admin
}

export default function AdminDashboardMetrics({
  isSuperAdmin = false,
  assignedPartners = [],
}: AdminDashboardMetricsProps) {
  const { user, role } = useAuth();

  // Determine if we should filter by assigned partners
  const shouldFilterByAssigned = !isSuperAdmin && assignedPartners.length > 0;

  // Fetch all partners (filtered by assigned if admin)
  const { data: allPartners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['dashboardPartners', isSuperAdmin, assignedPartners],
    queryFn: async () => {
      try {
        const partners = await partnersService.getAll();
        if (shouldFilterByAssigned) {
          return partners.filter(p => assignedPartners.includes(p.id));
        }
        return partners || [];
      } catch (error) {
        console.error('[AdminDashboardMetrics] Error fetching partners:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
  });

  // Fetch all deliverables (filtered by assigned partners if admin)
  const { data: allDeliverables = [], isLoading: loadingDeliverables } = useQuery({
    queryKey: ['dashboardDeliverables', isSuperAdmin, assignedPartners],
    queryFn: async () => {
      try {
        const deliverables = await deliverablesService.getAll();
        if (shouldFilterByAssigned) {
          return deliverables.filter(d => assignedPartners.includes(d.partner_id));
        }
        return deliverables || [];
      } catch (error) {
        console.error('[AdminDashboardMetrics] Error fetching deliverables:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 30000,
    retry: 1,
  });

  // Fetch all submissions (filtered by assigned partners if admin)
  const { data: allSubmissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['dashboardSubmissions', isSuperAdmin, assignedPartners],
    queryFn: async () => {
      try {
        const submissions = await partnerSubmissionsService.getAll();
        if (shouldFilterByAssigned) {
          return submissions.filter(s => assignedPartners.includes(s.partner_id));
        }
        return submissions || [];
      } catch (error) {
        console.error('[AdminDashboardMetrics] Error fetching submissions:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 30000,
    retry: 1,
  });

  // Fetch all nominations (filtered by assigned partners if admin)
  const { data: allNominations = [], isLoading: loadingNominations } = useQuery({
    queryKey: ['dashboardNominations', isSuperAdmin, assignedPartners],
    queryFn: async () => {
      try {
        const nominations = await nominationsService.getAll();
        if (shouldFilterByAssigned) {
          return nominations.filter(n => assignedPartners.includes(n.partner_id));
        }
        return nominations;
      } catch (error) {
        console.error('[AdminDashboardMetrics] Error fetching nominations:', error);
        return []; // Return empty array on error (non-critical)
      }
    },
    staleTime: 30000,
  });

  // Fetch all partner progress (filtered by assigned partners if admin)
  const { data: allProgress = [], isLoading: loadingProgress } = useQuery({
    queryKey: ['dashboardProgress', isSuperAdmin, assignedPartners],
    queryFn: async () => {
      try {
        const progress = await partnerProgressService.getAll();
        if (shouldFilterByAssigned) {
          return progress.filter(p => assignedPartners.includes(p.partner_id));
        }
        return progress || [];
      } catch (error) {
        console.error('[AdminDashboardMetrics] Error fetching progress:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 30000,
    retry: 1,
  });

  // Fetch media files count (from media_tracker table)
  const { data: mediaFilesCount = 0, isLoading: loadingMedia } = useQuery({
    queryKey: ['dashboardMediaFiles', isSuperAdmin, assignedPartners],
    queryFn: async () => {
      try {
        const { supabase } = await import('@/config/supabase');
        let query = supabase
          .from('media_tracker')
          .select('id', { count: 'exact', head: true });

        if (shouldFilterByAssigned) {
          query = query.in('partner_id', assignedPartners);
        }

        const { count, error } = await query;
        if (error) {
          console.error('[AdminDashboardMetrics] Error fetching media files:', error);
          return 0; // Return 0 on error
        }
        return count || 0;
      } catch (error) {
        console.error('[AdminDashboardMetrics] Error fetching media files:', error);
        return 0; // Return 0 on error
      }
    },
    staleTime: 30000,
    retry: 1,
  });

  // Fetch recent activity (last 10)
  const { data: recentActivity = [], isLoading: loadingActivity } = useQuery({
    queryKey: ['dashboardRecentActivity', isSuperAdmin, assignedPartners],
    queryFn: async () => {
      try {
        const { supabase } = await import('@/config/supabase');
        let query = supabase
          .from('activity_log')
          .select(`
            *,
            partner:partners(id, name),
            user:partner_users(id, full_name, email)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (shouldFilterByAssigned) {
          query = query.in('partner_id', assignedPartners);
        }

        const { data, error } = await query;
        if (error) {
          console.error('[AdminDashboardMetrics] Error fetching activity:', error);
          return []; // Return empty array on error
        }
        return data || [];
      } catch (error) {
        console.error('[AdminDashboardMetrics] Error fetching activity:', error);
        return []; // Return empty array on error
      }
    },
    staleTime: 10000, // Refresh every 10 seconds for activity
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    retry: 1,
  });

  // Calculate metrics
  const metrics = useMemo(() => {
    // Total Partners (completed registration = has partner_users)
    const totalPartners = allPartners.length;

    // Active Partners (profile completed > 60%)
    const activePartners = allProgress.filter(p => (p.progress_percentage || 0) > 60).length;

    // Deliverables stats
    const deliverablesStats = {
      pending: allSubmissions.filter(s => ['submitted', 'pending_review'].includes(s.status)).length,
      approved: allSubmissions.filter(s => s.status === 'approved').length,
      rejected: allSubmissions.filter(s => s.status === 'rejected').length,
      total: allDeliverables.length,
    };

    // Nominations stats
    const nominationsStats = {
      total: allNominations.length,
      pending: allNominations.filter(n => ['submitted', 'under_review', 'pending'].includes(n.status?.toLowerCase() || '')).length,
      approved: allNominations.filter(n => n.status?.toLowerCase() === 'approved').length,
    };

    // Profile completion distribution (for bar chart)
    const completionDistribution = [
      { range: '0-20%', count: allProgress.filter(p => (p.progress_percentage || 0) <= 20).length },
      { range: '21-40%', count: allProgress.filter(p => (p.progress_percentage || 0) > 20 && (p.progress_percentage || 0) <= 40).length },
      { range: '41-60%', count: allProgress.filter(p => (p.progress_percentage || 0) > 40 && (p.progress_percentage || 0) <= 60).length },
      { range: '61-80%', count: allProgress.filter(p => (p.progress_percentage || 0) > 60 && (p.progress_percentage || 0) <= 80).length },
      { range: '81-100%', count: allProgress.filter(p => (p.progress_percentage || 0) > 80).length },
    ];

    // Deliverables workflow funnel
    const workflowFunnel = {
      uploaded: allSubmissions.length,
      inReview: allSubmissions.filter(s => ['submitted', 'pending_review'].includes(s.status)).length,
      approved: allSubmissions.filter(s => s.status === 'approved').length,
      rejected: allSubmissions.filter(s => s.status === 'rejected').length,
    };

    // Deadlines overview (by days remaining)
    const now = new Date();
    const deadlinesOverview = {
      overdue: allDeliverables.filter(d => d.due_date && new Date(d.due_date) < now).length,
      dueToday: allDeliverables.filter(d => {
        if (!d.due_date) return false;
        const due = new Date(d.due_date);
        const today = new Date();
        return due.toDateString() === today.toDateString();
      }).length,
      dueThisWeek: allDeliverables.filter(d => {
        if (!d.due_date) return false;
        const due = new Date(d.due_date);
        const daysDiff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff > 0 && daysDiff <= 7;
      }).length,
      dueLater: allDeliverables.filter(d => {
        if (!d.due_date) return false;
        const due = new Date(d.due_date);
        const daysDiff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff > 7;
      }).length,
    };

    return {
      totalPartners,
      activePartners,
      deliverablesStats,
      nominationsStats,
      mediaFilesCount,
      completionDistribution,
      workflowFunnel,
      deadlinesOverview,
    };
  }, [allPartners, allProgress, allDeliverables, allSubmissions, allNominations, mediaFilesCount]);

  const isLoading =
    loadingPartners ||
    loadingDeliverables ||
    loadingSubmissions ||
    loadingNominations ||
    loadingProgress ||
    loadingMedia ||
    loadingActivity;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Partners */}
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
                <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-semibold">Total</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Partners</p>
                <p className="text-5xl font-bold bg-gradient-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent tabular-nums">
                  {formatNumber(metrics.totalPartners)}
                </p>
                <p className="text-sm text-gray-600 font-medium">Completed registration</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Active Partners */}
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
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200 font-semibold">Active</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Partners</p>
                <p className="text-5xl font-bold bg-gradient-to-br from-green-600 to-emerald-500 bg-clip-text text-transparent tabular-nums">
                  {formatNumber(metrics.activePartners)}
                </p>
                <p className="text-sm text-gray-600 font-medium">Profile &gt; 60%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Deliverables */}
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
                <p className="text-5xl font-bold bg-gradient-to-br from-orange-600 to-amber-500 bg-clip-text text-transparent tabular-nums">
                  {formatNumber(metrics.deliverablesStats.pending)}
                </p>
                <div className="flex gap-2 text-xs text-gray-600">
                  <span>{metrics.deliverablesStats.approved} approved</span>
                  <span>•</span>
                  <span>{metrics.deliverablesStats.rejected} rejected</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Nominations */}
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
                <p className="text-5xl font-bold bg-gradient-to-br from-purple-600 to-violet-500 bg-clip-text text-transparent tabular-nums">
                  {formatNumber(metrics.nominationsStats.pending)}
                </p>
                <p className="text-sm text-gray-600 font-medium">{formatNumber(metrics.nominationsStats.total)} total</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Media Files */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.03, y: -8 }}
          className="group"
        >
          <Card className="relative overflow-hidden border border-pink-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-rose-600/10 group-hover:from-pink-500/10 group-hover:to-rose-600/20 transition-all duration-300"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                  <ImageIcon className="w-7 h-7 text-white" />
                </div>
                <Badge className="bg-pink-100 text-pink-700 border-pink-200 font-semibold">Files</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Media Files</p>
                <p className="text-5xl font-bold bg-gradient-to-br from-pink-600 to-rose-500 bg-clip-text text-transparent tabular-nums">
                  {formatNumber(metrics.mediaFilesCount)}
                </p>
                <p className="text-sm text-gray-600 font-medium">Total uploaded</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Visualizations */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Completion Distribution */}
        <Card className="lg:col-span-1 border-indigo-100 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Profile Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.completionDistribution.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 font-medium">{item.range}</span>
                    <span className="text-gray-600 font-bold">{item.count}</span>
                  </div>
                  <Progress
                    value={(item.count / Math.max(metrics.totalPartners, 1)) * 100}
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deliverables Workflow Funnel */}
        <Card className="lg:col-span-1 border-teal-100 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-600" />
              Deliverables Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Uploaded</span>
                </div>
                <span className="text-lg font-bold text-blue-600">{metrics.workflowFunnel.uploaded}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">In Review</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{metrics.workflowFunnel.inReview}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Approved</span>
                </div>
                <span className="text-lg font-bold text-green-600">{metrics.workflowFunnel.approved}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">Rejected</span>
                </div>
                <span className="text-lg font-bold text-red-600">{metrics.workflowFunnel.rejected}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadlines Overview */}
        <Card className="lg:col-span-1 border-amber-100 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Deadlines Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">Overdue</span>
                </div>
                <span className="text-lg font-bold text-red-600">{metrics.deadlinesOverview.overdue}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">Due Today</span>
                </div>
                <span className="text-lg font-bold text-orange-600">{metrics.deadlinesOverview.dueToday}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Due This Week</span>
                </div>
                <span className="text-lg font-bold text-yellow-600">{metrics.deadlinesOverview.dueThisWeek}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Due Later</span>
                </div>
                <span className="text-lg font-bold text-green-600">{metrics.deadlinesOverview.dueLater}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <Card className="border-teal-100 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            Recent Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => {
                const getActivityIcon = () => {
                  const type = activity.activity_type?.toLowerCase() || '';
                  if (type.includes('profile')) return UserCheck;
                  if (type.includes('upload') || type.includes('file')) return Upload;
                  if (type.includes('nomination')) return Award;
                  if (type.includes('view') || type.includes('hub')) return Eye;
                  return Clock;
                };

                const getActivityColor = () => {
                  const type = activity.activity_type?.toLowerCase() || '';
                  if (type.includes('profile')) return 'bg-blue-100 text-blue-600';
                  if (type.includes('upload') || type.includes('file')) return 'bg-green-100 text-green-600';
                  if (type.includes('nomination')) return 'bg-purple-100 text-purple-600';
                  if (type.includes('view') || type.includes('hub')) return 'bg-teal-100 text-teal-600';
                  return 'bg-gray-100 text-gray-600';
                };

                const Icon = getActivityIcon();
                const colorClass = getActivityColor();
                const partnerName = activity.partner?.name || 'Unknown Partner';
                const userEmail = activity.user?.email || activity.user_email || 'Unknown User';

                return (
                  <motion.div
                    key={activity.id || idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {partnerName} • {userEmail}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">Activity logs will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

