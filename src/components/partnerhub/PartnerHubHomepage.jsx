import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  MessageSquare,
  Scale,
  Award,
  Ticket,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  Crown,
  Sparkles,
  Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  deliverablesService,
  partnerMessagesService,
  contractsService,
  nominationsService,
  partnerSubmissionsService,
  notificationsService,
} from "@/services/supabaseService";
import { createPageUrl } from "@/utils";

export default function PartnerHubHomepage() {
  const { user, partner, partnerId } = useAuth();
  const navigate = useNavigate();

  const currentPartnerId = partnerId || partner?.id;
  const partnerName = partner?.name || user?.user_metadata?.full_name || "Partner";
  const partnerTier = partner?.tier || "Standard";
  const contractStatus = partner?.contract_status || "Pending";

  // Determine status label and color
  const getStatusConfig = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "signed" || statusLower === "active") {
      return { label: "Active", color: "bg-green-100 text-green-800" };
    }
    if (statusLower === "pending" || statusLower === "in review") {
      return { label: "Pending", color: "bg-yellow-100 text-yellow-800" };
    }
    if (statusLower === "onboarding") {
      return { label: "Onboarding", color: "bg-blue-100 text-blue-800" };
    }
    return { label: "Pending", color: "bg-gray-100 text-gray-800" };
  };

  const statusConfig = getStatusConfig(contractStatus);

  // Get tier icon
  const getTierIcon = (tier) => {
    const tierLower = (tier || "").toLowerCase();
    if (tierLower.includes("platinum") || tierLower.includes("premium")) {
      return <Crown className="w-5 h-5 text-amber-500" />;
    }
    if (tierLower.includes("gold")) {
      return <Sparkles className="w-5 h-5 text-yellow-500" />;
    }
    return <Award className="w-5 h-5 text-gray-500" />;
  };

  // Fetch pending deliverables
  const { data: deliverablesData = [], isLoading: loadingDeliverables } = useQuery({
    queryKey: ['partnerHubDeliverables', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return [];
      try {
        const deliverables = await deliverablesService.getAll({ partnerId: currentPartnerId });
        const submissions = await partnerSubmissionsService.getByPartnerId(currentPartnerId);
        
        // Map submissions to deliverables
        const submissionsMap = {};
        submissions.forEach(s => {
          submissionsMap[s.deliverable_id] = s;
        });
        
        return deliverables.map(d => ({
          ...d,
          submission: submissionsMap[d.id],
          status: submissionsMap[d.id]?.status || 'not_submitted'
        }));
      } catch (error) {
        console.error('[PartnerHubHomepage] Error fetching deliverables:', error);
        return [];
      }
    },
    enabled: !!currentPartnerId,
    retry: 1,
  });

  const pendingDeliverablesCount = deliverablesData.filter(d => 
    ['not_submitted', 'submitted', 'pending_review'].includes(d.status)
  ).length;

  // Fetch unread messages
  const { data: unreadMessagesCount = 0, isLoading: loadingMessages } = useQuery({
    queryKey: ['partnerHubMessages', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return 0;
      try {
        return await partnerMessagesService.getUnreadCount(currentPartnerId);
      } catch (error) {
        console.error('[PartnerHubHomepage] Error fetching messages:', error);
        return 0;
      }
    },
    enabled: !!currentPartnerId,
    retry: 1,
  });

  // Fetch contracts
  const { data: contractsData = [], isLoading: loadingContracts } = useQuery({
    queryKey: ['partnerHubContracts', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return [];
      try {
        return await contractsService.getByPartnerId(currentPartnerId);
      } catch (error) {
        console.error('[PartnerHubHomepage] Error fetching contracts:', error);
        return [];
      }
    },
    enabled: !!currentPartnerId,
    retry: 1,
  });

  const contractStatusCounts = {
    pending: contractsData.filter(c => c.status === 'draft' || c.status === 'sent').length,
    active: contractsData.filter(c => c.status === 'signed' || c.status === 'approved').length,
    rejected: contractsData.filter(c => c.status === 'rejected').length,
  };

  // Fetch nominations
  const { data: nominationsData = [], isLoading: loadingNominations } = useQuery({
    queryKey: ['partnerHubNominations', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return [];
      try {
        return await nominationsService.getAll({ partnerId: currentPartnerId });
      } catch (error) {
        console.error('[PartnerHubHomepage] Error fetching nominations:', error);
        return [];
      }
    },
    enabled: !!currentPartnerId,
    retry: 1,
  });

  const nominationsCount = nominationsData.length;
  const pendingNominationsCount = nominationsData.filter(n => 
    ['Submitted', 'Under Review', 'submitted', 'under_review'].includes(n.status)
  ).length;

  // Fetch VIP invitations (placeholder - need to check if service exists)
  const { data: vipInvitationsCount = 0, isLoading: loadingVIP } = useQuery({
    queryKey: ['partnerHubVIP', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return 0;
      try {
        // TODO: Replace with actual VIP invitations service when available
        // For now, return 0
        return 0;
      } catch (error) {
        console.error('[PartnerHubHomepage] Error fetching VIP invitations:', error);
        return 0;
      }
    },
    enabled: !!currentPartnerId,
    retry: 1,
  });

  // Fetch recent notifications (last 5)
  const { data: recentNotifications = [], isLoading: loadingNotifications } = useQuery({
    queryKey: ['partnerHubNotifications', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return [];
      try {
        const allNotifications = await notificationsService.getByPartnerId(currentPartnerId, false);
        return allNotifications.slice(0, 5); // Get last 5
      } catch (error) {
        console.error('[PartnerHubHomepage] Error fetching notifications:', error);
        return [];
      }
    },
    enabled: !!currentPartnerId,
    retry: 1,
  });

  const unreadNotificationsCount = recentNotifications.filter(n => !n.read).length;

  const isLoading = loadingDeliverables || loadingMessages || loadingContracts || loadingNominations || loadingVIP || loadingNotifications;
  const hasData = pendingDeliverablesCount > 0 || unreadMessagesCount > 0 || contractsData.length > 0 || nominationsCount > 0 || vipInvitationsCount > 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Box */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-2xl font-bold">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Welcome back, {partnerName}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-2">
                      {getTierIcon(partnerTier)}
                      <span className="text-sm font-medium text-gray-700">{partnerTier}</span>
                    </div>
                    <Badge className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Notifications Banner */}
      {recentNotifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Recent Notifications
                  {unreadNotificationsCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadNotificationsCount} new
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(createPageUrl("Notifications"))}
                >
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentNotifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read
                        ? 'bg-white border-gray-200'
                        : 'bg-blue-100 border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm text-gray-900">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dashboard Widgets */}
      {hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* My Deliverables */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("Deliverables"))}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    My Deliverables
                  </CardTitle>
                  {pendingDeliverablesCount > 0 && (
                    <Badge variant="destructive">{pendingDeliverablesCount}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{pendingDeliverablesCount}</p>
                <p className="text-sm text-gray-600 mt-1">Pending items</p>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View Deliverables <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Support Messages */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("Messages"))}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    Support Messages
                  </CardTitle>
                  {unreadMessagesCount > 0 && (
                    <Badge variant="destructive">{unreadMessagesCount}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{unreadMessagesCount}</p>
                <p className="text-sm text-gray-600 mt-1">Unread messages</p>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View Messages <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contracts */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("Contracts"))}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" />
                    Contracts
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {contractStatusCounts.active}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {contractStatusCounts.pending}
                    </Badge>
                  </div>
                  {contractStatusCounts.rejected > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Rejected</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {contractStatusCounts.rejected}
                      </Badge>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  View Contracts <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Nominations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(createPageUrl("Nominations"))}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    Nominations
                  </CardTitle>
                  {nominationsCount > 0 && (
                    <Badge>{nominationsCount}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-gray-900">{nominationsCount}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {pendingNominationsCount > 0 ? `${pendingNominationsCount} pending review` : "Total nominations"}
                </p>
                <Button variant="ghost" size="sm" className="mt-4 w-full">
                  Review <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* VIP Invitations */}
          {vipInvitationsCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                const url = createPageUrl("PartnerHub");
                navigate(`${url}?tab=vip`);
              }}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-rose-600" />
                      VIP Invitations
                    </CardTitle>
                    <Badge>{vipInvitationsCount}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-gray-900">{vipInvitationsCount}</p>
                  <p className="text-sm text-gray-600 mt-1">Invitations</p>
                  <Button variant="ghost" size="sm" className="mt-4 w-full">
                    View Invitations <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      ) : (
        /* Onboarding CTA */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Complete your Deliverables to get started
                </h3>
                <p className="text-gray-600 mb-6">
                  Start by completing your required deliverables to unlock all features of your partner portal.
                </p>
                <Button
                  onClick={() => navigate(createPageUrl("Deliverables"))}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  View Deliverables
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

