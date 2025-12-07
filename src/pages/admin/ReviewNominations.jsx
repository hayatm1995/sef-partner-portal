import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { nominationsService, partnersService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  CheckCircle,
  XCircle,
  EyeOff,
  Loader2,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Breadcrumbs from "@/components/common/Breadcrumbs";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "Submitted", label: "Pending" },
  { value: "Under Review", label: "Under Review" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
];

const getStatusBadge = (status) => {
  const statusLower = (status || "").toLowerCase();
  if (statusLower === "approved") {
    return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
  }
  if (statusLower === "rejected") {
    return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
  }
  if (statusLower === "hidden") {
    return <Badge className="bg-gray-100 text-gray-800">Hidden</Badge>;
  }
  if (statusLower === "under review") {
    return <Badge className="bg-blue-100 text-blue-800">Under Review</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
};

export default function ReviewNominations() {
  const { user, role, partnerId } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'hide'
  const [reason, setReason] = useState("");
  const [showActionDialog, setShowActionDialog] = useState(false);

  const isAdmin = role === "admin" || role === "superadmin";

  // Fetch all nominations (with role-based filtering)
  const { data: nominations = [], isLoading } = useQuery({
    queryKey: ["adminNominations", role, partnerId],
    queryFn: async () => {
      try {
        return await nominationsService.getAll({
          role: role || undefined,
          currentUserPartnerId: partnerId || undefined,
          includeHidden: true, // Admins can see hidden nominations
        });
      } catch (error) {
        console.error("[ReviewNominations] Error fetching nominations:", error);
        toast.error("Failed to load nominations");
        return [];
      }
    },
    enabled: isAdmin,
    retry: 1,
  });

  // Fetch partners for name mapping
  const { data: partners = [] } = useQuery({
    queryKey: ["partnersForNominations", role, partnerId],
    queryFn: async () => {
      try {
        return await partnersService.getAll({
          role: role || undefined,
          currentUserPartnerId: partnerId || undefined,
        });
      } catch (error) {
        console.error("[ReviewNominations] Error fetching partners:", error);
        return [];
      }
    },
    enabled: isAdmin,
    retry: 1,
  });

  const getPartnerName = (partnerId) => {
    const partner = partners.find((p) => p.id === partnerId);
    return partner?.name || "Unknown Partner";
  };

  // Filter nominations
  const filteredNominations = nominations.filter((nomination) => {
    const matchesStatus =
      statusFilter === "all" || nomination.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      nomination.nominee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nomination.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getPartnerName(nomination.partner_id)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ nominationId, newStatus, reason: statusReason }) => {
      const currentNomination = nominations.find((n) => n.id === nominationId);
      return await nominationsService.updateStatus(nominationId, newStatus, {
        oldStatus: currentNomination?.status,
        reason: statusReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNominations"] });
      queryClient.invalidateQueries({ queryKey: ["nominations"] });
      toast.success("Nomination status updated successfully");
      setSelectedNomination(null);
      setActionType(null);
      setReason("");
      setShowActionDialog(false);
    },
    onError: (error) => {
      console.error("[ReviewNominations] Error updating status:", error);
      toast.error("Failed to update nomination status");
    },
  });

  const handleView = (nomination) => {
    setSelectedNomination(nomination);
    setShowActionDialog(true);
  };

  const handleAction = (action) => {
    if (!selectedNomination) return;
    
    if (action === "approve") {
      setActionType("approve");
    } else if (action === "reject") {
      setActionType("reject");
      setReason("");
    } else if (action === "hide") {
      setActionType("hide");
      setReason("");
    }
  };

  const handleConfirmAction = () => {
    if (!selectedNomination || !actionType) return;

    if (actionType === "reject" && !reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    if (actionType === "hide" && !reason.trim()) {
      toast.error("Please provide a comment for hiding");
      return;
    }

    let newStatus;
    if (actionType === "approve") {
      newStatus = "Approved";
    } else if (actionType === "reject") {
      newStatus = "Rejected";
    } else if (actionType === "hide") {
      newStatus = "hidden";
    }

    updateStatusMutation.mutate({
      nominationId: selectedNomination.id,
      newStatus,
      reason: reason.trim() || null,
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Access Denied
            </h3>
            <p className="text-red-600">
              You do not have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Breadcrumbs />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Review Nominations
        </h1>
        <p className="text-gray-600">
          Review and manage partner nominations
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by nominee, category, or partner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((filter) => (
                  <SelectItem key={filter.value} value={filter.value}>
                    {filter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Nominations ({filteredNominations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : filteredNominations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No nominations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Nomination Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNominations.map((nomination) => (
                    <TableRow key={nomination.id}>
                      <TableCell className="font-medium">
                        {getPartnerName(nomination.partner_id)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {nomination.nominee_name}
                          </div>
                          {nomination.nominee_email && (
                            <div className="text-sm text-gray-500">
                              {nomination.nominee_email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {nomination.category}
                      </TableCell>
                      <TableCell>{getStatusBadge(nomination.status)}</TableCell>
                      <TableCell>
                        {format(
                          new Date(nomination.created_at),
                          "MMM d, yyyy h:mm a"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(nomination)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View/Review Dialog */}
      {selectedNomination && (
        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nomination Details</DialogTitle>
              <DialogDescription>
                Review nomination and take action
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Partner Name
                </label>
                <p className="text-gray-900">
                  {getPartnerName(selectedNomination.partner_id)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Nominee Name
                </label>
                <p className="text-gray-900">
                  {selectedNomination.nominee_name}
                </p>
              </div>

              {selectedNomination.nominee_email && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Nominee Email
                  </label>
                  <p className="text-gray-900">
                    {selectedNomination.nominee_email}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>
                <p className="text-gray-900 capitalize">
                  {selectedNomination.category}
                </p>
              </div>

              {selectedNomination.nominee_bio && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Bio/Description
                  </label>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedNomination.nominee_bio}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  {getStatusBadge(selectedNomination.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Submitted Date
                </label>
                <p className="text-gray-900">
                  {format(
                    new Date(selectedNomination.created_at),
                    "MMM d, yyyy h:mm a"
                  )}
                </p>
              </div>

              {selectedNomination.rejection_reason && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Rejection Reason
                  </label>
                  <p className="text-gray-900">
                    {selectedNomination.rejection_reason}
                  </p>
                </div>
              )}

              {selectedNomination.admin_comment && (
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Admin Comment
                  </label>
                  <p className="text-gray-900">
                    {selectedNomination.admin_comment}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {!actionType && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleAction("approve")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleAction("reject")}
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleAction("hide")}
                    variant="outline"
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide
                  </Button>
                </div>
              )}

              {/* Reject/Hide Reason Input */}
              {actionType && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    {actionType === "reject"
                      ? "Rejection Reason *"
                      : "Comment for Hiding *"}
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      actionType === "reject"
                        ? "Please provide a reason for rejection..."
                        : "Please provide a comment for hiding this nomination..."
                    }
                    rows={4}
                    className="mb-4"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleConfirmAction}
                      disabled={updateStatusMutation.isPending}
                      className={
                        actionType === "approve"
                          ? "bg-green-600 hover:bg-green-700"
                          : actionType === "reject"
                          ? "bg-red-600 hover:bg-red-700"
                          : ""
                      }
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {actionType === "approve" && (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm Approve
                            </>
                          )}
                          {actionType === "reject" && (
                            <>
                              <XCircle className="w-4 h-4 mr-2" />
                              Confirm Reject
                            </>
                          )}
                          {actionType === "hide" && (
                            <>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Confirm Hide
                            </>
                          )}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActionType(null);
                        setReason("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionDialog(false);
                  setSelectedNomination(null);
                  setActionType(null);
                  setReason("");
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

