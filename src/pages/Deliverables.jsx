import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deliverablesService, activityLogService, partnerSubmissionsService, partnerProgressService } from "@/services/supabaseService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

import FileUploader from "../components/deliverables/FileUploader";
import DeliverableCard from "../components/deliverables/DeliverableCard";
import RejectionModal from "../components/submissions/RejectionModal";

export default function Deliverables() {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [rejectionModal, setRejectionModal] = useState({ open: false, submission: null });
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, partner } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;

  // Get viewAs parameter for admin viewing as partner
  const urlParams = new URLSearchParams(location.search);
  const viewAsPartnerId = urlParams.get('viewAs');
  const currentPartnerId = viewAsPartnerId || partner?.id;

  // Show message if partner data is not available (for non-admin users)
  if (!isAdmin && !partner && !viewAsPartnerId) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            No partner profile found. Please contact the SEF team to set up your partner account.
          </p>
        </div>
      </div>
    );
  }

  const { data: deliverables = [], isLoading, error: deliverablesError } = useQuery({
    queryKey: ['deliverables', currentPartnerId, isAdmin, viewAsPartnerId],
    queryFn: async () => {
      try {
        if (isAdmin && !viewAsPartnerId) {
          // Admin viewing all deliverables
          return await deliverablesService.getAll();
        } else if (currentPartnerId) {
          // Partner viewing their own OR admin viewing as specific partner
          return await deliverablesService.getAll(currentPartnerId);
        }
        return [];
      } catch (error) {
        console.error('Error fetching deliverables:', error);
        return []; // Return empty array on error to prevent crashes
      }
    },
    enabled: !!user && (isAdmin || !!currentPartnerId),
  });

  // Ensure deliverables is always an array
  const safeDeliverables = Array.isArray(deliverables) ? deliverables : [];

  // Fetch submissions for all deliverables
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['submissions', currentPartnerId, safeDeliverables.map(d => d.id).join(',')],
    queryFn: async () => {
      if (!currentPartnerId || safeDeliverables.length === 0) return [];
      
      try {
        // Fetch all submissions for this partner (includes deliverables relationship)
        const submissions = await partnerSubmissionsService.getByPartnerId(currentPartnerId);
        return submissions || [];
      } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }
    },
    enabled: !!user && !!currentPartnerId && safeDeliverables.length > 0,
  });

  // Create a map of deliverable_id -> latest submission
  const submissionsMap = useMemo(() => {
    const map = {};
    if (Array.isArray(allSubmissions)) {
      allSubmissions.forEach(submission => {
        const deliverableId = submission.deliverable_id;
        // Keep only the latest submission per deliverable
        if (!map[deliverableId] || new Date(submission.created_at) > new Date(map[deliverableId].created_at)) {
          map[deliverableId] = submission;
        }
      });
    }
    return map;
  }, [allSubmissions]);

  const createDeliverableMutation = useMutation({
    mutationFn: async (data) => {
      // Add partner_id to the data
      const deliverableData = {
        partner_id: currentPartnerId,
        name: data.title || data.name,
        type: data.type || 'Document',
        status: 'Pending Review',
        file_url: data.file_url,
        notes: data.notes || null,
      };
      return deliverablesService.create(deliverableData);
    },
    onSuccess: async (newDeliverable) => {
      // Log the activity
      try {
        if (activityLogService && currentPartnerId && user?.partner_user?.id) {
          await activityLogService.create({
            partner_id: currentPartnerId,
            user_id: user.partner_user.id,
            activity_type: 'deliverable_submitted',
            description: `Deliverable uploaded: "${newDeliverable.name}" (${newDeliverable.type})`,
            metadata: {
              deliverable_id: newDeliverable.id,
              deliverable_type: newDeliverable.type,
            }
          });
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      toast.success('Deliverable uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      setIsUploading(false);
    },
    onError: (error) => {
      console.error('Error creating deliverable:', error);
      toast.error('Failed to upload deliverable. Please try again.');
      setIsUploading(false);
    },
  });

  const deleteDeliverableMutation = useMutation({
    mutationFn: (id) => deliverablesService.delete(id),
    onSuccess: () => {
      toast.success('Deliverable deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
    },
    onError: (error) => {
      console.error('Error deleting deliverable:', error);
      toast.error('Failed to delete deliverable');
    },
  });

  const approveDeliverableMutation = useMutation({
    mutationFn: (id) => deliverablesService.update(id, { status: 'Approved' }),
    onSuccess: () => {
      toast.success('Deliverable approved');
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
    },
    onError: (error) => {
      console.error('Error approving deliverable:', error);
      toast.error('Failed to approve deliverable');
    },
  });

  const rejectDeliverableMutation = useMutation({
    mutationFn: (id) => deliverablesService.update(id, { status: 'Rejected' }),
    onSuccess: () => {
      toast.success('Deliverable rejected');
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
    },
    onError: (error) => {
      console.error('Error rejecting deliverable:', error);
      toast.error('Failed to reject deliverable');
    },
  });

  // Create submission mutation
  const createSubmissionMutation = useMutation({
    mutationFn: async (submissionData) => {
      return partnerSubmissionsService.create(submissionData);
    },
    onSuccess: async (newSubmission) => {
      toast.success('File uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      
      // Log activity
      try {
        if (activityLogService && currentPartnerId && user?.partner_user?.id) {
          await activityLogService.create({
            partner_id: currentPartnerId,
            user_id: user.partner_user.id,
            activity_type: 'submission_uploaded',
            description: `File uploaded for deliverable: "${newSubmission.deliverables?.name || 'Unknown'}"`,
            metadata: {
              submission_id: newSubmission.id,
              deliverable_id: newSubmission.deliverable_id,
              file_name: newSubmission.file_name,
            }
          });
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }
    },
    onError: (error) => {
      console.error('Error creating submission:', error);
      toast.error('Failed to upload file. Please try again.');
    },
  });

  // Approve submission mutation
  const approveSubmissionMutation = useMutation({
    mutationFn: async (submissionId) => {
      const updates = {
        status: 'approved',
        reviewed_by: user?.partner_user?.id,
      };
      const submission = await partnerSubmissionsService.update(submissionId, updates);
      
      // Also update the deliverable status
      if (submission.deliverable_id) {
        await deliverablesService.update(submission.deliverable_id, { status: 'Approved' });
      }
      
      return submission;
    },
    onSuccess: () => {
      toast.success('Submission approved');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProgress'] });
    },
    onError: (error) => {
      console.error('Error approving submission:', error);
      toast.error('Failed to approve submission');
    },
  });

  // Reject submission mutation
  const rejectSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, rejectionReason }) => {
      const updates = {
        status: 'rejected',
        rejection_reason: rejectionReason || 'Rejected by admin',
        reviewed_by: user?.partner_user?.id,
      };
      const submission = await partnerSubmissionsService.update(submissionId, updates);
      
      // Also update the deliverable status
      if (submission.deliverable_id) {
        await deliverablesService.update(submission.deliverable_id, { status: 'Rejected' });
      }
      
      return submission;
    },
    onSuccess: () => {
      toast.success('Submission rejected');
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProgress'] });
    },
    onError: (error) => {
      console.error('Error rejecting submission:', error);
      toast.error('Failed to reject submission');
    },
  });

  const handleSubmissionSuccess = async (submissionData) => {
    createSubmissionMutation.mutate(submissionData);
  };

  const handleApproveSubmission = (submissionId) => {
    if (submissionId) {
      approveSubmissionMutation.mutate(submissionId);
    }
  };

  const handleRejectSubmission = (submission) => {
    if (submission) {
      setRejectionModal({ open: true, submission });
    }
  };

  const handleRejectConfirm = (rejectionReason) => {
    if (rejectionModal.submission) {
      rejectSubmissionMutation.mutate({
        submissionId: rejectionModal.submission.id,
        rejectionReason,
      });
    }
  };

  const handleUpload = async (formData) => {
    createDeliverableMutation.mutate(formData);
  };

  // Fetch progress from view
  const { data: partnerProgress, isLoading: loadingProgress } = useQuery({
    queryKey: ['partnerProgress', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return null;
      try {
        return await partnerProgressService.getByPartnerId(currentPartnerId);
      } catch (error) {
        console.error('Error fetching partner progress:', error);
        return null;
      }
    },
    enabled: !!user && !!currentPartnerId,
  });

  // Use progress from view, fallback to calculated if view not available
  const progressPercentage = partnerProgress?.progress_percentage ?? 
    (safeDeliverables.length > 0 
      ? Math.round((safeDeliverables.filter(d => {
          const submission = submissionsMap[d.id];
          return submission?.status === 'approved';
        }).length / safeDeliverables.length) * 100)
      : 0);

  // Map database status to UI status
  const mapStatus = (dbStatus) => {
    const statusMap = {
      'Pending Review': 'pending_review',
      'Approved': 'approved',
      'Rejected': 'rejected',
    };
    return statusMap[dbStatus] || dbStatus;
  };

  // Filter deliverables by submission status (if submissions exist) or deliverable status
  const filteredDeliverables = activeTab === "all" 
    ? safeDeliverables 
    : safeDeliverables.filter(d => {
        const submission = submissionsMap[d.id];
        if (submission) {
          // Use submission status if submission exists
          return submission.status === activeTab;
        } else {
          // Fall back to deliverable status if no submission
          // Map deliverable status to submission status for filtering
          if (activeTab === 'pending') {
            return d.status === 'Pending Review' || !d.file_url;
          } else if (activeTab === 'approved') {
            return d.status === 'Approved';
          } else if (activeTab === 'rejected') {
            return d.status === 'Rejected';
          }
          return false;
        }
      });

  const getStatusCount = (uiStatus) => {
    if (uiStatus === 'all') return safeDeliverables.length;
    
    return safeDeliverables.filter(d => {
      const submission = submissionsMap[d.id];
      if (submission) {
        return submission.status === uiStatus;
      } else {
        // Count deliverables without submissions based on deliverable status
        if (uiStatus === 'pending') {
          return d.status === 'Pending Review' || !d.file_url;
        } else if (uiStatus === 'approved') {
          return d.status === 'Approved';
        } else if (uiStatus === 'rejected') {
          return d.status === 'Rejected';
        }
        return false;
      }
    }).length;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deliverables...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state gracefully
  if (deliverablesError && safeDeliverables.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Error loading deliverables. Please try again later.</p>
          </div>
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deliverables</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin && !viewAsPartnerId
                ? `All partner deliverables (${safeDeliverables.length} total)` 
                : `Upload and manage your files and documents (${progressPercentage}% complete)`}
            </p>
            {!isAdmin && safeDeliverables.length > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {partnerProgress?.approved_submissions ?? safeDeliverables.filter(d => {
                    const submission = submissionsMap[d.id];
                    return submission?.status === 'approved';
                  }).length} of {partnerProgress?.total_deliverables ?? safeDeliverables.length} deliverables approved
                </p>
              </div>
            )}
          </div>
          {(!isAdmin || viewAsPartnerId) && (
            <Button
              onClick={() => setIsUploading(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New File
            </Button>
          )}
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {isUploading && (
            <FileUploader
              onClose={() => setIsUploading(false)}
              onUpload={handleUpload}
              isLoading={createDeliverableMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Filters */}
        <Card className="mb-6 border-orange-100 shadow-md">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2">
                <TabsTrigger value="all" className="gap-2">
                  All ({safeDeliverables.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({getStatusCount('pending')})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approved ({getStatusCount('approved')})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="w-4 h-4" />
                  Rejected ({getStatusCount('rejected')})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Deliverables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredDeliverables.map((deliverable) => {
              const submission = submissionsMap[deliverable.id] || null;
              return (
                <DeliverableCard
                  key={deliverable.id}
                  deliverable={deliverable}
                  submission={submission}
                  onDelete={() => deleteDeliverableMutation.mutate(deliverable.id)}
                  onApprove={isAdmin && submission ? () => handleApproveSubmission(submission.id) : undefined}
                  onReject={isAdmin && submission ? () => handleRejectSubmission(submission) : undefined}
                  isProcessing={approveSubmissionMutation.isPending || rejectSubmissionMutation.isPending}
                  isAdmin={isAdmin && !viewAsPartnerId}
                  partnerId={currentPartnerId}
                  userId={user?.partner_user?.id || user?.id}
                  onSubmissionSuccess={handleSubmissionSuccess}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {filteredDeliverables.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No deliverables found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === "all" 
                ? isAdmin && !viewAsPartnerId
                  ? "No deliverables have been uploaded by any partner yet"
                  : "Upload your first file to get started" 
                : `No deliverables with "${activeTab.replace(/_/g, ' ')}" status`}
            </p>
            {activeTab === "all" && (!isAdmin || viewAsPartnerId) && (
              <Button onClick={() => setIsUploading(true)} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            )}
          </motion.div>
        )}

        {/* Rejection Modal */}
        <RejectionModal
          open={rejectionModal.open}
          onClose={() => setRejectionModal({ open: false, submission: null })}
          onSubmit={handleRejectConfirm}
          isSubmitting={rejectSubmissionMutation.isPending}
          submissionName={rejectionModal.submission?.deliverables?.name || rejectionModal.submission?.file_name}
        />
      </motion.div>
    </div>
  );
}