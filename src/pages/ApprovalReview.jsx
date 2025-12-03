import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  MessageSquare,
  Download,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isPast, parseISO } from "date-fns";
import { toast } from "sonner";

export default function ApprovalReview() {
  const [viewingApproval, setViewingApproval] = useState(null);
  const [respondingTo, setRespondingTo] = useState(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ['myApprovals', user?.email],
    queryFn: async () => {
      const allApprovals = await base44.entities.PartnerApproval.list('-created_date');
      return allApprovals.filter(approval => 
        approval.assigned_partner_emails.includes(user?.email)
      );
    },
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ approvalId, response, comment }) => {
      const approval = approvals.find(a => a.id === approvalId);
      const updatedResponses = approval.partner_responses.map(r => 
        r.partner_email === user.email 
          ? { ...r, response, comment, response_date: new Date().toISOString() }
          : r
      );

      // Calculate overall status
      const allApproved = updatedResponses.every(r => r.response === "approved");
      const anyRejected = updatedResponses.some(r => r.response === "rejected");
      const allResponded = updatedResponses.every(r => r.response !== "pending");
      
      let newStatus = approval.status;
      if (allApproved && allResponded) {
        newStatus = "approved";
      } else if (anyRejected) {
        newStatus = "rejected";
      } else if (allResponded) {
        newStatus = "partially_approved";
      }

      // Update approval
      const updated = await base44.entities.PartnerApproval.update(approvalId, {
        partner_responses: updatedResponses,
        status: newStatus
      });

      // Notify admin
      await base44.entities.StatusUpdate.create({
        partner_email: approval.uploaded_by_admin,
        title: `Approval Response: ${approval.title}`,
        message: `${user.full_name} has ${response} the file "${approval.title}"${comment ? `: ${comment}` : ''}`,
        type: response === "approved" ? "success" : "warning",
        read: false
      });

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setRespondingTo(null);
      setRejectionComment("");
      toast.success('Response submitted');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ approvalId, comment }) => {
      const approval = approvals.find(a => a.id === approvalId);
      const updatedThread = [
        ...(approval.comment_thread || []),
        {
          author_email: user.email,
          author_name: user.full_name,
          comment,
          timestamp: new Date().toISOString()
        }
      ];
      return base44.entities.PartnerApproval.update(approvalId, {
        comment_thread: updatedThread
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myApprovals'] });
      setNewComment("");
      toast.success('Comment added');
    },
  });

  const getMyResponse = (approval) => {
    return approval.partner_responses?.find(r => r.partner_email === user?.email);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const pendingApprovals = approvals.filter(a => {
    const myResponse = getMyResponse(a);
    return myResponse?.response === "pending";
  });

  const respondedApprovals = approvals.filter(a => {
    const myResponse = getMyResponse(a);
    return myResponse?.response !== "pending";
  });

  const overdueApprovals = pendingApprovals.filter(a => 
    isPast(parseISO(a.deadline))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Review & Approve</h1>
          <p className="text-gray-600 mt-1">Files awaiting your review and approval</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-yellow-100">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Awaiting Response</p>
              <p className="text-2xl font-bold text-yellow-700">{pendingApprovals.length}</p>
            </CardContent>
          </Card>
          <Card className="border-orange-100">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-orange-700">{overdueApprovals.length}</p>
            </CardContent>
          </Card>
          <Card className="border-green-100">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-700">
                {respondedApprovals.filter(a => getMyResponse(a)?.response === "approved").length}
              </p>
            </CardContent>
          </Card>
          <Card className="border-red-100">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-700">
                {respondedApprovals.filter(a => getMyResponse(a)?.response === "rejected").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Approval Items */}
        <Card className="border-purple-100 shadow-md">
          <CardHeader>
            <CardTitle>Your Approval Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="pending">
                  Pending ({pendingApprovals.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({respondedApprovals.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {pendingApprovals.length > 0 ? (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {pendingApprovals.map((approval) => {
                        const isOverdue = isPast(parseISO(approval.deadline));
                        return (
                          <motion.div
                            key={approval.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-6 border-2 rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : 'border-purple-200'}`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-bold text-lg">{approval.title}</h3>
                                  <Badge variant="outline">{approval.file_type.replace(/_/g, ' ')}</Badge>
                                  {isOverdue && (
                                    <Badge variant="destructive" className="flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      OVERDUE
                                    </Badge>
                                  )}
                                </div>
                                {approval.description && (
                                  <p className="text-sm text-gray-600 mb-3">{approval.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="flex items-center gap-1 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    Deadline: {format(parseISO(approval.deadline), 'MMM d, yyyy')}
                                  </span>
                                  <a 
                                    href={approval.file_url} 
                                    target="_blank"
                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <Download className="w-4 h-4" />
                                    {approval.file_name}
                                  </a>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                              <Button
                                onClick={() => setViewingApproval(approval)}
                                variant="outline"
                                className="flex-1"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              <Button
                                onClick={() => respondMutation.mutate({
                                  approvalId: approval.id,
                                  response: "approved",
                                  comment: ""
                                })}
                                disabled={respondMutation.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => setRespondingTo(approval)}
                                disabled={respondMutation.isPending}
                                variant="outline"
                                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-600">You have no pending approval requests</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {respondedApprovals.length > 0 ? (
                  <div className="space-y-4">
                    {respondedApprovals.map((approval) => {
                      const myResponse = getMyResponse(approval);
                      return (
                        <div key={approval.id} className="p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{approval.title}</h3>
                                <Badge variant="outline" className={getStatusColor(myResponse?.response)}>
                                  {myResponse?.response}
                                </Badge>
                              </div>
                              {myResponse?.comment && (
                                <p className="text-sm text-gray-600 mb-2">{myResponse.comment}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Responded on {format(parseISO(myResponse?.response_date), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingApproval(approval)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed reviews</h3>
                    <p className="text-gray-600">Your reviewed items will appear here</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rejection Dialog */}
      {respondingTo && (
        <Dialog open={!!respondingTo} onOpenChange={() => setRespondingTo(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Approval Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please provide a reason for rejection. This will help the admin understand your concerns.
              </p>
              <Textarea
                value={rejectionComment}
                onChange={(e) => setRejectionComment(e.target.value)}
                placeholder="Explain why you're rejecting this..."
                rows={4}
                className="mt-2"
              />
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setRespondingTo(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (rejectionComment.trim()) {
                      respondMutation.mutate({
                        approvalId: respondingTo.id,
                        response: "rejected",
                        comment: rejectionComment
                      });
                    } else {
                      toast.error('Please provide a reason for rejection');
                    }
                  }}
                  disabled={!rejectionComment.trim() || respondMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Details Dialog */}
      {viewingApproval && (
        <Dialog open={!!viewingApproval} onOpenChange={() => setViewingApproval(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{viewingApproval.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">File Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">File:</span>
                    <a href={viewingApproval.file_url} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      {viewingApproval.file_name}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <Badge variant="outline">{viewingApproval.file_type.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Deadline:</span>
                    <span className="text-sm font-medium">
                      {format(parseISO(viewingApproval.deadline), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {viewingApproval.description && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Description:</span>
                      <p className="text-sm">{viewingApproval.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mb-4">
                    {viewingApproval.comment_thread?.map((comment, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{comment.author_name}</span>
                          <span className="text-xs text-gray-500">
                            {format(parseISO(comment.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                    />
                    <Button
                      onClick={() => {
                        if (newComment.trim()) {
                          addCommentMutation.mutate({
                            approvalId: viewingApproval.id,
                            comment: newComment
                          });
                        }
                      }}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                    >
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}