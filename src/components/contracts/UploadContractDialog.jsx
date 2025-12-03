import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function UploadContractDialog({ onClose, partners }) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    partner_email: "",
    title: "",
    version: "1.0",
    effective_date: "",
    expiry_date: "",
    admin_notes: ""
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (!file) throw new Error("Please select a file");
      
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploading(false);
      
      return base44.entities.Contract.create({
        ...data,
        file_url,
        file_name: file.name,
        status: "draft"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success("Contract uploaded successfully!");
      onClose();
    },
    onError: (error) => {
      setUploading(false);
      toast.error(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.partner_email) {
      toast.error("Please select a partner");
      return;
    }
    if (!formData.title) {
      toast.error("Please enter a contract title");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            Upload New Contract
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Select Partner *</Label>
            <Select
              value={formData.partner_email}
              onValueChange={(value) => setFormData(prev => ({ ...prev, partner_email: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a partner..." />
              </SelectTrigger>
              <SelectContent>
                {partners.filter(p => p.role !== 'admin' && !p.is_super_admin).map((partner) => (
                  <SelectItem key={partner.id} value={partner.email}>
                    {partner.full_name} ({partner.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Contract Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Partnership Agreement 2026"
            />
          </div>

          <div>
            <Label>Contract File *</Label>
            <div className="mt-1">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <FileText className="w-4 h-4" />
                  {file.name}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Version</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0"
              />
            </div>
            <div>
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Admin Notes (Optional)</Label>
            <Textarea
              value={formData.admin_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
              placeholder="Internal notes about this contract..."
              rows={2}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || uploading}
              className="bg-gradient-to-r from-orange-500 to-amber-600"
            >
              {(createMutation.isPending || uploading) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Upload Contract
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}