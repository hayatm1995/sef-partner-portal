import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useAppRole } from "@/hooks/useAppRole";
import { DEV_MODE } from "@/config/devMode";
import { deliverablesService, Deliverable } from "@/services/deliverablesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, Upload, Eye, AlertCircle } from "lucide-react";
import UploadModal from "@/components/deliverables/UploadModal";

export default function PartnerDeliverables() {
  const { user, partner, loading } = useAuth();
  const { role, partnerId: appRolePartnerId } = useAppRole();
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // In Dev Mode, show message if role/partner not set
  if (DEV_MODE) {
    if (role !== "partner") {
      return (
        <div className="p-8 max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg font-semibold mb-2">Dev Mode: Switch to Partner Role</p>
              <p className="text-gray-600 mb-4">Go to /dev and select Partner role to view this page.</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    if (!appRolePartnerId) {
      return (
        <div className="p-8 max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg font-semibold mb-2">Dev Mode: No Partner Selected</p>
              <p className="text-gray-600 mb-4">Go back to /dev and choose a partner.</p>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Show loading spinner only during actual loading (not in Dev Mode)
  if (!DEV_MODE && loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // STRICT: Only partners can access
  if (role !== 'partner') {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Access denied. Partner access required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ensure we have a partner ID (use appRolePartnerId in Dev Mode)
  const partnerId = DEV_MODE ? appRolePartnerId : (partner?.id);

  const { data: deliverables = [], isLoading, refetch } = useQuery({
    queryKey: ["partnerDeliverables", partnerId],
    queryFn: () => deliverablesService.getPartnerDeliverables(partnerId!),
    enabled: !!partnerId,
  });

  const handleUploadClick = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setIsUploadOpen(true);
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

  if (!user) return null;

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
          <FileText className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Deliverables</h1>
          <p className="text-gray-500 mt-1">Manage and submit your required documents</p>
        </div>
      </div>

      <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <CardTitle className="text-lg text-gray-800">Required Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                <TableHead className="w-[40%]">Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliverables.map((item) => (
                <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium text-gray-900">
                    {item.title}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                    {item.status === 'rejected' && item.admin_notes && (
                      <div className="flex items-start gap-2 text-red-600 bg-red-50 p-2 rounded text-xs">
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        {item.admin_notes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.file_url ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(item.file_url, '_blank')}
                            className="h-8 text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUploadClick(item)}
                            className="h-8 bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5 mr-1.5" />
                            Replace
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUploadClick(item)}
                          className="h-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          Upload
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {deliverables.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-gray-500">
                    No deliverables assigned yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedDeliverable && partnerId && (
        <UploadModal
          open={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          deliverableId={selectedDeliverable.id}
          deliverableKey={selectedDeliverable.key}
          partnerId={partnerId}
          existingFile={selectedDeliverable.file_url}
          onSuccess={refetch}
        />
      )}
    </div>
  );
}

