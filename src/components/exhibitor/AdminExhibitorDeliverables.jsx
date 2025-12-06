import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deliverablesService, partnerSubmissionsService, activityLogService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Download,
  Link as LinkIcon,
  MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminExhibitorDeliverables({ partnerId, partnerName, booth }) {
  const { user, partnerUser } = useAuth();
  const queryClient = useQueryClient();
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState('approved');

  const buildOption = booth?.build_option || 'sef_built';

  // Fetch exhibitor deliverables
  const { data: exhibitorDeliverables = [] } = useQuery({
    queryKey: ['exhibitorDeliverables', buildOption],
    queryFn: () => deliverablesService.getExhibitorDeliverables(buildOption),
  });

  // Fetch submissions for this partner
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['exhibitorSubmissions', partnerId],
    queryFn: () => partnerSubmissionsService.getByPartnerId(partnerId),
    enabled: !!partnerId,
  });

  // Create map of deliverable_id -> latest submission
  const submissionsMap = useMemo(() => {
    const map = {};
    allSubmissions.forEach(sub => {
      const deliverableId = sub.deliverable_id;
      if (!map[deliverableId] || new Date(sub.created_at) > new Date(map[deliverableId].created_at)) {
        map[deliverableId] = sub;
      }
    });
    return map;
  }, [allSubmissions]);

  // Update submission status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ submissionId, status, notes }) => {
      const updateData = {
        status,
        reviewed_by: partnerUser?.id,
        updated_at: new Date().toISOString(),
      };
      
      if (notes) {
        updateData.review_notes = notes;
      }

      return partnerSubmissionsService.update(submissionId, updateData);
    },
    onSuccess: async (data, variables) => {
      // Log activity
      try {
        await activityLogService.create({
          partner_id: partnerId,
          action: 'submission_reviewed',
          description: `Updated submission status to ${variables.status}`,
          metadata: {
            submission_id: variables.submissionId,
            deliverable_id: data.deliverable_id,
            status: variables.status,
          },
          user_id: partnerUser?.id,
        });
      } catch (error) {
        console.error('Failed to log activity:', error);
      }

      queryClient.invalidateQueries({ queryKey: ['exhibitorSubmissions', partnerId] });
      toast.success('Submission status updated');
      setReviewingSubmission(null);
      setReviewNotes('');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  const getStatusConfig = (status) => {
    const configs = {
      not_submitted: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Not Submitted',
        icon: AlertCircle,
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending Review',
        icon: Clock,
      },
      pending_review: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending Review',
        icon: Clock,
      },
      under_review: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Under Review',
        icon: Clock,
      },
      approved: {
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Approved',
        icon: CheckCircle,
      },
      rejected: {
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Rejected',
        icon: XCircle,
      },
      changes_requested: {
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Changes Requested',
        icon: XCircle,
      },
      locked_for_printing: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Locked for Printing',
        icon: Download,
      },
    };
    return configs[status] || configs.not_submitted;
  };

  const handleReview = (submission) => {
    setReviewingSubmission(submission);
    setReviewStatus(submission.status || 'pending_review');
    setReviewNotes(submission.review_notes || '');
  };

  const handleSubmitReview = () => {
    if (!reviewingSubmission) return;
    
    updateStatusMutation.mutate({
      submissionId: reviewingSubmission.id,
      status: reviewStatus,
      notes: reviewNotes,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exhibitor Deliverables - {partnerName}</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Build Option: <Badge>{buildOption === 'custom_build' ? 'Custom Build' : 'SEF Built'}</Badge>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {exhibitorDeliverables.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No deliverables found.
          </div>
        ) : (
          exhibitorDeliverables.map((deliverable) => {
            const submission = submissionsMap[deliverable.id];
            const status = submission ? submission.status : 'not_submitted';
            const statusConfig = getStatusConfig(status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={deliverable.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{deliverable.name}</h4>
                      {!deliverable.is_required && (
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      )}
                    </div>
                  </div>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {submission ? (
                  <div className="bg-gray-50 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Submitted: {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                      {submission.file_url && (
                        <div className="flex gap-2">
                          {submission.file_url.startsWith('http') && !submission.file_url.includes('supabase') ? (
                            <a
                              href={submission.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="w-4 h-4" />
                              View Link
                            </a>
                          ) : (
                            <a
                              href={submission.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    {submission.review_notes && (
                      <div className="text-sm text-gray-700 bg-white rounded p-2 border">
                        <strong>Review Notes:</strong> {submission.review_notes}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReview(submission)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Review / Update Status
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Not yet submitted
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Review Dialog */}
        {reviewingSubmission && (
          <Dialog open={!!reviewingSubmission} onOpenChange={() => setReviewingSubmission(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Submission</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={reviewStatus} onValueChange={setReviewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="changes_requested">Changes Requested</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="locked_for_printing">Locked for Printing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Review Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes or feedback..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReviewingSubmission(null);
                      setReviewNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

