import React, { useState } from "react";
import { supabase } from "@/config/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Upload, File, X, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function SubmissionUploader({ 
  deliverable, 
  partnerId, 
  userId, 
  onClose, 
  onSuccess 
}) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError("Please select a file to upload");
      return;
    }

    if (!deliverable?.id || !partnerId) {
      setUploadError("Missing deliverable or partner information");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Upload file to Supabase Storage
      // Path format: deliverables/{partner_id}/{deliverable_id}/{filename}
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `deliverables/${partnerId}/${deliverable.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get signed URL for secure access (preferred)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('deliverables')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      // Fallback to public URL if signed URL fails
      let file_url = null;
      if (!signedUrlError && signedUrlData?.signedUrl) {
        file_url = signedUrlData.signedUrl;
      } else {
        const { data: urlData } = supabase.storage
          .from('deliverables')
          .getPublicUrl(filePath);
        file_url = urlData?.publicUrl;
      }

      if (!file_url) {
        throw new Error('Failed to get URL for uploaded file.');
      }
      
      // Call onSuccess with submission data
      onSuccess({
        deliverable_id: deliverable.id,
        partner_id: partnerId,
        file_url,
        file_name: file.name,
        file_size: file.size,
        status: 'pending',
        submitted_by: userId,
      });

      toast.success('File uploaded successfully!');
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      const errorMessage = error.message || "Upload failed. Please try again.";
      setUploadError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">Upload File</h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload file for: <strong>{deliverable?.name}</strong>
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={isUploading}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{uploadError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-300 hover:border-orange-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!file ? (
                <>
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    All file types supported
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploading}
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" className="cursor-pointer" asChild type="button" disabled={isUploading}>
                      <span>Select File</span>
                    </Button>
                  </label>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg"
                >
                  <File className="w-6 h-6 text-orange-600" />
                  <span className="font-medium flex-1 truncate">{file.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFile(null);
                      setUploadError(null);
                    }}
                    disabled={isUploading}
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || !file}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}

