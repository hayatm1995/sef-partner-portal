import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  partnerProgressService, 
  deliverablesService 
} from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Award, 
  Briefcase, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  UserCircle,
  ArrowRight,
  Upload,
  TrendingUp,
  Building2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function PartnerDashboard() {
  const { user, partner } = useAuth();
  const navigate = useNavigate();

  const partnerId = user?.partner_id || partner?.id;

  // Fetch partner progress
  const { data: progress, isLoading: loadingProgress } = useQuery({
    queryKey: ['partnerProgress', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      return partnerProgressService.getByPartnerId(partnerId);
    },
    enabled: !!partnerId,
  });

  // Fetch next 3 deliverables sorted by due_date
  const { data: upcomingDeliverables = [], isLoading: loadingDeliverables } = useQuery({
    queryKey: ['upcomingDeliverables', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      const all = await deliverablesService.getAll(partnerId);
      // Sort by due_date, filter out completed, take next 3
      return all
        .filter(d => {
          // Only show deliverables that are not approved or have no submission
          return true; // Show all for now
        })
        .sort((a, b) => {
          const dateA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          const dateB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          return dateA - dateB;
        })
        .slice(0, 3);
    },
    enabled: !!partnerId,
  });

  const progressPercentage = progress?.progress_percentage ?? 0;
  const approvedCount = progress?.approved_submissions ?? 0;
  const totalCount = progress?.total_deliverables ?? 0;

  const getStatusConfig = (deliverable) => {
    // TODO: Check submission status from partner_submissions
    // For now, return default
    return {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Clock,
      label: "Not Submitted",
      badge: "⚪ Not Submitted"
    };
  };

  // Show placeholder content for partner dashboard
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Card className="border-2 border-orange-200 shadow-xl">
          <CardContent className="p-12">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to the Partner Hub
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              More features will appear soon
            </p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => navigate('/PartnerHub')}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                Go to Partner Hub
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  // Legacy code below - keeping for reference but not rendering
  if (false && !partnerId) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card className="border-red-200">
          <CardContent className="p-12 text-center">
            <UserCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Partner Profile Found</h3>
            <p className="text-gray-600">
              Please contact the SEF team to set up your partner account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (false) return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.full_name || 'Partner'}!
          </h1>
          <p className="text-gray-600">
            Here's your partnership overview and what's coming up next.
          </p>
        </div>

        {/* Progress Header */}
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-orange-600" />
                Partnership Progress
              </CardTitle>
              <Badge variant="outline" className="bg-white text-orange-700 border-orange-300 text-lg px-4 py-1">
                {progressPercentage.toFixed(0)}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {approvedCount} of {totalCount} deliverables approved
                  </span>
                  <span className="text-sm text-gray-500">
                    {totalCount - approvedCount} remaining
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-4" />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>{approvedCount} Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span>{progress?.pending_submissions ?? 0} Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>{progress?.rejected_submissions ?? 0} Rejected</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-orange-200 hover:border-orange-300 transition-all cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Upload className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Upload Deliverable</h3>
                    <p className="text-sm text-gray-600">Submit required files</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <Button
                  className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                  onClick={() => navigate('/deliverables')}
                >
                  Go to Deliverables
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-orange-200 hover:border-orange-300 transition-all cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Award className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Submit Nomination</h3>
                    <p className="text-sm text-gray-600">Nominate speakers, startups</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <Button
                  className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                  onClick={() => navigate('/Nominations')}
                >
                  Go to Nominations
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-orange-200 hover:border-orange-300 transition-all cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Briefcase className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">Review Contract</h3>
                    <p className="text-sm text-gray-600">View partnership agreements</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
                <Button
                  className="w-full mt-4 bg-orange-600 hover:bg-orange-700"
                  onClick={() => navigate('/Contracts')}
                >
                  Go to Contracts
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDeliverables ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading deadlines...</p>
                </div>
              ) : upcomingDeliverables.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeliverables.map((deliverable) => {
                    const statusConfig = getStatusConfig(deliverable);
                    const StatusIcon = statusConfig.icon;
                    const isOverdue = deliverable.due_date && 
                      new Date(deliverable.due_date) < new Date();
                    
                    return (
                      <motion.div
                        key={deliverable.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <FileText className="w-5 h-5 text-orange-600" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{deliverable.name || deliverable.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className={`text-xs ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                                {deliverable.due_date 
                                  ? format(new Date(deliverable.due_date), 'MMM d, yyyy')
                                  : 'No due date'}
                              </span>
                              {isOverdue && (
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.badge}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-500">No upcoming deadlines</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Manager Card */}
          <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-orange-600" />
                Your Account Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partner?.assigned_account_manager ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {partner.assigned_account_manager.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{partner.assigned_account_manager}</p>
                      <p className="text-sm text-gray-600">SEF Account Manager</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-orange-200">
                    <p className="text-sm text-gray-600 mb-2">Need help?</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-orange-200 hover:bg-orange-50"
                      onClick={() => navigate('/AccountManager')}
                    >
                      Contact Manager
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No account manager assigned</p>
                  <p className="text-xs text-gray-500 mt-1">Contact SEF team for support</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}


