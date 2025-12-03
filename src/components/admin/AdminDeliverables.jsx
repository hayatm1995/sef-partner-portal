import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, AlertCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AdminDeliverables({ deliverables, onUpdate }) {
  const [reviewingDeliverable, setReviewingDeliverable] = useState(null);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const getPartnerName = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.full_name || email;
  };

  const getPartnerCompany = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.company_name || '';
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      const updated = await base44.entities.Deliverable.update(id, { status, notes });
      
      // Log the activity
      const deliverable = deliverables.find(d => d.id === id);
      if (deliverable && user?.email) {
        try {
          await base44.entities.ActivityLog.create({
            activity_type: "status_changed",
            user_email: user.email,
            target_user_email: deliverable.partner_email,
            description: `Deliverable "${deliverable.title}" status changed to "${status}"`,
            metadata: {
              deliverable_id: id,
              new_status: status,
              title: deliverable.title
            }
          });
        } catch (error) {
          console.error("Failed to log activity:", error);
        }
      }
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
      setReviewingDeliverable(null);
      setNotes("");
    },
    onError: (error) => {
      console.error("Failed to update deliverable status:", error);
    }
  });

  const handleStatusUpdate = (status) => {
    if (reviewingDeliverable) {
      updateStatusMutation.mutate({
        id: reviewingDeliverable.id,
        status,
        notes,
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      revision_needed: "bg-orange-100 text-orange-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!deliverables || deliverables.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">No deliverables to display.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliverables.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getPartnerName(item.partner_email)}</p>
                        <p className="text-xs text-gray-500">{item.partner_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getPartnerCompany(item.partner_email) || '-'}</TableCell>
                    <TableCell className="capitalize">{item.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(item.created_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReviewingDeliverable(item);
                            setNotes(item.notes || "");
                          }}
                        >
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.file_url, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {reviewingDeliverable && (
        <Dialog open={!!reviewingDeliverable} onOpenChange={() => setReviewingDeliverable(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Review Deliverable</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{reviewingDeliverable.title}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Partner:</span>{' '}
                    <span className="text-blue-600">{getPartnerName(reviewingDeliverable.partner_email)}</span>
                  </p>
                  {getPartnerCompany(reviewingDeliverable.partner_email) && (
                    <p className="text-gray-600">
                      <span className="font-medium">Company:</span>{' '}
                      {getPartnerCompany(reviewingDeliverable.partner_email)}
                    </p>
                  )}
                  <p className="text-gray-600">
                    <span className="font-medium">Email:</span> {reviewingDeliverable.partner_email}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Type:</span> {reviewingDeliverable.type.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Admin Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add feedback or notes..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('revision_needed')}
                  className="gap-2"
                  disabled={updateStatusMutation.isPending}
                >
                  <AlertCircle className="w-4 h-4" />
                  Request Revision
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('rejected')}
                  className="gap-2 text-red-600"
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}