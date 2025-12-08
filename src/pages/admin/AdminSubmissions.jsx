import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { partnerSubmissionsService, partnersService, activityLogService, notificationsService } from "@/services/supabaseService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Clock, CheckCircle, XCircle, Loader2, FileText, AlertTriangle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SubmissionCard from "@/components/submissions/SubmissionCard";
import RejectionModal from "@/components/submissions/RejectionModal";

export default function AdminSubmissions() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending_review");
  const [rejectionModal, setRejectionModal] = useState({ open: false, submission: null, mode: 'reject' });

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // Fetch all submissions
  const { data: allSubmissions = [], isLoading } = useQuery({
    queryKey: ['allSubmissions'],
    queryFn: async () => {
      try {
        return await partnerSubmissionsService.getAll();
      } catch (error) {
        console.error('Error fetching all submissions:', error);
        return [];
      }
    },
    enabled: isAdmin,
  });

  // Fetch all partners for name mapping (superadmin sees all, admin sees only assigned)
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners', role, user?.id],
    queryFn: async () => partnersService.getAll({
      role: role || undefined,
      currentUserAuthId: user?.id || undefined,
    }),
    enabled: isAdmin,
  });

  // Create partner map
  const partnerMap = useMemo(() => {
    const map = {};
    allPartners.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [allPartners]);

  // Approve submission mutation
  const approveMutation = useMutation({
    mutationFn: async (submissionId) => {
      const updates = {
        status: 'approved',
        reviewed_by: user?.partner_user?.id,
      };
      const submission = await partnerSubmissionsService.update(submissionId, updates);
      
      // Also update the deliverable status
      if (submission.deliverable_id) {
        const { deliverablesService } = await import('@/services/supabaseService');
        await deliverablesService.update(submission.deliverable_id, { status: 'Approved' });
      }
      
      return submission;
    },
    onSuccess: async (submission) => {
      toast.success('Submission approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProgress'] });
      
      // Log activity
      try {
        if (activityLogService && submission.partner_id && user?.partner_user?.id) {
          await activityLogService.create({
            partner_id: submission.partner_id,
            user_id: user.partner_user.id,
            activity_type: 'submission_approved',
            description: `Submission approved: "${submission.file_name}"`,
            metadata: {
              submission_id: submission.id,
              deliverable_id: submission.deliverable_id,
            }
          });
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      // Send notification to partner
      try {
        const deliverable = submission.deliverables;
        await notificationsService.create({
          partner_id: submission.partner_id,
          type: 'success',
          title: 'Submission Approved',
          message: `Your submission for "${deliverable?.name || submission.file_name}" has been approved.`,
          metadata: {
            submission_id: submission.id,
            deliverable_id: submission.deliverable_id,
            deliverable_name: deliverable?.name,
          }
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    },
    onError: (error) => {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve submission. Please try again.');
    },
  });

  // Reject submission mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ submissionId, rejectionReason }) => {
      const updates = {
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_by: user?.partner_user?.id,
      };
      const submission = await partnerSubmissionsService.update(submissionId, updates);
      
      // Also update the deliverable status
      if (submission.deliverable_id) {
        const { deliverablesService } = await import('@/services/supabaseService');
        await deliverablesService.update(submission.deliverable_id, { status: 'Rejected' });
      }
      
      return submission;
    },
    onSuccess: async (submission) => {
      toast.success('Submission rejected');
      setRejectionModal({ open: false, submission: null });
      queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProgress'] });
      
      // Log activity
      try {
        if (activityLogService && submission.partner_id && user?.partner_user?.id) {
          await activityLogService.create({
            partner_id: submission.partner_id,
            user_id: user.partner_user.id,
            activity_type: 'submission_rejected',
            description: `Submission rejected: "${submission.file_name}"`,
            metadata: {
              submission_id: submission.id,
              deliverable_id: submission.deliverable_id,
              rejection_reason: submission.rejection_reason,
            }
          });
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      // Send notification to partner
      try {
        const deliverable = submission.deliverables;
        await notificationsService.create({
          partner_id: submission.partner_id,
          type: 'error',
          title: 'Submission Rejected',
          message: `Your submission for "${deliverable?.name || submission.file_name}" was rejected. ${submission.rejection_reason ? `Reason: ${submission.rejection_reason}` : ''}`,
          metadata: {
            submission_id: submission.id,
            deliverable_id: submission.deliverable_id,
            deliverable_name: deliverable?.name,
            rejection_reason: submission.rejection_reason,
          }
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    },
    onError: (error) => {
      console.error('Error rejecting submission:', error);
      toast.error('Failed to reject submission. Please try again.');
    },
  });

  const requestChangesMutation = useMutation({
    mutationFn: async ({ submissionId, reason }) => {
      const updates = {
        status: 'changes_requested',
        review_notes: reason,
        reviewed_by: user?.partner_user?.id,
      };
      const submission = await partnerSubmissionsService.update(submissionId, updates);

      if (submission.deliverable_id) {
        const { deliverablesService } = await import('@/services/supabaseService');
        await deliverablesService.update(submission.deliverable_id, { status: 'Pending Review' });
      }

      return submission;
    },
    onSuccess: async (submission) => {
      toast.success('Changes requested');
      setRejectionModal({ open: false, submission: null, mode: 'reject' });
      queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProgress'] });

      try {
        if (activityLogService && submission.partner_id && user?.partner_user?.id) {
          await activityLogService.create({
            partner_id: submission.partner_id,
            user_id: user.partner_user.id,
            activity_type: 'submission_changes_requested',
            description: `Changes requested: "${submission.file_name}"`,
            metadata: {
              submission_id: submission.id,
              deliverable_id: submission.deliverable_id,
              review_notes: submission.review_notes,
            }
          });
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      // Send notification to partner
      try {
        const deliverable = submission.deliverables;
        await notificationsService.create({
          partner_id: submission.partner_id,
          type: 'warning',
          title: 'Changes Requested',
          message: `Changes have been requested for your submission "${deliverable?.name || submission.file_name}". Please review the feedback and resubmit.`,
          metadata: {
            submission_id: submission.id,
            deliverable_id: submission.deliverable_id,
            deliverable_name: deliverable?.name,
            review_notes: submission.review_notes,
          }
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }
    },
    onError: (error) => {
      console.error('Error requesting changes:', error);
      toast.error('Failed to request changes. Please try again.');
    },
  });

  const handleApprove = (submissionId) => {
    approveMutation.mutate(submissionId);
  };

  const handleReject = (submission) => {
    setRejectionModal({ open: true, submission, mode: 'reject' });
  };

  const handleRequestChanges = (submission) => {
    setRejectionModal({ open: true, submission, mode: 'changes' });
  };

  const handleRejectConfirm = (rejectionReason) => {
    if (rejectionModal.submission) {
      if (rejectionModal.mode === 'changes') {
        requestChangesMutation.mutate({
          submissionId: rejectionModal.submission.id,
          reason: rejectionReason,
        });
      } else {
        rejectMutation.mutate({
          submissionId: rejectionModal.submission.id,
          rejectionReason,
        });
      }
    }
  };

  const normalizeStatus = (status) => {
    if (status === 'pending') return 'pending_review';
    return status;
  };

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = allSubmissions;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const deliverable = s.deliverables;
        const partner = partnerMap[s.partner_id];
        return (
          deliverable?.name?.toLowerCase().includes(query) ||
          s.file_name?.toLowerCase().includes(query) ||
          partner?.name?.toLowerCase().includes(query) ||
          s.submitted_by_user?.full_name?.toLowerCase().includes(query) ||
          s.submitted_by_user?.email?.toLowerCase().includes(query)
        );
      });
    }

    // Filter by status
    if (activeTab !== 'all') {
      filtered = filtered.filter(s => normalizeStatus(s.status) === activeTab);
    }

    // Sort: pending first, then by created_at desc
    return filtered.sort((a, b) => {
      const aStatus = normalizeStatus(a.status);
      const bStatus = normalizeStatus(b.status);
      if (aStatus === 'pending_review' && bStatus !== 'pending_review') return -1;
      if (aStatus !== 'pending_review' && bStatus === 'pending_review') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [allSubmissions, searchQuery, activeTab, partnerMap]);

  const getStatusCount = (status) => {
    return allSubmissions.filter(s => normalizeStatus(s.status) === status).length;
  };

  const isProcessing = approveMutation.isPending || rejectMutation.isPending || requestChangesMutation.isPending;

  const statusTabs = [
    { key: 'all', label: `All (${allSubmissions.length})`, icon: FileText },
    { key: 'pending_review', label: `Pending (${getStatusCount('pending_review')})`, icon: Clock },
    { key: 'under_review', label: `Under Review (${getStatusCount('under_review')})`, icon: Clock },
    { key: 'changes_requested', label: `Changes (${getStatusCount('changes_requested')})`, icon: AlertTriangle },
    { key: 'approved', label: `Approved (${getStatusCount('approved')})`, icon: CheckCircle },
    { key: 'rejected', label: `Rejected (${getStatusCount('rejected')})`, icon: XCircle },
    { key: 'locked_for_printing', label: `Locked (${getStatusCount('locked_for_printing')})`, icon: Lock },
  ];

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submissions Review</h1>
          <p className="text-gray-600">
            Review and approve partner submissions ({allSubmissions.length} total)
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 border-orange-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by deliverable name, partner, file name, or submitter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {statusTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Submissions Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : activeTab === 'pending_review'
                  ? "No pending submissions at this time"
                  : "No submissions match the selected filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredSubmissions.map((submission) => {
                const partner = partnerMap[submission.partner_id];
                return (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    partnerName={partner?.name}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestChanges={handleRequestChanges}
                    isProcessing={isProcessing}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Rejection Modal */}
        <RejectionModal
          open={rejectionModal.open}
          onClose={() => setRejectionModal({ open: false, submission: null, mode: 'reject' })}
          onSubmit={handleRejectConfirm}
          isSubmitting={rejectMutation.isPending || requestChangesMutation.isPending}
          submissionName={rejectionModal.submission?.deliverables?.name || rejectionModal.submission?.file_name}
        />
      </motion.div>
    </div>
  );
}

