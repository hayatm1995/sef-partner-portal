import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deliverablesService, partnersService, activityLogService, partnerSubmissionsService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Clock,
  FileText,
  Eye,
  Download
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export default function Approvals() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = role === 'admin' || role === 'superadmin';
  
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'revision'
  const [comment, setComment] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);

  // Fetch all partners for name mapping
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: async () => {
      return partnersService.getAll();
    },
    enabled: isAdmin,
  });

  // Fetch pending deliverables (status = 'submitted' or 'pending_review')
  const { data: pendingDeliverables = [], isLoading } = useQuery({
    queryKey: ['pendingDeliverables'],
    queryFn: async () => {
      const all = await deliverablesService.getAll();
      // Filter for pending status
      return all.filter(d => 
        d.status === 'submitted' || 
        d.status === 'pending_review' || 
        d.status === 'Pending Review' ||
        d.status?.toLowerCase().includes('pending')
      );
    },
    enabled: isAdmin,
  });

  // Fetch latest submissions for each deliverable
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['allSubmissionsForApprovals'],
    queryFn: async () => {
      try {
        return await partnerSubmissionsService.getAll();
      } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }
    },
    enabled: isAdmin && pendingDeliverables.length > 0,
  });

  // Create a map of deliverable_id -> latest submission
  const submissionsMap = React.useMemo(() => {
    const map = {};
    allSubmissions.forEach(sub => {
      const deliverableId = sub.deliverable_id;
      if (!map[deliverableId] || 
          (sub.version || 0) > (map[deliverableId].version || 0) ||
          new Date(sub.created_at) > new Date(map[deliverableId].created_at)) {
        map[deliverableId] = sub;
      }
    });
    return map;
  }, [allSubmissions]);

  // Partner map
  const partnerMap = React.useMemo(() => {
    const map = {};
    allPartners.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [allPartners]);

  // Sort by updated_at DESC
  const sortedDeliverables = React.useMemo(() => {
    return [...pendingDeliverables].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB - dateA;
    });
  }, [pendingDeliverables]);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async ({ deliverableId, submissionId }) => {
      // Update deliverable status
      await deliverablesService.update(deliverableId, { 
        status: 'Approved',
        updated_at: new Date().toISOString()
      });

      // Update submission status if exists
      if (submissionId) {
        await partnerSubmissionsService.update(submissionId, {
          status: 'approved',
          reviewed_by: user?.id
        });
      }

      // Log activity
      const deliverable = pendingDeliverables.find(d => d.id === deliverableId);
      if (deliverable && deliverable.partner_id) {
        await activityLogService.create({
          partner_id: deliverable.partner_id,
          user_id: user?.id,
          activity_type: 'deliverable_approved',
          description: `Deliverable "${deliverable.name}" approved`,
          metadata: {
            deliverable_id: deliverableId,
            submission_id: submissionId,
            action: 'approved'
          }
        });
      }

      return { deliverableId, submissionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
      setShowActionDialog(false);
      setSelectedDeliverable(null);
      setComment("");
      toast.success('Deliverable approved successfully');
    },
    onError: (error) => {
      toast.error('Failed to approve: ' + error.message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ deliverableId, submissionId, reason }) => {
      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      // Update deliverable status
      await deliverablesService.update(deliverableId, { 
        status: 'Rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      });

      // Update submission status if exists
      if (submissionId) {
        await partnerSubmissionsService.update(submissionId, {
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: user?.id
        });
      }

      // Log activity
      const deliverable = pendingDeliverables.find(d => d.id === deliverableId);
      if (deliverable && deliverable.partner_id) {
        await activityLogService.create({
          partner_id: deliverable.partner_id,
          user_id: user?.id,
          activity_type: 'deliverable_rejected',
          description: `Deliverable "${deliverable.name}" rejected: ${reason}`,
          metadata: {
            deliverable_id: deliverableId,
            submission_id: submissionId,
            action: 'rejected',
            reason
          }
        });
      }

      return { deliverableId, submissionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
      setShowActionDialog(false);
      setSelectedDeliverable(null);
      setComment("");
      toast.success('Deliverable rejected');
    },
    onError: (error) => {
      toast.error('Failed to reject: ' + error.message);
    },
  });

  // Revision mutation
  const revisionMutation = useMutation({
    mutationFn: async ({ deliverableId, submissionId, comment: revisionComment }) => {
      if (!revisionComment || revisionComment.trim().length === 0) {
        throw new Error('Revision comment is required');
      }

      // Update deliverable status
      await deliverablesService.update(deliverableId, { 
        status: 'Revision Needed',
        admin_comments: revisionComment,
        updated_at: new Date().toISOString()
      });

      // Update submission status if exists
      if (submissionId) {
        await partnerSubmissionsService.update(submissionId, {
          status: 'revision_needed',
          admin_comments: revisionComment,
          reviewed_by: user?.id
        });
      }

      // Log activity
      const deliverable = pendingDeliverables.find(d => d.id === deliverableId);
      if (deliverable && deliverable.partner_id) {
        await activityLogService.create({
          partner_id: deliverable.partner_id,
          user_id: user?.id,
          activity_type: 'deliverable_revision_requested',
          description: `Revision requested for "${deliverable.name}": ${revisionComment}`,
          metadata: {
            deliverable_id: deliverableId,
            submission_id: submissionId,
            action: 'revision_requested',
            comment: revisionComment
          }
        });
      }

      return { deliverableId, submissionId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['allSubmissions'] });
      setShowActionDialog(false);
      setSelectedDeliverable(null);
      setComment("");
      toast.success('Revision requested');
    },
    onError: (error) => {
      toast.error('Failed to request revision: ' + error.message);
    },
  });

  const handleAction = (deliverable, action) => {
    setSelectedDeliverable(deliverable);
    setActionType(action);
    setComment("");
    setShowActionDialog(true);
  };

  const handleConfirmAction = () => {
    if (!selectedDeliverable) return;

    const submission = submissionsMap[selectedDeliverable.id];

    if (actionType === 'approve') {
      approveMutation.mutate({
        deliverableId: selectedDeliverable.id,
        submissionId: submission?.id
      });
    } else if (actionType === 'reject') {
      if (!comment.trim()) {
        toast.error('Please provide a rejection reason');
        return;
      }
      rejectMutation.mutate({
        deliverableId: selectedDeliverable.id,
        submissionId: submission?.id,
        reason: comment
      });
    } else if (actionType === 'revision') {
      if (!comment.trim()) {
        toast.error('Please provide revision comments');
        return;
      }
      revisionMutation.mutate({
        deliverableId: selectedDeliverable.id,
        submissionId: submission?.id,
        comment: comment
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">Admin access required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "Approvals", href: "/admin/approvals" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approvals System</h1>
          <p className="text-gray-600 mt-1">Review and approve pending deliverables</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Deliverables ({sortedDeliverables.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Clock className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : sortedDeliverables.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No pending deliverables</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deliverable</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Submission</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDeliverables.map((deliverable) => {
                  const partner = partnerMap[deliverable.partner_id];
                  const submission = submissionsMap[deliverable.id];
                  
                  return (
                    <TableRow key={deliverable.id}>
                      <TableCell className="font-medium">
                        {deliverable.name || deliverable.title || 'Untitled'}
                      </TableCell>
                      <TableCell>
                        {partner?.name || 'Unknown Partner'}
                      </TableCell>
                      <TableCell>
                        {submission ? (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{submission.file_name}</span>
                            {submission.file_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(submission.file_url, '_blank')}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No submission</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {format(new Date(deliverable.updated_at || deliverable.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(deliverable, 'approve')}
                            className="text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(deliverable, 'reject')}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(deliverable, 'revision')}
                            className="text-orange-600 hover:bg-orange-50"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Revision
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve Deliverable'}
              {actionType === 'reject' && 'Reject Deliverable'}
              {actionType === 'revision' && 'Request Revision'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' && 'Are you sure you want to approve this deliverable?'}
              {actionType === 'reject' && 'Please provide a reason for rejection (required):'}
              {actionType === 'revision' && 'Please provide comments for the revision request (required):'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDeliverable && (
              <div>
                <p className="font-medium">{selectedDeliverable.name || selectedDeliverable.title}</p>
                <p className="text-sm text-gray-600">{partnerMap[selectedDeliverable.partner_id]?.name}</p>
              </div>
            )}
            {(actionType === 'reject' || actionType === 'revision') && (
              <Textarea
                placeholder={actionType === 'reject' ? 'Rejection reason...' : 'Revision comments...'}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                (actionType === 'reject' || actionType === 'revision') && !comment.trim() ||
                approveMutation.isPending ||
                rejectMutation.isPending ||
                revisionMutation.isPending
              }
              className={
                actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                actionType === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                'bg-orange-600 hover:bg-orange-700'
              }
            >
              {approveMutation.isPending || rejectMutation.isPending || revisionMutation.isPending ? (
                'Processing...'
              ) : (
                <>
                  {actionType === 'approve' && 'Approve'}
                  {actionType === 'reject' && 'Reject'}
                  {actionType === 'revision' && 'Request Revision'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

