import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  FileText, 
  Award, 
  Bell, 
  CheckSquare,
  Calendar,
  TrendingUp,
  Package,
  Download,
  CreditCard,
  Lightbulb,
  MessageSquare,
  Map,
  Users,
  Star,
  Video,
  UserCircle,
  Mail,
  Phone,
  ArrowUp,
  ArrowDown,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  BarChart3,
  PieChart,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import StatsCard from "../components/dashboard/StatsCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import StatusWidgets from "../components/dashboard/StatusWidgets";
import QuickActions from "../components/dashboard/QuickActions";
import GettingStartedChecklist from "../components/dashboard/GettingStartedChecklist";
import Breadcrumbs from "../components/common/Breadcrumbs";
import AdminNotificationWidget from "../components/dashboard/AdminNotificationWidget";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

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

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Check for login mapping
  const { data: loginMapping } = useQuery({
    queryKey: ['loginMapping', user?.email],
    queryFn: async () => {
      const mappings = await base44.entities.PartnerLogin.filter({ 
        login_email: user?.email,
        status: 'active'
      });
      return mappings[0] || null;
    },
    enabled: !!user && user?.role !== 'admin' && !user?.is_super_admin,
  });

  const effectivePartnerEmail = loginMapping?.partner_email || user?.email;

  // Get partner profile with account manager info
  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', effectivePartnerEmail],
    queryFn: async () => {
      if (!user || user.role === 'admin' || user.is_super_admin) return null;
      const profiles = await base44.entities.PartnerProfile.filter({ 
        partner_email: effectivePartnerEmail 
      });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  // Admin-specific data
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role !== 'admin' && !u.is_super_admin);
    },
    enabled: !!user && (user?.role === 'admin' || user?.is_super_admin),
  });

  const { data: allDeliverables = [] } = useQuery({
    queryKey: ['allDeliverables'],
    queryFn: () => base44.entities.Deliverable.list('-created_date'),
    enabled: !!user && (user?.role === 'admin' || user?.is_super_admin),
  });

  const { data: allNominations = [] } = useQuery({
    queryKey: ['allNominations'],
    queryFn: () => base44.entities.Nomination.list('-created_date'),
    enabled: !!user && (user?.role === 'admin' || user?.is_super_admin),
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.PartnerProfile.list(),
    enabled: !!user && (user?.role === 'admin' || user?.is_super_admin),
  });

  const { data: recentActivity = [] } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 10),
    enabled: !!user && (user?.role === 'admin' || user?.is_super_admin),
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ['userDeliverables', effectivePartnerEmail],
    queryFn: () => base44.entities.Deliverable.filter({ partner_email: effectivePartnerEmail }),
    enabled: !!user && user?.role !== 'admin' && !user?.is_super_admin,
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ['userNominations', effectivePartnerEmail],
    queryFn: () => base44.entities.Nomination.filter({ partner_email: effectivePartnerEmail }),
    enabled: !!user && user?.role !== 'admin' && !user?.is_super_admin,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', effectivePartnerEmail],
    queryFn: () => base44.entities.StatusUpdate.filter({ partner_email: effectivePartnerEmail, read: false }),
    enabled: !!user && user?.role !== 'admin' && !user?.is_super_admin,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['activeReminders', effectivePartnerEmail],
    queryFn: () => base44.entities.Reminder.filter({ 
      partner_email: effectivePartnerEmail, 
      is_dismissed: false 
    }),
    enabled: !!user && user?.role !== 'admin' && !user?.is_super_admin,
  });

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;

  // Search functionality
  const searchablePages = [
    { name: "My Deliverables", url: createPageUrl("Deliverables"), icon: FileText, keywords: ["upload", "files", "documents", "deliverable"] },
    { name: "My Nominations", url: createPageUrl("Nominations"), icon: Award, keywords: ["nominate", "speakers", "startups", "workshops"] },
    { name: "Partner Hub", url: createPageUrl("PartnerHub"), icon: Package, keywords: ["hub", "profile", "contacts", "information"] },
    { name: "Timeline & Deadlines", url: createPageUrl("Calendar"), icon: Calendar, keywords: ["calendar", "events", "deadlines", "schedule", "booking"] },
    { name: "Tasks & Reminders", url: createPageUrl("Tasks"), icon: CheckSquare, keywords: ["tasks", "todo", "reminders", "checklist"] },
    { name: "My Account Manager", url: createPageUrl("AccountManager"), icon: MessageSquare, keywords: ["manager", "contact", "support", "help"] },
    { name: "Resources", url: createPageUrl("Resources"), icon: Download, keywords: ["download", "templates", "guides", "resources", "assets"] },
    { name: "SEF Access & Passes", url: createPageUrl("Passes"), icon: CreditCard, keywords: ["passes", "badges", "access", "tickets", "qr"] },
    { name: "Opportunities", url: createPageUrl("Opportunities"), icon: Lightbulb, keywords: ["opportunities", "engage", "initiatives", "collaboration"] },
    { name: "Notifications", url: createPageUrl("Notifications"), icon: Bell, keywords: ["notifications", "alerts", "updates", "messages"] },
    { name: "Media Tracker", url: createPageUrl("MediaTracker"), icon: TrendingUp, keywords: ["media", "usage", "tracking", "analytics"] },
    { name: "Event Schedule", url: createPageUrl("EventSchedule"), icon: Map, keywords: ["schedule", "program", "sessions", "agenda"] },
    { name: "Networking", url: createPageUrl("Networking"), icon: Users, keywords: ["network", "partners", "connect", "meet"] },
    { name: "Brand Assets", url: createPageUrl("BrandAssets"), icon: Star, keywords: ["brand", "logo", "assets", "identity"] },
    { name: "Training", url: createPageUrl("Training"), icon: Video, keywords: ["training", "tutorial", "learn", "guide"] },
  ];

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 1) {
      const results = searchablePages.filter(page => 
        page.name.toLowerCase().includes(query.toLowerCase()) ||
        page.keywords.some(keyword => keyword.includes(query.toLowerCase()))
      );
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  };

  if (isAdmin) {
    // Admin Dashboard Statistics
    const totalPartners = allPartners.length;
    const pendingDeliverables = allDeliverables.filter(d => d.status === 'pending_review').length;
    const approvedDeliverables = allDeliverables.filter(d => d.status === 'approved').length;
    const rejectedDeliverables = allDeliverables.filter(d => d.status === 'rejected').length;
    const pendingNominations = allNominations.filter(n => ['submitted', 'under_review'].includes(n.status)).length;
    const approvedNominations = allNominations.filter(n => n.status === 'approved').length;
    
    const totalAllocated = allProfiles.reduce((sum, p) => sum + (p.allocated_amount || 0), 0);
    const deliverableApprovalRate = allDeliverables.length > 0 
      ? Math.round((approvedDeliverables / allDeliverables.length) * 100) 
      : 0;
    const nominationApprovalRate = allNominations.length > 0
      ? Math.round((approvedNominations / allNominations.length) * 100)
      : 0;

    // Recent activity by type
    const activityTypes = recentActivity.reduce((acc, activity) => {
      acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
      return acc;
    }, {});

    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
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
                    <p className="text-sm text-gray-600 font-medium">{formatNumber(allDeliverables.length)} total</p>
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
                    <p className="text-sm text-gray-600 font-medium">{formatNumber(allNominations.length)} total</p>
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
                      <span>{allNominations.length - approvedNominations} pending/declined</span>
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
                          <Badge variant="outline" className="text-xs">
                            {activity.activity_type.replace(/_/g, ' ')}
                          </Badge>
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
          <QuickActions isAdmin={isAdmin} />
        </motion.div>
      </div>
    );
  }

  const pendingDeliverables = deliverables.filter(d => d.status === 'pending_review').length;
  const approvedDeliverables = deliverables.filter(d => d.status === 'approved').length;
  const pendingNominations = nominations.filter(n => n.status === 'submitted' || n.status === 'under_review').length;
  const approvedNominations = nominations.filter(n => n.status === 'approved').length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Breadcrumbs />

        {/* Welcome Header with Search */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Partner'}! 👋
          </h1>
          <p className="text-gray-600 mb-6">Here's what's happening with your partnership</p>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search for pages, features, or actions..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 text-lg shadow-md border-orange-200 focus:border-orange-500 focus:ring-orange-500"
            />
            {searchResults.length > 0 && (
              <Card className="absolute w-full mt-2 z-10 shadow-xl border-orange-200">
                <CardContent className="p-2">
                  {searchResults.map((result) => (
                    <Link key={result.url} to={result.url} onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}>
                      <div className="flex items-center gap-3 p-3 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors">
                        <result.icon className="w-5 h-5 text-orange-600" />
                        <span className="font-medium">{result.name}</span>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Account Manager Card - PROMINENT DISPLAY */}
        {profile?.account_manager_name && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-700 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <UserCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-700 mb-1">Your Dedicated Account Manager</p>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{profile.account_manager_name}</h3>
                    <div className="flex flex-wrap gap-4">
                      {profile.account_manager_email && (
                        <a 
                          href={`mailto:${profile.account_manager_email}`}
                          className="flex items-center gap-2 text-sm text-orange-700 hover:text-orange-800 hover:underline font-medium"
                        >
                          <Mail className="w-4 h-4" />
                          {profile.account_manager_email}
                        </a>
                      )}
                      {profile.account_manager_phone && (
                        <a 
                          href={`tel:${profile.account_manager_phone}`}
                          className="flex items-center gap-2 text-sm text-orange-700 hover:text-orange-800 hover:underline font-medium"
                        >
                          <Phone className="w-4 h-4" />
                          {profile.account_manager_phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <Link to={createPageUrl("AccountManager")}>
                    <Button className="bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 shadow-lg">
                      View Full Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Getting Started Checklist - Only for new partners */}
        {(deliverables.length === 0 || nominations.length === 0) && (
          <div className="mb-8">
            <GettingStartedChecklist user={user} />
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Deliverables"
            value={deliverables.length}
            subtitle={`${approvedDeliverables} approved`}
            icon={FileText}
            gradient="from-blue-500 to-blue-600"
            link={createPageUrl("Deliverables")}
          />
          <StatsCard
            title="Total Nominations"
            value={nominations.length}
            subtitle={`${approvedNominations} approved`}
            icon={Award}
            gradient="from-purple-500 to-violet-600"
            link={createPageUrl("Nominations")}
          />
          <StatsCard
            title="Notifications"
            value={notifications.length}
            subtitle="Unread messages"
            icon={Bell}
            gradient="from-orange-500 to-amber-600"
            link={createPageUrl("Notifications")}
            badge={notifications.length > 0}
          />
          <StatsCard
            title="Active Tasks"
            value={reminders.length}
            subtitle="Pending reminders"
            icon={CheckSquare}
            gradient="from-green-500 to-emerald-600"
            link={createPageUrl("Tasks")}
            badge={reminders.length > 0}
          />
        </div>

        {/* Status Widgets */}
        <StatusWidgets 
          user={user}
          isAdmin={isAdmin}
        />

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions isAdmin={isAdmin} />
        </div>

        {/* Recent Activity */}
        <RecentActivity deliverables={deliverables} nominations={nominations} />
      </motion.div>
    </div>
  );
}