import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { analyticsService } from "@/services/analyticsService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users,
  FileText,
  Building2,
  UserCheck,
  Activity,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Loader2,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function ControlRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('name');

  // Match the same logic as Layout.jsx - superadmin is determined by superadmin or sef_admin role
  const userRole = user?.role || 'viewer';
  const isSuperAdmin = userRole === 'superadmin' || userRole === 'sef_admin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

  // Redirect if not admin (but show access denied for non-superadmin admins)
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Fetch summary KPIs
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['adminAnalytics', 'summary'],
    queryFn: () => analyticsService.getSummary(),
    enabled: isSuperAdmin && isAdmin,
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch deliverables by status
  const { data: deliverablesByStatus, isLoading: deliverablesLoading } = useQuery({
    queryKey: ['adminAnalytics', 'deliverables'],
    queryFn: () => analyticsService.getDeliverablesByStatus(),
    enabled: isSuperAdmin && isAdmin,
  });

  // Fetch stands by status
  const { data: standsByStatus, isLoading: standsLoading } = useQuery({
    queryKey: ['adminAnalytics', 'stands'],
    queryFn: () => analyticsService.getStandsByStatus(),
    enabled: isSuperAdmin && isAdmin,
  });

  // Fetch partner progress
  const { data: partnerProgress = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['adminAnalytics', 'partners'],
    queryFn: () => analyticsService.getPartnerProgress(),
    enabled: isSuperAdmin && isAdmin,
  });

  // Sort partner progress
  const sortedPartners = React.useMemo(() => {
    const sorted = [...partnerProgress];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.partnerName.localeCompare(b.partnerName));
    } else if (sortBy === 'completion') {
      sorted.sort((a, b) => b.completionPercent - a.completionPercent);
    }
    return sorted;
  }, [partnerProgress, sortBy]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Admin access required.</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Superadmin access required. Only users with superadmin role can access Control Room.</p>
      </div>
    );
  }

  const isLoading = summaryLoading || deliverablesLoading || standsLoading || partnersLoading;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Breadcrumbs */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="hover:text-gray-900 cursor-pointer">Superadmin</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Control Room</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Control Room</h1>
          <p className="text-gray-600">Key metrics and partner progress overview</p>
        </div>

        {/* KPI Cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Card 1: Total Partners */}
              <Card className="border-blue-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Partners</p>
                      <p className="text-3xl font-bold text-blue-600">{summary?.totalPartners || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Active Partner Users */}
              <Card className="border-green-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Active Partner Users</p>
                      <p className="text-3xl font-bold text-green-600">{summary?.activeUsers || 0}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <UserCheck className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Deliverables Completion */}
              <Card className="border-purple-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Deliverables Completion</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {summary?.deliverablesCompletion || 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {summary?.deliverablesApproved || 0} / {summary?.deliverablesTotal || 0} approved
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Exhibitor Stands Progress */}
              <Card className="border-orange-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Exhibitor Stands</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {summary?.boothStats?.approved || 0} / {summary?.boothStats?.total || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Approved Stands: {summary?.boothStats?.approved || 0} / Total: {summary?.boothStats?.total || 0}</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 5: BELONG+ Invitations */}
              <Card className="border-pink-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">BELONG+ Invitations</p>
                      <p className="text-3xl font-bold text-pink-600">
                        {summary?.confirmedInvites || 0} / {summary?.totalInvites || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Confirmed Invites: {summary?.confirmedInvites || 0} / Total Submitted: {summary?.totalInvites || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-pink-100 rounded-lg">
                      <UserCheck className="w-6 h-6 text-pink-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 6: New Activity This Week */}
              <Card className="border-cyan-200 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">New Activity This Week</p>
                      <p className="text-3xl font-bold text-cyan-600">{summary?.newActivity || 0}</p>
                      <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
                    </div>
                    <div className="p-3 bg-cyan-100 rounded-lg">
                      <Activity className="w-6 h-6 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Deliverables by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Deliverables by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                        <span className="font-bold">{deliverablesByStatus?.pending || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{
                            width: `${((deliverablesByStatus?.pending || 0) / 
                              ((deliverablesByStatus?.pending || 0) + 
                               (deliverablesByStatus?.under_review || 0) + 
                               (deliverablesByStatus?.approved || 0) + 
                               (deliverablesByStatus?.rejected || 0) || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Under Review</span>
                        </div>
                        <span className="font-bold">{deliverablesByStatus?.under_review || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${((deliverablesByStatus?.under_review || 0) / 
                              ((deliverablesByStatus?.pending || 0) + 
                               (deliverablesByStatus?.under_review || 0) + 
                               (deliverablesByStatus?.approved || 0) + 
                               (deliverablesByStatus?.rejected || 0) || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                        <span className="font-bold">{deliverablesByStatus?.approved || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${((deliverablesByStatus?.approved || 0) / 
                              ((deliverablesByStatus?.pending || 0) + 
                               (deliverablesByStatus?.under_review || 0) + 
                               (deliverablesByStatus?.approved || 0) + 
                               (deliverablesByStatus?.rejected || 0) || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium">Rejected</span>
                        </div>
                        <span className="font-bold">{deliverablesByStatus?.rejected || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${((deliverablesByStatus?.rejected || 0) / 
                              ((deliverablesByStatus?.pending || 0) + 
                               (deliverablesByStatus?.under_review || 0) + 
                               (deliverablesByStatus?.approved || 0) + 
                               (deliverablesByStatus?.rejected || 0) || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stands by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-orange-600" />
                    Stands by Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium">Pending</span>
                        </div>
                        <span className="font-bold">{standsByStatus?.pending || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{
                            width: `${((standsByStatus?.pending || 0) / (standsByStatus?.total || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">Review</span>
                        </div>
                        <span className="font-bold">{standsByStatus?.review || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${((standsByStatus?.review || 0) / (standsByStatus?.total || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">Approved</span>
                        </div>
                        <span className="font-bold">{standsByStatus?.approved || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${((standsByStatus?.approved || 0) / (standsByStatus?.total || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium">Rejected</span>
                        </div>
                        <span className="font-bold">{standsByStatus?.rejected || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{
                            width: `${((standsByStatus?.rejected || 0) / (standsByStatus?.total || 1)) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Partner Progress Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Partner Progress Overview
                  </CardTitle>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy('name')}
                      className={`px-3 py-1 text-sm rounded ${
                        sortBy === 'name' 
                          ? 'bg-orange-100 text-orange-700 font-medium' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Sort by Name
                    </button>
                    <button
                      onClick={() => setSortBy('completion')}
                      className={`px-3 py-1 text-sm rounded ${
                        sortBy === 'completion' 
                          ? 'bg-orange-100 text-orange-700 font-medium' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Sort by Completion %
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sortedPartners.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Partner Name</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Deliverables</TableHead>
                          <TableHead>Completion %</TableHead>
                          <TableHead>Stands</TableHead>
                          <TableHead>VIP Invites</TableHead>
                          <TableHead>Last Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedPartners.map((partner) => (
                          <TableRow key={partner.partnerId}>
                            <TableCell className="font-medium">{partner.partnerName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{partner.tier}</Badge>
                            </TableCell>
                            <TableCell>
                              {partner.deliverablesApproved} / {partner.deliverablesTotal}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      partner.completionPercent >= 80 ? 'bg-green-500' :
                                      partner.completionPercent >= 60 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${partner.completionPercent}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{partner.completionPercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {partner.boothsApproved} / {partner.boothsTotal}
                            </TableCell>
                            <TableCell>
                              {partner.vipInvitesConfirmed} / {partner.vipInvitesTotal}
                            </TableCell>
                            <TableCell>
                              {partner.lastActivity ? (
                                <span className="text-sm text-gray-600">
                                  {format(partner.lastActivity, 'MMM d, yyyy')}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">No activity</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No partner data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
    </div>
  );
}

