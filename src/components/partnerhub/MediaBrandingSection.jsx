import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Trash2, Image as ImageIcon, Loader2, Plus, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function MediaBrandingSection({ partnerEmail, isAdmin }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    file_type: "logo",
    description: "",
    file: null
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: mediaFiles = [] } = useQuery({
    queryKey: ['mediaBranding', partnerEmail],
    queryFn: () => base44.entities.MediaBranding.filter({ partner_email: partnerEmail }, '-upload_date'),
    enabled: !!partnerEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaBranding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaBranding'] });
      setIsUploading(false);
      setFormData({ file_type: "logo", description: "", file: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MediaBranding.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaBranding'] });
    },
  });

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFormData(prev => ({ ...prev, file: e.dataTransfer.files[0] }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: formData.file });
      
      createMutation.mutate({
        partner_email: partnerEmail,
        file_type: formData.file_type,
        file_url,
        file_name: formData.file.name,
        description: formData.description,
        uploaded_by: user.email,
        is_admin_uploaded: user.role === 'admin' || user.is_super_admin,
        upload_date: new Date().toISOString()
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  const getFileTypeLabel = (type) => {
    const labels = {
      logo: "Logo",
      headshot: "Headshot",
      branding_guidelines: "Branding Guidelines",
      proof_of_outreach: "Proof of Outreach",
      media_kit: "Media Kit (Admin)"
    };
    return labels[type] || type;
  };

  const getFileTypeColor = (type) => {
    const colors = {
      logo: "bg-blue-100 text-blue-800",
      headshot: "bg-purple-100 text-purple-800",
      branding_guidelines: "bg-green-100 text-green-800",
      proof_of_outreach: "bg-orange-100 text-orange-800",
      media_kit: "bg-red-100 text-red-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getFileTypeGradient = (type) => {
    const gradients = {
      logo: "from-blue-500 to-blue-600",
      headshot: "from-purple-500 to-purple-600",
      branding_guidelines: "from-green-500 to-green-600",
      proof_of_outreach: "from-orange-500 to-orange-600",
      media_kit: "from-red-500 to-red-600"
    };
    return gradients[type] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Media & Branding Assets</h3>
          <p className="text-gray-600 mt-1">Upload and manage your required documents</p>
        </div>
        {!isUploading && (
          <Button
            onClick={() => setIsUploading(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Upload Form */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-2 border-orange-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-orange-600" />
                  Upload Document
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsUploading(false);
                    setFormData({ file_type: "logo", description: "", file: null });
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Drag & Drop Area */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                      dragActive 
                        ? 'border-orange-500 bg-orange-50' 
                        : 'border-gray-300 hover:border-orange-400 bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    {!formData.file ? (
                      <>
                        <Upload className="w-16 h-16 mx-auto text-orange-400 mb-4" />
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                          Drop your file here or click to browse
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          Supported formats: PDF, PNG, JPG, JPEG
                        </p>
                        <Input
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                          accept=".pdf,.png,.jpg,.jpeg"
                        />
                        <Label htmlFor="file-upload">
                          <Button type="button" variant="outline" className="cursor-pointer" asChild>
                            <span>Select File</span>
                          </Button>
                        </Label>
                      </>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        <FileText className="w-12 h-12 text-orange-600" />
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">{formData.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Document Type Selection */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Document Type *</Label>
                      <Select
                        value={formData.file_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, file_type: value }))}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="logo">Logo</SelectItem>
                          <SelectItem value="headshot">Headshot</SelectItem>
                          <SelectItem value="branding_guidelines">Branding Guidelines</SelectItem>
                          <SelectItem value="proof_of_outreach">Proof of Outreach</SelectItem>
                          {(isAdmin || user?.is_super_admin) && (
                            <SelectItem value="media_kit">Media Kit (Admin Only)</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-2 block">Description (Optional)</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add a brief description..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsUploading(false);
                        setFormData({ file_type: "logo", description: "", file: null });
                      }}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={uploading || !formData.file}
                      className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Grid */}
      {mediaFiles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mediaFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-2 border-gray-200 hover:border-orange-300 hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${getFileTypeGradient(file.file_type)} rounded-xl shadow-md`}>
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                    <Badge className={`${getFileTypeColor(file.file_type)} text-xs px-2 py-1`}>
                      {getFileTypeLabel(file.file_type)}
                    </Badge>
                  </div>

                  {/* File Name */}
                  <h4 className="font-bold text-lg mb-2 text-gray-900 truncate" title={file.file_name}>
                    {file.file_name}
                  </h4>

                  {/* Description */}
                  {file.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{file.description}</p>
                  )}

                  {/* Meta Info */}
                  <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Uploaded by</span>
                      <span className="font-medium text-gray-700 truncate max-w-[150px]" title={file.uploaded_by}>
                        {file.uploaded_by}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Date</span>
                      <span className="font-medium text-gray-700">
                        {format(new Date(file.upload_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    {file.is_admin_uploaded && (
                      <Badge variant="outline" className="text-xs mt-2">
                        Admin Uploaded
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = file.file_url;
                        link.download = file.file_name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(file.id)}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents uploaded yet</h3>
            <p className="text-gray-600 mb-6">Upload your required documents to get started</p>
            <Button 
              onClick={() => setIsUploading(true)} 
              className="bg-gradient-to-r from-orange-500 to-amber-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload First Document
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}