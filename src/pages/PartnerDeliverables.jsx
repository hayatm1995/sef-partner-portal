import React, { useState } from "react";
import { usePartnerDeliverables } from "@/hooks/usePartnerDeliverables";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { partnerSubmissionsService, activityLogService, deliverableCommentsService, notificationsService } from "@/services/supabaseService";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Upload,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  History,
  MessageSquare,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DeliverableVersionHistory from "@/components/deliverables/DeliverableVersionHistory";
import DeliverableComments from "@/components/deliverables/DeliverableComments";
// File upload handling without react-dropzone dependency

export default function PartnerDeliverables() {
  const { data: deliverables, isLoading, error, partnerId } = usePartnerDeliverables();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploadingDeliverable, setUploadingDeliverable] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadText, setUploadText] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedDeliverable, setExpandedDeliverable] = useState(null);

  // Fetch all submissions for all deliverables at once
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['partnerSubmissions', partnerId],
    queryFn: async () => {
      if (!partnerId) return [];
      try {
        return await partnerSubmissionsService.getByPartnerId(partnerId);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        return [];
      }
    },
    enabled: !!partnerId,
  });

  // Real-time updates for submissions
  React.useEffect(() => {
    if (!partnerId) return;

    const channel = supabase
      .channel(`partner_submissions:${partnerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_submissions',
          filter: `partner_id=eq.${partnerId}`,
        },
        (payload) => {
          console.log('Real-time submission update:', payload);
          queryClient.invalidateQueries({ queryKey: ['partnerSubmissions', partnerId] });
          queryClient.invalidateQueries({ queryKey: ['partnerDeliverables'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnerId, queryClient]);

  // Create a map of deliverable_id -> submissions array
  const submissionsByDeliverable = React.useMemo(() => {
    const map = {};
    allSubmissions.forEach(sub => {
      const deliverableId = sub.deliverable_id;
      if (!map[deliverableId]) {
        map[deliverableId] = [];
      }
      map[deliverableId].push(sub);
    });
    // Sort each array by version (newest first)
    Object.keys(map).forEach(deliverableId => {
      map[deliverableId].sort((a, b) => {
        const versionA = a.version || 0;
        const versionB = b.version || 0;
        if (versionA !== versionB) return versionB - versionA;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    });
    return map;
  }, [allSubmissions]);

  const getStatusConfig = (status) => {
    const normalizedStatus = status?.toLowerCase();
    const configs = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Pending Review",
        badge: "🟡 Pending"
      },
      submitted: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
        label: "Submitted",
        badge: "🔵 Submitted"
      },
      approved: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Approved",
        badge: "🟢 Approved"
      },
      rejected: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        label: "Rejected",
        badge: "🔴 Rejected"
      },
      revision_required: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: Clock,
        label: "Revision Required",
        badge: "🟠 Revision Required"
      },
      'revision needed': {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: Clock,
        label: "Revision Required",
        badge: "🟠 Revision Required"
      }
    };
    return configs[normalizedStatus] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: FileText,
      label: "Not Submitted",
      badge: "⚪ Not Submitted"
    };
  };

  // Submission mutation (handles file, url, and text types)
  const uploadMutation = useMutation({
    mutationFn: async ({ deliverableId, file, url, text, notes, deliverableType }) => {
      if (!partnerId || !deliverableId || !user?.partner_user?.id) {
        throw new Error("Missing required data for submission");
      }

      let fileUrl = null;
      let fileName = null;
      let fileSize = null;

      // Handle different submission types
      if (deliverableType === 'file') {
        if (!file) {
          throw new Error("Please select a file to upload");
        }
        // Generate unique filename
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
        const filePath = `deliverables/${partnerId}/${deliverableId}/${uniqueFileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('deliverables')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get signed URL for secure access (preferred)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('deliverables')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        // Fallback to public URL if signed URL fails
        if (!signedUrlError && signedUrlData?.signedUrl) {
          fileUrl = signedUrlData.signedUrl;
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('deliverables')
            .getPublicUrl(filePath);
          fileUrl = publicUrlData?.publicUrl;
        }

        if (!fileUrl) {
          throw new Error('Failed to get URL for uploaded file.');
        }

        fileName = file.name;
        fileSize = file.size;
      } else if (deliverableType === 'url') {
        if (!url || !url.trim()) {
          throw new Error("Please provide a URL");
        }
        // Validate URL format
        try {
          new URL(url);
        } catch {
          throw new Error("Please provide a valid URL");
        }
        fileUrl = url.trim();
        fileName = 'URL Submission';
      } else if (deliverableType === 'text') {
        if (!text || !text.trim()) {
          throw new Error("Please provide text content");
        }
        // Store text in notes field or create a text file
        fileUrl = null; // Text is stored in notes
        fileName = 'Text Submission';
        notes = (notes || '') + '\n\n--- Submission Text ---\n' + text;
      }

      // Always create a new version (version auto-incremented by database trigger)
      const submissionRecord = await partnerSubmissionsService.create({
        deliverable_id: deliverableId,
        partner_id: partnerId,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        status: 'submitted', // Set status to submitted
        submitted_by: user.partner_user.id,
        uploaded_by: user.partner_user.id,
        notes: notes || null,
      });

      // Update deliverable status to submitted
      await deliverablesService.update(deliverableId, {
        status: 'submitted',
        updated_at: new Date().toISOString(),
      });

      // Notify admins of new upload
      try {
        const deliverable = deliverables.find(d => d.id === deliverableId);
        
        // Get all admin users (they should have partner_id pointing to admin partner)
        const { data: adminUsers } = await supabase
          .from('partner_users')
          .select('partner_id, email')
          .in('role', ['admin', 'sef_admin']);
        
        if (adminUsers && adminUsers.length > 0) {
          // Get unique partner_ids for admins
          const adminPartnerIds = [...new Set(adminUsers.map(a => a.partner_id).filter(Boolean))];
          
          // Create notification for each admin partner
          const notificationPromises = adminPartnerIds.map(async (partnerId) => {
            await notificationsService.create({
              partner_id: partnerId,
              type: 'info',
              title: 'New Deliverable Upload',
              message: `${user?.full_name || user?.email} uploaded version ${submissionRecord.version || 1} for "${deliverable?.title || 'deliverable'}". Please review.`,
            });
          });
          await Promise.all(notificationPromises);
        }
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      // Log activity
      try {
        await activityLogService.create({
          activity_type: "deliverable_submitted",
          user_id: user.partner_user.id,
          partner_id: partnerId,
          description: `Uploaded version ${submissionRecord.version || 1} for deliverable "${deliverables.find(d => d.id === deliverableId)?.title || 'Unknown'}"`,
          metadata: {
            deliverable_id: deliverableId,
            submission_id: submissionRecord.id,
            file_name: file.name,
            version: submissionRecord.version || 1,
          }
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      return submissionRecord;
    },
    onSuccess: (submission) => {
      toast.success(`Submission successful! Version ${submission.version || 1} - Status: Submitted.`);
      queryClient.invalidateQueries({ queryKey: ['partnerDeliverables'] });
      queryClient.invalidateQueries({ queryKey: ['partnerSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['partnerProgress'] });
      queryClient.invalidateQueries({ queryKey: ['deliverableSubmissions'] });
      queryClient.invalidateQueries({ queryKey: ['deliverableComments'] });
      queryClient.invalidateQueries({ queryKey: ['pendingDeliverables'] });
      setUploadingDeliverable(null);
      setUploadFile(null);
      setUploadUrl("");
      setUploadText("");
      setUploadNotes("");
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
      setUploadProgress(0);
    },
  });

  const handleUploadClick = (deliverable) => {
    setUploadingDeliverable(deliverable);
    setUploadFile(null);
    setUploadUrl("");
    setUploadText("");
    setUploadNotes("");
    setUploadProgress(0);
  };

  const handleFileSelect = (file) => {
    setUploadFile(file);
  };

  const handleSubmitUpload = () => {
    if (!uploadingDeliverable) {
      toast.error("No deliverable selected");
      return;
    }

    const deliverableType = uploadingDeliverable.type || 'file';
    
    // Validate based on type
    if (deliverableType === 'file' && !uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }
    if (deliverableType === 'url' && !uploadUrl.trim()) {
      toast.error("Please provide a URL");
      return;
    }
    if (deliverableType === 'text' && !uploadText.trim()) {
      toast.error("Please provide text content");
      return;
    }

    uploadMutation.mutate({
      deliverableId: uploadingDeliverable.id,
      file: uploadFile,
      url: uploadUrl,
      text: uploadText,
      notes: uploadNotes,
      deliverableType: deliverableType,
    });
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading deliverables...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card className="border-red-200">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Deliverables</h3>
            <p className="text-gray-600">{error.message || "Failed to load deliverables. Please try again."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deliverables || deliverables.length === 0) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deliverables</h3>
            <p className="text-gray-600">
              There are no deliverables assigned to your partner account at this time.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Deliverables</h1>
          <p className="text-gray-600">
            View and submit your required deliverables ({deliverables.length} total)
          </p>
        </div>

        <div className="space-y-4">
          {deliverables.map((deliverable) => {
            const statusConfig = getStatusConfig(deliverable.submission_status);
            const StatusIcon = statusConfig.icon;
            const isOverdue = deliverable.due_date && 
              new Date(deliverable.due_date) < new Date() && 
              !deliverable.submission_status;

            // Get submissions for this deliverable from the map
            const submissions = submissionsByDeliverable[deliverable.id] || [];

            return (
              <Card key={deliverable.id} className="border-orange-100 shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{deliverable.title}</CardTitle>
                          {deliverable.is_required && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                              Required
                            </Badge>
                          )}
                          <Badge variant="outline" className={statusConfig.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusConfig.badge}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          {deliverable.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span className={isOverdue ? "text-red-600 font-semibold" : ""}>
                                Due: {format(new Date(deliverable.due_date), 'MMM d, yyyy')}
                              </span>
                              {isOverdue && (
                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs ml-1">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadClick(deliverable)}
                        className="border-orange-200 hover:bg-orange-50 text-orange-700"
                        disabled={deliverable.status === 'approved'}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {submissions.length > 0 ? 'Submit New Version' : 'Submit'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {submissions.length > 0 && (
                      <AccordionItem value="history">
                        <AccordionTrigger>
                          <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-gray-600" />
                            <span>Version History ({submissions.length})</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <DeliverableVersionHistory submissions={submissions} />
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    <AccordionItem value="comments">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-600" />
                          <span>Comments</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <DeliverableComments deliverableId={deliverable.id} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Upload Dialog */}
        <Dialog open={!!uploadingDeliverable} onOpenChange={() => {
          if (!uploadMutation.isPending) {
            setUploadingDeliverable(null);
            setUploadFile(null);
            setUploadNotes("");
            setUploadProgress(0);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Submit: {uploadingDeliverable?.name || uploadingDeliverable?.title}
              </DialogTitle>
              <DialogDescription>
                {uploadingDeliverable?.type === 'file' && 'Upload your file submission. Max file size: 10MB.'}
                {uploadingDeliverable?.type === 'url' && 'Provide the URL for your submission.'}
                {uploadingDeliverable?.type === 'text' && 'Enter your text submission.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* File Upload Type */}
              {uploadingDeliverable?.type === 'file' && (
                <>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 hover:border-gray-400 bg-gray-50"
                  >
                    <input
                      type="file"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="file-upload-input"
                      accept=".png,.jpg,.jpeg,.pdf,.docx,.xlsx,.doc,.xls,.zip,.rar"
                    />
                    <label htmlFor="file-upload-input" className="cursor-pointer w-full">
                      <Upload className="w-12 h-12 text-gray-400 mb-3 mx-auto" />
                      <p className="text-gray-600 text-center">Click to select file or drag and drop</p>
                      <p className="text-sm text-gray-500 mt-1 text-center">Max 10MB, PNG, JPG, PDF, DOCX, XLSX, ZIP, RAR</p>
                    </label>
                  </div>

                  {uploadFile && (
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-100">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-800">{uploadFile.name}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setUploadFile(null)}
                        disabled={uploadMutation.isPending}
                      >
                        <X className="w-4 h-4 text-gray-500" />
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* URL Type */}
              {uploadingDeliverable?.type === 'url' && (
                <div className="grid gap-2">
                  <Label htmlFor="url">URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="https://example.com/submission"
                    disabled={uploadMutation.isPending}
                    required
                  />
                  <p className="text-xs text-gray-500">Provide the full URL to your submission</p>
                </div>
              )}

              {/* Text Type */}
              {uploadingDeliverable?.type === 'text' && (
                <div className="grid gap-2">
                  <Label htmlFor="text">Text Content *</Label>
                  <Textarea
                    id="text"
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder="Enter your text submission here..."
                    rows={8}
                    disabled={uploadMutation.isPending}
                    required
                  />
                  <p className="text-xs text-gray-500">Enter the text content for this deliverable</p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Add any relevant notes for your submission"
                  disabled={uploadMutation.isPending}
                />
              </div>

              {uploadMutation.isPending && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadingDeliverable(null);
                  setUploadFile(null);
                  setUploadNotes("");
                  setUploadProgress(0);
                }}
                disabled={uploadMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitUpload}
                disabled={
                  uploadMutation.isPending ||
                  (uploadingDeliverable?.type === 'file' && !uploadFile) ||
                  (uploadingDeliverable?.type === 'url' && !uploadUrl.trim()) ||
                  (uploadingDeliverable?.type === 'text' && !uploadText.trim())
                }
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

