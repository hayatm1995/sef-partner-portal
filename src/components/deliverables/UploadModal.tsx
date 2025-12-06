import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { deliverablesService } from "@/services/deliverablesService";

interface UploadModalProps {
  deliverableId: string;
  deliverableKey: string;
  partnerId: string;
  existingFile?: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({
  deliverableId,
  deliverableKey,
  partnerId,
  existingFile,
  open,
  onClose,
  onSuccess,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      // 1. Upload to Storage
      const publicUrl = await deliverablesService.uploadFile(partnerId, deliverableKey, file);

      // 2. Update DB
      await deliverablesService.submitDeliverable(deliverableId, publicUrl);

      toast.success("File uploaded successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Deliverable</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file-upload">Select File</Label>
            <Input 
              id="file-upload" 
              type="file" 
              accept=".png,.jpg,.jpeg,.svg,.pdf"
              onChange={handleFileChange}
            />
            <p className="text-xs text-gray-500">
              Supported formats: PNG, JPG, SVG, PDF
            </p>
          </div>

          {existingFile && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
              <strong>Note:</strong> You are replacing an existing file.
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!file || loading} className="bg-orange-600 hover:bg-orange-700 text-white">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {existingFile ? "Replace File" : "Upload"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

