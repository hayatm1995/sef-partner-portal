import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deliverablesService, Deliverable } from "@/services/deliverablesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShieldCheck, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { partnersService } from "@/services/supabaseService";

export default function DeliverablesReview() {
  const { user, role, loading } = useAuth();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("submitted");
  const [partnerFilter, setPartnerFilter] = useState<string>("all");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Show loading spinner only during actual loading
  // Role should resolve independently of partner data
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // STRICT: Only superadmin can access
  const isSuperAdmin = role === 'superadmin';

  // Fetch partners for filter (superadmin sees all)
  const { data: partners = [] } = useQuery({
    queryKey: ["partners", role, user?.id],
    queryFn: () => partnersService.getAll({
      role: role || undefined,
      currentUserAuthId: user?.id || undefined,
    }),
    enabled: isSuperAdmin,
  });

  // Fetch all deliverables
  const { data: allDeliverables = [], isLoading } = useQuery({
    queryKey: ["adminDeliverables"],
    queryFn: () => deliverablesService.getAllDeliverables(),
    enabled: isSuperAdmin,
  });

  // Filter logic
  const filteredDeliverables = allDeliverables.filter(item => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (partnerFilter !== "all" && item.partner_id !== partnerFilter) return false;
    return true;
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => deliverablesService.approveDeliverable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeliverables"] });
      toast.success("Deliverable approved");
    },
    onError: () => toast.error("Failed to approve"),
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => 
      deliverablesService.rejectDeliverable(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDeliverables"] });
      toast.success("Deliverable rejected");
      setRejectModalOpen(false);
      setRejectReason("");
    },
    onError: () => toast.error("Failed to reject"),
  });

  const handleRejectClick = (item: Deliverable) => {
    setSelectedDeliverable(item);
    setRejectModalOpen(true);
  };

  const confirmReject = () => {
    if (selectedDeliverable && rejectReason) {
      rejectMutation.mutate({ id: selectedDeliverable.id, reason: rejectReason });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Submitted</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pending</Badge>;
    }
  };

  // STRICT: Only superadmin can access
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShieldCheck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500">Superadmin access required.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <ShieldCheck className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Review Deliverables</h1>
          <p className="text-gray-500 mt-1">Review and manage partner submissions</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-sm bg-white">
        <CardContent className="p-4 flex gap-4">
          <div className="w-64">
            <Select value={partnerFilter} onValueChange={setPartnerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {partners.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead>Partner</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliverables.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900">
                    {item.partners?.name || 'Unknown Partner'}
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(item.file_url, '_blank')}
                          className="h-8 text-gray-600"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      )}
                      
                      {item.status === 'submitted' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(item.id)}
                            disabled={approveMutation.isPending}
                            className="h-8 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRejectClick(item)}
                            className="h-8 bg-red-600 hover:bg-red-700 text-white"
                          >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDeliverables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                    No deliverables found matching filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Deliverable</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject}
              disabled={!rejectReason || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Deliverable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

