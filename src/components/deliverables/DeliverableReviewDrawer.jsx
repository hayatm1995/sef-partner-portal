import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerSubmissionsService, deliverablesService, notificationsService, deliverableCommentsService } from '@/services/supabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, FileText, ExternalLink, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import DeliverableVersionHistory from './DeliverableVersionHistory';
import DeliverableComments from './DeliverableComments';

export default function DeliverableReviewDrawer({ 
  open, 
  onClose, 
  deliverable, 
  partner 
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // Reset state when drawer closes
  React.useEffect(() => {
    if (!open) {
      setRejectionReason('');
      setAdminComment('');
    }
  }, [open]);

  // Fetch all submissions for this deliverable
  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['deliverableSubmissions', deliverable?.id],
    queryFn: () => partnerSubmissionsService.getByDeliverableId(deliverable?.id),
    enabled: !!deliverable?.id && open,
  });

  const latestSubmission = submissions?.[0] || null;

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (submissionId) => {
      setProcessing(true);
      try {
        // Update submission status
        const updatedSubmission = await partnerSubmissionsService.update(submissionId, {
          status: 'approved',
          reviewed_by: user?.partner_user?.id,
        });

        // Update deliverable status
        if (deliverable?.id) {
          await deliverablesService.update(deliverable.id, {
            status: 'Approved',
          });
        }

        // Notify partner
        if (partner?.id) {
          await notificationsService.create({
            partner_id: partner.id,
            type: 'success',
            title: 'Deliverable Approved',
            message: `Your submission for "${deliverable?.name || deliverable?.title}" has been approved.`,
          });
        }

        // Add admin comment if provided
        if (adminComment.trim() && user?.partner_user?.id) {
          await deliverableCommentsService.create({
            deliverable_id: deliverable.id,
            submission_id: submissionId,
            user_id: user.partner_user.id,
            message: adminComment.trim(),
            is_admin: true,
          });
        }

        return updatedSubmission;
      } finally {
        setProcessing(false);
      }
    },
    onSuccess: () => {
      toast.success('Submission approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverableSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProgress'] });
      setRejectionReason('');
      setAdminComment('');
      onClose();
    },
    onError: (error) => {
      console.error('Approve error:', error);
      toast.error('Failed to approve submission: ' + (error.message || 'Unknown error'));
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ submissionId, reason }) => {
      if (!reason.trim()) {
        throw new Error('Rejection reason is required');
      }

      setProcessing(true);
      try {
        // Update submission status
        const updatedSubmission = await partnerSubmissionsService.update(submissionId, {
          status: 'rejected',
          rejection_reason: reason.trim(),
          reviewed_by: user?.partner_user?.id,
        });

        // Update deliverable status
        if (deliverable?.id) {
          await deliverablesService.update(deliverable.id, {
            status: 'Rejected',
          });
        }

        // Notify partner
        if (partner?.id) {
          await notificationsService.create({
            partner_id: partner.id,
            type: 'error',
            title: 'Deliverable Rejected',
            message: `Your submission for "${deliverable?.name || deliverable?.title}" has been rejected. Reason: ${reason.trim()}`,
          });
        }

        // Add admin comment
        if (user?.partner_user?.id) {
          await deliverableCommentsService.create({
            deliverable_id: deliverable.id,
            submission_id: submissionId,
            user_id: user.partner_user.id,
            message: `Rejected: ${reason.trim()}`,
            is_admin: true,
          });
        }

        return updatedSubmission;
      } finally {
        setProcessing(false);
      }
    },
    onSuccess: () => {
      toast.success('Submission rejected');
      queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverableSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProgress'] });
      setRejectionReason('');
      setAdminComment('');
      onClose();
    },
    onError: (error) => {
      console.error('Reject error:', error);
      toast.error('Failed to reject submission: ' + (error.message || 'Unknown error'));
    },
  });

  const handleApprove = () => {
    if (!latestSubmission?.id) {
      toast.error('No submission to approve');
      return;
    }
    approveMutation.mutate(latestSubmission.id);
  };

  const handleReject = () => {
    if (!latestSubmission?.id) {
      toast.error('No submission to reject');
      return;
    }
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({
      submissionId: latestSubmission.id,
      reason: rejectionReason,
    });
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { className: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    const config = configs[status] || { className: 'bg-gray-100 text-gray-800', label: 'Unknown' };
    
    return (
      <Badge className={config.className} variant="outline">
        {config.label}
      </Badge>
    );
  };

  if (!deliverable) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Review Deliverable
          </SheetTitle>
          <SheetDescription>
            {deliverable.name || deliverable.title} - {partner?.name || 'Unknown Partner'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Deliverable Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{deliverable.name || deliverable.title}</h3>
              {latestSubmission && getStatusBadge(latestSubmission.status)}
            </div>
            {deliverable.due_date && (
              <p className="text-sm text-gray-600">
                Due: {format(new Date(deliverable.due_date), 'MMM d, yyyy')}
              </p>
            )}
            {deliverable.admin_notes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                <strong>Admin Notes:</strong> {deliverable.admin_notes}
              </div>
            )}
          </div>

          {/* Latest Submission */}
          {loadingSubmissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            </div>
          ) : latestSubmission ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Latest Submission (Version {latestSubmission.version || 1})</span>
                  {latestSubmission.file_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(latestSubmission.file_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View File
                    </Button>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>File: {latestSubmission.file_name || 'Unknown'}</p>
                  <p>Uploaded: {format(new Date(latestSubmission.created_at), 'MMM d, yyyy h:mm a')}</p>
                  {latestSubmission.rejection_reason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <strong>Previous Rejection Reason:</strong> {latestSubmission.rejection_reason}
                    </div>
                  )}
                </div>
              </div>

              {/* Version History */}
              {submissions.length > 1 && (
                <div>
                  <h4 className="font-semibold mb-2">Version History</h4>
                  <DeliverableVersionHistory submissions={submissions.slice(1)} />
                </div>
              )}

              {/* Admin Comment */}
              <div>
                <Label htmlFor="adminComment">Add Comment (Optional)</Label>
                <Textarea
                  id="adminComment"
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Add a comment for the partner..."
                  rows={3}
                  className="mt-1"
                  disabled={processing}
                />
              </div>

              {/* Rejection Reason (if rejecting) */}
              <div>
                <Label htmlFor="rejectionReason">
                  Rejection Reason <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={3}
                  className="mt-1"
                  disabled={processing}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={processing}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1"
                >
                  {processing && rejectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing && approveMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No submission yet. Waiting for partner to upload.
            </div>
          )}

          {/* Comments Section */}
          {deliverable.id && (
            <div className="pt-4 border-t">
              <DeliverableComments deliverableId={deliverable.id} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

