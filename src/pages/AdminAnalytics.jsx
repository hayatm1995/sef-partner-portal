import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  TrendingUp, 
  Users,
  FileText,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  Activity,
  Zap,
  Star,
  MessageSquare,
  Package,
  Building2,
  Share2,
  AlertCircle
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from "framer-motion";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

export default function AdminAnalytics() {
  const [exportingExcel, setExportingExcel] = useState(false);
  const [timeRange, setTimeRange] = useState("30");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.PartnerProfile.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ['allDeliverables'],
    queryFn: () => base44.entities.Deliverable.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ['allNominations'],
    queryFn: () => base44.entities.Nomination.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => base44.entities.CalendarBooking.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: mediaUsages = [] } = useQuery({
    queryKey: ['allMediaUsages'],
    queryFn: () => base44.entities.MediaUsage.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: exhibitorStands = [] } = useQuery({
    queryKey: ['allExhibitorStands'],
    queryFn: () => base44.entities.ExhibitorStand.list(),
    enabled: user?.is_super_admin,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['allReminders'],
    queryFn: () => base44.entities.Reminder.list(),
    enabled: user?.is_super_admin,
  });

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['allActivityLogs'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 10000),
    enabled: user?.is_super_admin,
  });

  if (!user?.is_super_admin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Super Admin access required</p>
      </div>
    );
  }

  const activePartners = partners.filter(p => p.role === 'user');

  const getEngagementScore = (partner) => {
    const partnerDeliverables = deliverables.filter(d => d.partner_email === partner.email);
    const partnerNominations = nominations.filter(n => n.partner_email === partner.email);
    const partnerBookings = bookings.filter(b => b.partner_email === partner.email);
    
    const deliverableScore = Math.min(partnerDeliverables.length * 10, 40);
    const nominationScore = Math.min(partnerNominations.length * 15, 30);
    const bookingScore = Math.min(partnerBookings.length * 5, 15);
    const profileCompletion = profiles.find(p => p.partner_email === partner.email)?.profile_completion || 0;
    const profileScore = Math.min(profileCompletion * 0.15, 15);
    
    return Math.min(deliverableScore + nominationScore + bookingScore + profileScore, 100);
  };

  const packageDistribution = profiles.reduce((acc, p) => {
    const tier = p.package_tier || 'Not Set';
    acc[tier] = (acc[tier] || 0) + 1;
    return acc;
  }, {});

  const packageData = Object.entries(packageDistribution).map(([name, value]) => ({
    name,
    value,
    percentage: ((value / activePartners.length) * 100).toFixed(1)
  }));

  const deliverableStatusData = [
    { name: 'Approved', value: deliverables.filter(d => d.status === 'approved').length, color: '#10B981' },
    { name: 'Pending', value: deliverables.filter(d => d.status === 'pending_review').length, color: '#F59E0B' },
    { name: 'Revision', value: deliverables.filter(d => d.status === 'revision_needed').length, color: '#EF4444' },
    { name: 'Rejected', value: deliverables.filter(d => d.status === 'rejected').length, color: '#9CA3AF' }
  ];

  const nominationTypeData = [
    { name: 'Workshops', value: nominations.filter(n => n.nomination_type === 'workshop').length },
    { name: 'Speakers', value: nominations.filter(n => n.nomination_type === 'speaker').length },
    { name: 'Startups', value: nominations.filter(n => n.nomination_type === 'startup').length },
    { name: 'Awards', value: nominations.filter(n => n.nomination_type === 'award').length }
  ];

  const days = eachDayOfInterval({
    start: subDays(new Date(), parseInt(timeRange)),
    end: new Date()
  });

  const activityOverTime = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return {
      date: format(day, 'MMM d'),
      deliverables: deliverables.filter(d => 
        format(new Date(d.created_date), 'yyyy-MM-dd') === dayStr
      ).length,
      nominations: nominations.filter(n => 
        format(new Date(n.created_date), 'yyyy-MM-dd') === dayStr
      ).length,
      bookings: bookings.filter(b => 
        format(new Date(b.created_date), 'yyyy-MM-dd') === dayStr
      ).length
    };
  });

  const engagementLevels = activePartners.map(p => ({
    name: p.company_name || p.full_name,
    score: Math.round(getEngagementScore(p))
  })).sort((a, b) => b.score - a.score).slice(0, 10);

  const topPerformers = activePartners
    .map(partner => ({
      name: partner.full_name,
      company: partner.company_name,
      email: partner.email,
      deliverables: deliverables.filter(d => d.partner_email === partner.email).length,
      nominations: nominations.filter(n => n.partner_email === partner.email).length,
      bookings: bookings.filter(b => b.partner_email === partner.email).length,
      totalScore: getEngagementScore(partner)
    }))
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);

  // Enhanced Partner Analytics
  // Enhanced analytics with page visits and time tracking
  const getPageVisitStats = () => {
    const pageVisits = activityLogs.filter(log => log.activity_type === 'page_visit');
    const byPage = {};
    const byUser = {};
    
    pageVisits.forEach(visit => {
      // By page
      if (!byPage[visit.page_name]) {
        byPage[visit.page_name] = { visits: 0, totalTime: 0, uniqueUsers: new Set() };
      }
      byPage[visit.page_name].visits++;
      byPage[visit.page_name].totalTime += (visit.time_spent_seconds || 0);
      byPage[visit.page_name].uniqueUsers.add(visit.user_email);
      
      // By user
      if (!byUser[visit.user_email]) {
        byUser[visit.user_email] = { visits: 0, totalTime: 0, pages: new Set() };
      }
      byUser[visit.user_email].visits++;
      byUser[visit.user_email].totalTime += (visit.time_spent_seconds || 0);
      byUser[visit.user_email].pages.add(visit.page_name);
    });
    
    return { byPage, byUser };
  };

  const pageVisitStats = getPageVisitStats();

  const getPartnerAnalytics = (partner) => {
    // Activity logs for this partner
    const partnerLogs = activityLogs.filter(log => log.user_email === partner.email);
    const logins = partnerLogs.filter(log => log.activity_type === 'login');
    const pageVisits = partnerLogs.filter(log => log.activity_type === 'page_visit');
    
    // Calculate unique login sessions
    const uniqueSessions = [...new Set(logins.map(log => format(new Date(log.created_date), 'yyyy-MM-dd')))].length;
    
    // Calculate page engagement
    const pagesVisited = [...new Set(pageVisits.map(v => v.page_name))].length;
    const totalTimeSpent = pageVisits.reduce((sum, v) => sum + (v.time_spent_seconds || 0), 0);
    
    // Deliverables breakdown
    const partnerDeliverables = deliverables.filter(d => d.partner_email === partner.email);
    const approvedDeliverables = partnerDeliverables.filter(d => d.status === 'approved').length;
    const pendingDeliverables = partnerDeliverables.filter(d => d.status === 'pending_review').length;
    
    // Nominations breakdown
    const partnerNominations = nominations.filter(n => n.partner_email === partner.email);
    const approvedNominations = partnerNominations.filter(n => n.status === 'approved').length;
    
    // Bookings
    const partnerBookings = bookings.filter(b => b.partner_email === partner.email);
    const confirmedBookings = partnerBookings.filter(b => b.status === 'confirmed').length;
    
    // Last activity
    const sortedLogs = partnerLogs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    const lastActivity = sortedLogs.length > 0 ? new Date(sortedLogs[0].created_date) : null;
    const lastLogin = logins.length > 0 ? new Date(logins[0].created_date) : null;
    
    // Account age
    const accountAge = Math.floor((new Date() - new Date(partner.created_date)) / (1000 * 60 * 60 * 24));
    
    // Activity frequency
    const activeDays = [...new Set(partnerLogs.map(log => format(new Date(log.created_date), 'yyyy-MM-dd')))].length;
    
    return {
      partner,
      loginCount: logins.length,
      uniqueSessions,
      lastLogin,
      lastActivity,
      accountAge,
      activeDays,
      totalPageVisits: pageVisits.length,
      pagesVisited,
      totalTimeSpent,
      avgTimePerPage: pageVisits.length > 0 ? Math.round(totalTimeSpent / pageVisits.length) : 0,
      totalDeliverables: partnerDeliverables.length,
      approvedDeliverables,
      pendingDeliverables,
      deliverableApprovalRate: partnerDeliverables.length > 0 ? Math.round((approvedDeliverables / partnerDeliverables.length) * 100) : 0,
      totalNominations: partnerNominations.length,
      approvedNominations,
      nominationApprovalRate: partnerNominations.length > 0 ? Math.round((approvedNominations / partnerNominations.length) * 100) : 0,
      totalBookings: partnerBookings.length,
      confirmedBookings,
      engagementScore: Math.round(getEngagementScore(partner)),
      logins: logins.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    };
  };

  const enhancedPartnerAnalytics = activePartners.map(getPartnerAnalytics);

  // Exhibitor Stand Analytics
  const standAnalytics = {
    totalAssigned: exhibitorStands?.length || 0,
    notViewedRenders: (exhibitorStands || []).filter(s => {
      const partnerLogs = activityLogs.filter(log => 
        log.user_email === s.partner_email && 
        log.page_name === 'ExhibitorStand'
      );
      return partnerLogs.length === 0;
    }).length,
    notSubmittedArtwork: (exhibitorStands || []).filter(s => 
      !s.artwork_submissions || s.artwork_submissions.length === 0
    ).length,
    pendingAdminReview: (exhibitorStands || []).filter(s => 
      s.status === 'pending_admin_review'
    ).length,
    approved: (exhibitorStands || []).filter(s => 
      s.status === 'approved' || s.status === 'completed'
    ).length,
    revisionNeeded: (exhibitorStands || []).filter(s => 
      s.status === 'revision_needed'
    ).length,
    avgApprovalTime: (() => {
      const approvedStands = (exhibitorStands || []).filter(s => s.status === 'approved' || s.status === 'completed');
      if (approvedStands.length === 0) return 0;
      const times = approvedStands.map(s => {
        const firstSubmission = s.artwork_submissions?.[0]?.submitted_at;
        const approvalDate = s.revision_history?.find(r => r.status === 'approved')?.changed_at;
        if (!firstSubmission || !approvalDate) return 0;
        return (new Date(approvalDate) - new Date(firstSubmission)) / (1000 * 60 * 60 * 24);
      }).filter(t => t > 0);
      return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    })(),
    revisionCountByPartner: (exhibitorStands || []).map(s => ({
      email: s.partner_email,
      revisions: s.revision_history?.filter(r => r.status === 'revision_needed').length || 0
    })).filter(p => p.revisions > 0).sort((a, b) => b.revisions - a.revisions)
  };

  // Deliverables Analytics
  const deliverablesAnalytics = {
    byCategory: deliverables.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1;
      return acc;
    }, {}),
    pending: deliverables.filter(d => d.status === 'pending_review').length,
    approved: deliverables.filter(d => d.status === 'approved').length,
    overdue: deliverables.filter(d => {
      const deadline = reminders.find(r => 
        r.partner_email === d.partner_email && 
        r.reminder_type === 'deliverable_deadline'
      );
      return deadline && new Date(deadline.due_date) < new Date() && d.status !== 'approved';
    }).length,
    complianceByPartner: activePartners.map(p => {
      const partnerDeliverables = deliverables.filter(d => d.partner_email === p.email);
      const approved = partnerDeliverables.filter(d => d.status === 'approved').length;
      return {
        email: p.email,
        name: p.full_name,
        total: partnerDeliverables.length,
        approved,
        compliance: partnerDeliverables.length > 0 ? Math.round((approved / partnerDeliverables.length) * 100) : 0
      };
    }).sort((a, b) => b.compliance - a.compliance)
  };

  // Communication Analytics
  const communicationAnalytics = {
    totalComments: (exhibitorStands || []).reduce((sum, s) => 
      sum + (s.discussion_thread?.length || 0) + 
      (s.artwork_submissions?.reduce((aSum, sub) => aSum + (sub.comments?.length || 0), 0) || 0)
    , 0),
    approvalVsRevisions: {
      approvals: (exhibitorStands || []).filter(s => s.status === 'approved' || s.status === 'completed').length,
      revisions: (exhibitorStands || []).filter(s => s.status === 'revision_needed').length
    },
    highSupportPartners: (exhibitorStands || [])
      .map(s => ({
        email: s.partner_email,
        comments: (s.discussion_thread?.length || 0) + 
                 (s.artwork_submissions?.reduce((sum, sub) => sum + (sub.comments?.length || 0), 0) || 0),
        revisions: s.revision_history?.filter(r => r.status === 'revision_needed').length || 0
      }))
      .filter(p => p.comments > 5 || p.revisions > 2)
      .sort((a, b) => (b.comments + b.revisions * 3) - (a.comments + a.revisions * 3))
      .slice(0, 10)
  };

  const platformUsage = mediaUsages.reduce((acc, m) => {
    acc[m.platform] = (acc[m.platform] || 0) + 1;
    return acc;
  }, {});

  const platformData = Object.entries(platformUsage).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
    value
  }));

  const completionMetrics = [
    {
      category: 'Profile Completion',
      average: Math.round(activePartners.reduce((sum, p) => sum + (profiles.find(prof => prof.partner_email === p.email)?.profile_completion || 0), 0) / activePartners.length),
      target: 100
    },
    {
      category: 'Deliverables',
      average: Math.round((deliverables.filter(d => d.status === 'approved').length / (deliverables.length || 1)) * 100) || 0,
      target: 90
    },
    {
      category: 'Nominations',
      average: Math.round((nominations.filter(n => n.status === 'approved').length / (nominations.length || 1)) * 100) || 0,
      target: 80
    },
    {
      category: 'Bookings',
      average: Math.round((bookings.filter(b => b.status === 'confirmed').length / (bookings.length || 1)) * 100) || 0,
      target: 95
    }
  ];

  const exportToExcel = () => {
    setExportingExcel(true);
    
    const data = activePartners.map(partner => ({
      'Partner Name': partner.full_name,
      'Company': partner.company_name || '-',
      'Email': partner.email,
      'Package': profiles.find(p => p.partner_email === partner.email)?.package_tier || '-',
      'Account Manager': profiles.find(p => p.partner_email === partner.email)?.account_manager_name || '-',
      'Profile Completion': `${profiles.find(p => p.partner_email === partner.email)?.profile_completion || 0}%`,
      'Total Deliverables': deliverables.filter(d => d.partner_email === partner.email).length,
      'Approved Deliverables': deliverables.filter(d => d.partner_email === partner.email && d.status === 'approved').length,
      'Total Nominations': nominations.filter(n => n.partner_email === partner.email).length,
      'Approved Nominations': nominations.filter(n => n.partner_email === partner.email && n.status === 'approved').length,
      'Bookings': bookings.filter(b => b.partner_email === partner.email).length,
      'Engagement Score': Math.round(getEngagementScore(partner))
    }));

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `partner-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setExportingExcel(false);
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#60A5FA', '#A78BFA', '#F87171', '#FCD34D'];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative bg-gradient-to-br from-purple-600 via-indigo-700 to-blue-800 rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/20 rounded-full blur-2xl translate-y-48 -translate-x-48" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/40 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">Analytics Dashboard</h1>
                <p className="text-blue-100 text-lg font-medium">Comprehensive partner engagement insights</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/15 backdrop-blur-md text-white hover:bg-white/25 shadow-xl font-medium"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <Button onClick={exportToExcel} disabled={exportingExcel} variant="outline"
                className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 gap-2 shadow-xl transition-all hover:scale-105 hover:shadow-2xl font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="relative border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-blue-100 font-semibold mb-3 uppercase tracking-wider">Active Partners</p>
                    <p className="text-5xl font-black text-white mb-1">{activePartners.length}</p>
                    <p className="text-xs text-blue-100 font-medium">Total registered</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="relative border-0 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-green-100 font-semibold mb-3 uppercase tracking-wider">Total Deliverables</p>
                    <p className="text-5xl font-black text-white mb-1">{deliverables.length}</p>
                    <p className="text-xs text-green-100 font-medium">
                      {deliverables.filter(d => d.status === 'approved').length} approved
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="relative border-0 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-purple-100 font-semibold mb-3 uppercase tracking-wider">Total Nominations</p>
                    <p className="text-5xl font-black text-white mb-1">{nominations.length}</p>
                    <p className="text-xs text-purple-100 font-medium">
                      {nominations.filter(n => n.status === 'approved').length} approved
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="relative border-0 bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-orange-100 font-semibold mb-3 uppercase tracking-wider">Avg Engagement</p>
                    <p className="text-5xl font-black text-white mb-1">
                      {Math.round(activePartners.reduce((sum, p) => sum + getEngagementScore(p), 0) / activePartners.length)}%
                    </p>
                    <p className="text-xs text-orange-100 font-medium">Partner activity score</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 md:w-fit mx-auto mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2"><Activity className="w-4 h-4"/>Overview</TabsTrigger>
            <TabsTrigger value="stands" className="flex items-center gap-2"><Building2 className="w-4 h-4"/>Stands</TabsTrigger>
            <TabsTrigger value="deliverables" className="flex items-center gap-2"><FileText className="w-4 h-4"/>Deliverables</TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2"><Users className="w-4 h-4"/>Partners</TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2"><MessageSquare className="w-4 h-4"/>Communication</TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2"><Share2 className="w-4 h-4"/>Media</TabsTrigger>
          </TabsList>

          <TabsContent value="stands">
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="border-blue-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Assigned</p>
                  <p className="text-3xl font-bold text-blue-600">{standAnalytics.totalAssigned}</p>
                </CardContent>
              </Card>
              <Card className="border-orange-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Not Viewed Renders</p>
                  <p className="text-3xl font-bold text-orange-600">{standAnalytics.notViewedRenders}</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">No Artwork Submitted</p>
                  <p className="text-3xl font-bold text-yellow-600">{standAnalytics.notSubmittedArtwork}</p>
                </CardContent>
              </Card>
              <Card className="border-green-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{standAnalytics.approved}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8 border-indigo-100 shadow-xl">
              <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Stand Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { status: 'Pending Review', count: standAnalytics.notSubmittedArtwork, color: '#F59E0B' },
                    { status: 'Admin Review', count: standAnalytics.pendingAdminReview, color: '#3B82F6' },
                    { status: 'Revision Needed', count: standAnalytics.revisionNeeded, color: '#EF4444' },
                    { status: 'Approved', count: standAnalytics.approved, color: '#10B981' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="status" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {[
                        { status: 'Pending Review', count: standAnalytics.notSubmittedArtwork, color: '#F59E0B' },
                        { status: 'Admin Review', count: standAnalytics.pendingAdminReview, color: '#3B82F6' },
                        { status: 'Revision Needed', count: standAnalytics.revisionNeeded, color: '#EF4444' },
                        { status: 'Approved', count: standAnalytics.approved, color: '#10B981' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="border-purple-100 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Approval Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Avg Approval Turnaround</p>
                      <p className="text-3xl font-bold text-purple-600">{standAnalytics.avgApprovalTime} days</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Pending Admin Review</p>
                      <p className="text-2xl font-bold text-blue-600">{standAnalytics.pendingAdminReview}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Needs Revision</p>
                      <p className="text-2xl font-bold text-orange-600">{standAnalytics.revisionNeeded}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-100 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Top Revision Partners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {standAnalytics.revisionCountByPartner.slice(0, 10).map((partner, idx) => {
                      const partnerInfo = activePartners.find(p => p.email === partner.email);
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium">{partnerInfo?.full_name || partner.email}</p>
                            <p className="text-xs text-gray-500">{partner.email}</p>
                          </div>
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {partner.revisions} revisions
                          </Badge>
                        </div>
                      );
                    })}
                    {standAnalytics.revisionCountByPartner.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No revisions yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deliverables">
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card className="border-blue-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Submissions</p>
                  <p className="text-3xl font-bold text-blue-600">{deliverables.length}</p>
                </CardContent>
              </Card>
              <Card className="border-yellow-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{deliverablesAnalytics.pending}</p>
                </CardContent>
              </Card>
              <Card className="border-green-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Approved</p>
                  <p className="text-3xl font-bold text-green-600">{deliverablesAnalytics.approved}</p>
                </CardContent>
              </Card>
              <Card className="border-red-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Overdue</p>
                  <p className="text-3xl font-bold text-red-600">{deliverablesAnalytics.overdue}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8 border-cyan-100 shadow-xl">
              <CardHeader className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-600" />
                  Submissions by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(deliverablesAnalytics.byCategory).map(([name, value]) => ({
                    name: name.replace(/_/g, ' ').toUpperCase(),
                    value
                  }))} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" />
                    <YAxis dataKey="name" type="category" width={150} stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Bar dataKey="value" fill="#06B6D4" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8 border-green-100 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Partner Compliance Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {deliverablesAnalytics.complianceByPartner
                    .filter(p => p.total > 0)
                    .slice(0, 20)
                    .map((partner, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                          idx === 0 ? 'bg-yellow-500' :
                          idx === 1 ? 'bg-gray-400' :
                          idx === 2 ? 'bg-orange-600' :
                          'bg-gray-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{partner.name}</p>
                          <p className="text-xs text-gray-500">{partner.approved}/{partner.total} approved</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              partner.compliance >= 80 ? 'bg-green-500' :
                              partner.compliance >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${partner.compliance}%` }}
                          />
                        </div>
                        <Badge variant="outline" className={
                          partner.compliance >= 80 ? 'bg-green-50 text-green-700' :
                          partner.compliance >= 60 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }>
                          {partner.compliance}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication">
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Card className="border-blue-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Total Comments</p>
                  <p className="text-3xl font-bold text-blue-600">{communicationAnalytics.totalComments}</p>
                </CardContent>
              </Card>
              <Card className="border-green-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Approvals</p>
                  <p className="text-3xl font-bold text-green-600">{communicationAnalytics.approvalVsRevisions.approvals}</p>
                </CardContent>
              </Card>
              <Card className="border-orange-100">
                <CardContent className="p-6">
                  <p className="text-sm text-gray-600 mb-2">Revisions</p>
                  <p className="text-3xl font-bold text-orange-600">{communicationAnalytics.approvalVsRevisions.revisions}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8 border-purple-100 shadow-xl">
              <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  Approval vs Revision Ratio
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Approved', value: communicationAnalytics.approvalVsRevisions.approvals, color: '#10B981' },
                        { name: 'Revisions', value: communicationAnalytics.approvalVsRevisions.revisions, color: '#F59E0B' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      innerRadius={50}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {[
                        { name: 'Approved', value: communicationAnalytics.approvalVsRevisions.approvals, color: '#10B981' },
                        { name: 'Revisions', value: communicationAnalytics.approvalVsRevisions.revisions, color: '#F59E0B' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8 border-red-100 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  High Support Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Partners requiring elevated support (high comment/revision activity)</p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {communicationAnalytics.highSupportPartners.map((partner, idx) => {
                    const partnerInfo = activePartners.find(p => p.email === partner.email);
                    const supportScore = partner.comments + partner.revisions * 3;
                    return (
                      <div key={idx} className="flex justify-between items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium">{partnerInfo?.full_name || partner.email}</p>
                          <p className="text-xs text-gray-500">{partner.email}</p>
                          <div className="flex gap-3 mt-2">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {partner.comments} comments
                            </Badge>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              {partner.revisions} revisions
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">{supportScore}</p>
                          <p className="text-xs text-gray-500">support score</p>
                        </div>
                      </div>
                    );
                  })}
                  {communicationAnalytics.highSupportPartners.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No high-support partners flagged</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <Card className="mb-8 border-green-100 shadow-xl bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30">
              <CardHeader className="border-b border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  Activity Timeline - Last {timeRange} Days
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityOverTime}>
                    <defs>
                      <linearGradient id="colorDeliverables" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorNominations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Area type="monotone" dataKey="deliverables" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorDeliverables)" />
                    <Area type="monotone" dataKey="nominations" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorNominations)" />
                    <Area type="monotone" dataKey="bookings" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8 border-indigo-100 shadow-xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30">
              <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  Completion Metrics vs Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={completionMetrics}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="category" stroke="#6b7280" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                    <Radar name="Current" dataKey="average" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.6} />
                    <Radar name="Target" dataKey="target" stroke="#F59E0B" strokeWidth={2} fill="#F59E0B" fillOpacity={0.3} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partners">
            {/* New Page Analytics Section */}
            <Card className="mb-8 border-purple-100 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30">
              <CardHeader className="border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  Page Analytics - Most Visited
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(pageVisitStats.byPage)
                    .map(([name, stats]) => ({
                      name: name || 'Unknown',
                      visits: stats.visits,
                      uniqueUsers: stats.uniqueUsers.size,
                      avgTime: stats.visits > 0 ? Math.round(stats.totalTime / stats.visits) : 0
                    }))
                    .sort((a, b) => b.visits - a.visits)
                    .slice(0, 10)
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="visits" fill="#8B5CF6" name="Total Visits" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="uniqueUsers" fill="#EC4899" name="Unique Users" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8 border-cyan-100 shadow-xl bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30">
              <CardHeader className="border-b border-cyan-100 bg-gradient-to-r from-cyan-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-600" />
                  Average Time Per Page
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(pageVisitStats.byPage)
                    .map(([name, stats]) => ({
                      name: name || 'Unknown',
                      avgTime: stats.visits > 0 ? Math.round(stats.totalTime / stats.visits) : 0
                    }))
                    .filter(p => p.avgTime > 0)
                    .sort((a, b) => b.avgTime - a.avgTime)
                    .slice(0, 10)
                  } layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" label={{ value: 'Seconds', position: 'insideBottom', offset: -5 }} />
                    <YAxis dataKey="name" type="category" width={150} stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`${value}s`, 'Avg Time']}
                    />
                    <Bar dataKey="avgTime" fill="#06B6D4" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8 border-yellow-100 shadow-xl bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30">
              <CardHeader className="border-b border-yellow-100 bg-gradient-to-r from-yellow-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-yellow-600" />
                  Package Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={packageData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percentage }) => `${percentage}%`}
                      outerRadius={100}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {packageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8 border-green-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  Partner Engagement Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={engagementLevels} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                      {engagementLevels.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.score >= 80 ? '#10B981' :
                            entry.score >= 60 ? '#F59E0B' :
                            entry.score >= 40 ? '#EF4444' :
                            '#9CA3AF'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8 border-green-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Top 5 Performing Partners
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map((performer, index) => (
                    <motion.div
                      key={performer.email}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{performer.name}</p>
                          <p className="text-sm text-gray-500">{performer.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Deliverables</p>
                          <p className="text-lg font-bold text-green-600">{performer.deliverables}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Nominations</p>
                          <p className="text-lg font-bold text-purple-600">{performer.nominations}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Bookings</p>
                          <p className="text-lg font-bold text-blue-600">{performer.bookings}</p>
                        </div>
                        <div className="text-center px-4">
                          <p className="text-sm text-gray-600">Score</p>
                          <p className="text-2xl font-bold text-orange-600">{performer.totalScore}%</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8 border-green-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Comprehensive Partner Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Login tracking requires activity logging to be enabled. If login counts show 0, 
                    ensure ActivityLog records are being created on user authentication.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-3 font-semibold">Partner</th>
                        <th className="text-center p-3 font-semibold">Logins</th>
                        <th className="text-center p-3 font-semibold">Sessions</th>
                        <th className="text-center p-3 font-semibold">Page Visits</th>
                        <th className="text-center p-3 font-semibold">Time Spent</th>
                        <th className="text-center p-3 font-semibold">Last Activity</th>
                        <th className="text-center p-3 font-semibold">Deliverables</th>
                        <th className="text-center p-3 font-semibold">Nominations</th>
                        <th className="text-center p-3 font-semibold">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enhancedPartnerAnalytics
                        .sort((a, b) => b.engagementScore - a.engagementScore)
                        .map((analytics, index) => (
                        <tr key={analytics.partner.email} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium text-gray-900">{analytics.partner.company_name || analytics.partner.full_name}</p>
                              <p className="text-xs text-gray-500">{analytics.partner.email}</p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div>
                              <p className="font-bold text-blue-600">{analytics.loginCount}</p>
                              {analytics.lastLogin && (
                                <p className="text-xs text-gray-500">{format(analytics.lastLogin, 'MMM d')}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                              {analytics.uniqueSessions}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <div>
                              <p className="font-bold text-purple-600">{analytics.totalPageVisits}</p>
                              <p className="text-xs text-gray-500">{analytics.pagesVisited} pages</p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div>
                              <p className="font-bold text-cyan-600">{Math.floor(analytics.totalTimeSpent / 60)}m</p>
                              <p className="text-xs text-gray-500">{analytics.avgTimePerPage}s/page</p>
                            </div>
                          </td>
                          <td className="p-3 text-center text-xs">
                            {analytics.lastActivity ? (
                              <div>
                                <p className="font-medium">{format(analytics.lastActivity, 'MMM d, yyyy')}</p>
                                <p className="text-gray-500">{format(analytics.lastActivity, 'HH:mm')}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">No activity</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="space-y-1">
                              <p className="font-bold text-green-600">{analytics.approvedDeliverables}/{analytics.totalDeliverables}</p>
                              {analytics.totalDeliverables > 0 && (
                                <p className="text-xs text-gray-500">{analytics.deliverableApprovalRate}% approved</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="space-y-1">
                              <p className="font-bold text-purple-600">{analytics.approvedNominations}/{analytics.totalNominations}</p>
                              {analytics.totalNominations > 0 && (
                                <p className="text-xs text-gray-500">{analytics.nominationApprovalRate}% approved</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="space-y-1">
                              <p className="font-bold text-blue-600">{analytics.confirmedBookings}/{analytics.totalBookings}</p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-white ${
                              analytics.engagementScore >= 80 ? 'bg-green-500' :
                              analytics.engagementScore >= 60 ? 'bg-yellow-500' :
                              analytics.engagementScore >= 40 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}>
                              {analytics.engagementScore}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card className="border-blue-100 shadow-lg bg-gradient-to-br from-white to-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Login Frequency Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={[
                      { range: 'Never', count: enhancedPartnerAnalytics.filter(a => a.loginCount === 0).length },
                      { range: '1-5', count: enhancedPartnerAnalytics.filter(a => a.loginCount >= 1 && a.loginCount <= 5).length },
                      { range: '6-10', count: enhancedPartnerAnalytics.filter(a => a.loginCount >= 6 && a.loginCount <= 10).length },
                      { range: '11-20', count: enhancedPartnerAnalytics.filter(a => a.loginCount >= 11 && a.loginCount <= 20).length },
                      { range: '20+', count: enhancedPartnerAnalytics.filter(a => a.loginCount > 20).length }
                    ]}>
                      <defs>
                        <linearGradient id="colorLoginBar" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="range" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      />
                      <Bar dataKey="count" fill="url(#colorLoginBar)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-purple-100 shadow-lg bg-gradient-to-br from-white to-purple-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    Engagement Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'High (80-100%)', value: enhancedPartnerAnalytics.filter(a => a.engagementScore >= 80).length, color: '#10B981' },
                          { name: 'Medium (60-79%)', value: enhancedPartnerAnalytics.filter(a => a.engagementScore >= 60 && a.engagementScore < 80).length, color: '#F59E0B' },
                          { name: 'Low (40-59%)', value: enhancedPartnerAnalytics.filter(a => a.engagementScore >= 40 && a.engagementScore < 60).length, color: '#EF4444' },
                          { name: 'Very Low (<40%)', value: enhancedPartnerAnalytics.filter(a => a.engagementScore < 40).length, color: '#9CA3AF' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) => `${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        innerRadius={40}
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {[
                          { name: 'High (80-100%)', value: enhancedPartnerAnalytics.filter(a => a.engagementScore >= 80).length, color: '#10B981' },
                          { name: 'Medium (60-79%)', value: enhancedPartnerAnalytics.filter(a => a.engagementScore >= 60 && a.engagementScore < 80).length, color: '#F59E0B' },
                          { name: 'Low (40-59%)', value: enhancedPartnerAnalytics.filter(a => a.engagementScore >= 40 && a.engagementScore < 60).length, color: '#EF4444' },
                          { name: 'Very Low (<40%)', value: enhancedPartnerAnalytics.filter(a => a.engagementScore < 40).length, color: '#9CA3AF' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="nominations">
            <Card className="mb-8 border-green-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Deliverable Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deliverableStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {deliverableStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mb-8 border-green-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Nomination Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={nominationTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media">
            <Card className="mb-8 border-green-100 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-600" />
                  Media Platform Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {platformData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}