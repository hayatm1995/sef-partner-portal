import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  FileText, Download, Calendar, Clock, Upload, Loader2, 
  CheckCircle, Send, Eye, XCircle, Archive, ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import ContractDiscussion from "./ContractDiscussion";

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: FileText, gradient: "from-gray-500 to-gray-600" },
  sent: { label: "Sent to Partner", color: "bg-blue-100 text-blue-700", icon: Send, gradient: "from-blue-500 to-blue-600" },
  under_review: { label: "Under Review", color: "bg-yellow-100 text-yellow-700", icon: Eye, gradient: "from-yellow-500 to-amber-600" },
  signed: { label: "Signed", color: "bg-green-100 text-green-700", icon: CheckCircle, gradient: "from-green-500 to-emerald-600" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle, gradient: "from-red-500 to-red-600" },
  archived: { label: "Archived", color: "bg-slate-100 text-slate-700", icon: Archive, gradient: "from-slate-500 to-slate-600" }
};

export default function ContractDetail({ contract, isAdmin, user, partnerName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editData, setEditData] = useState({
    title: contract.title,
    status: contract.status,
    version: contract.version || "1.0",
    effective_date: contract.effective_date || "",
    expiry_date: contract.expiry_date || "",
    admin_notes: contract.admin_notes || ""
  });
  
  const queryClient = useQueryClient();
  const status = statusConfig[contract.status] || statusConfig.draft;
  const StatusIcon = status.icon;

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Contract.update(contract.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setIsEditing(false);
      toast.success("Contract updated successfully");
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Contract.update(contract.id, { 
        file_url, 
        file_name: file.name,
        version: (parseFloat(contract.version || "1.0") + 0.1).toFixed(1)
      });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success("New version uploaded!");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r ${status.gradient} p-6 rounded-t-2xl`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              <FileText className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{contract.title}</h2>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white border-white/30">
                  v{contract.version || "1.0"}
                </Badge>
                <Badge className={`${status.color} border`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {status.label}
                </Badge>
              </div>
              {partnerName && (
                <p className="text-white/80 text-sm mt-2">Partner: {partnerName}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              onClick={() => window.open(contract.file_url, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {isAdmin && (
              <Button
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Contract Info */}
        <Card className="border-2 border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Contract Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing && isAdmin ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={editData.title}
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={editData.status}
                      onValueChange={(value) => setEditData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent to Partner</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="signed">Signed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Version</Label>
                    <Input
                      value={editData.version}
                      onChange={(e) => setEditData(prev => ({ ...prev, version: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Effective Date</Label>
                    <Input
                      type="date"
                      value={editData.effective_date}
                      onChange={(e) => setEditData(prev => ({ ...prev, effective_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={editData.expiry_date}
                      onChange={(e) => setEditData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Admin Notes (Internal)</Label>
                  <Textarea
                    value={editData.admin_notes}
                    onChange={(e) => setEditData(prev => ({ ...prev, admin_notes: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button 
                    onClick={() => updateMutation.mutate(editData)}
                    disabled={updateMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">File Name</p>
                      <p className="font-medium text-sm">{contract.file_name || 'contract.pdf'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-medium text-sm">{format(new Date(contract.created_date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {contract.effective_date && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">Effective Date</p>
                        <p className="font-medium text-sm">{format(new Date(contract.effective_date), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}
                  {contract.expiry_date && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="text-xs text-gray-500">Expiry Date</p>
                        <p className="font-medium text-sm">{format(new Date(contract.expiry_date), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload new version - Admin only */}
            {isAdmin && !isEditing && (
              <div className="mt-6 pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Upload New Version</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {uploading && <Loader2 className="w-5 h-5 animate-spin text-orange-600" />}
                </div>
              </div>
            )}

            {/* Admin Notes Display */}
            {isAdmin && contract.admin_notes && !isEditing && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs font-semibold text-yellow-800 mb-1">Admin Notes</p>
                <p className="text-sm text-yellow-900">{contract.admin_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discussion Wall */}
        <ContractDiscussion 
          contractId={contract.id} 
          user={user} 
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}