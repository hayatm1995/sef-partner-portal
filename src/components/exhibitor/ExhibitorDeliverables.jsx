import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { deliverablesService, partnerSubmissionsService } from "@/services/supabaseService";
import { supabase } from "@/config/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Upload, 
  File, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  Download,
  Link as LinkIcon
} from "lucide-react";
import { toast } from "sonner";

export default function ExhibitorDeliverables({ booth, partnerId }) {
  const { user, partnerUser } = useAuth();
  const queryClient = useQueryClient();
  const [uploadingDeliverable, setUploadingDeliverable] = useState(null);
  const [linkUrl, setLinkUrl] = useState({});
  const [showLinkInput, setShowLinkInput] = useState({});

  const buildOption = booth?.build_option || 'sef_built';

  // Fetch exhibitor deliverables
  const { data: exhibitorDeliverables = [], isLoading } = useQuery({
    queryKey: ['exhibitorDeliverables', buildOption],
    queryFn: () => deliverablesService.getExhibitorDeliverables(buildOption),
    enabled: !!booth,
  });

  // Fetch submissions for this partner
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['exhibitorSubmissions', partnerId],
    queryFn: () => partnerSubmissionsService.getByPartnerId(partnerId),
    enabled: !!partnerId,
  });

  // Create map of deliverable_id -> latest submission
  const submissionsMap = useMemo(() => {
    const map = {};
    allSubmissions.forEach(sub => {
      const deliverableId = sub.deliverable_id;
      if (!map[deliverableId] || new Date(sub.created_at) > new Date(map[deliverableId].created_at)) {
        map[deliverableId] = sub;
      }
    });
    return map;
  }, [allSubmissions]);

  // Get status for a deliverable
  const getDeliverableStatus = (deliverable) => {
    const submission = submissionsMap[deliverable.id];
    if (!submission) return 'not_submitted';
    return submission.status || 'pending';
  };

  // Status config
  const getStatusConfig = (status) => {
    const configs = {
      not_submitted: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Not Submitted',
        icon: AlertCircle,
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending Review',
        icon: Clock,
      },
      pending_review: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Pending Review',
        icon: Clock,
      },
      under_review: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Under Review',
        icon: Clock,
      },
      approved: {
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Approved',
        icon: CheckCircle,
      },
      rejected: {
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Rejected',
        icon: XCircle,
      },
      changes_requested: {
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Changes Requested',
        icon: XCircle,
      },
      locked_for_printing: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Locked for Printing',
        icon: File,
      },
    };
    return configs[status] || configs.not_submitted;
  };

  // File upload handler
  const handleFileUpload = async (deliverable, file) => {
    if (!file || !partnerId || !partnerUser?.id) {
      toast.error('Missing required information');
      return;
    }

    try {
      setUploadingDeliverable(deliverable.id);
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `deliverables/${partnerId}/${deliverable.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deliverables')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('deliverables')
        .getPublicUrl(filePath);

      const file_url = urlData.publicUrl;

      // Create submission
      const submission = await partnerSubmissionsService.create({
        deliverable_id: deliverable.id,
        partner_id: partnerId,
        file_url,
        file_name: file.name,
        file_size: file.size,
        status: 'pending_review',
        submitted_by: partnerUser.id,
      });

      // Send notification to admin
      try {
        const { notificationsService } = await import('@/services/supabaseService');
        await notificationsService.create({
          partner_id: partnerId,
          type: 'info',
          title: 'New Submission Received',
          message: `A new submission has been uploaded for "${deliverable.name}". Please review.`,
          metadata: {
            submission_id: submission.id,
            deliverable_id: deliverable.id,
            deliverable_name: deliverable.name,
          }
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      toast.success('File uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['exhibitorSubmissions', partnerId] });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploadingDeliverable(null);
    }
  };

  // Link submission handler
  const handleLinkSubmit = async (deliverable) => {
    const url = linkUrl[deliverable.id];
    if (!url || !partnerId || !partnerUser?.id) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      setUploadingDeliverable(deliverable.id);

      const submission = await partnerSubmissionsService.create({
        deliverable_id: deliverable.id,
        partner_id: partnerId,
        file_url: url,
        file_name: 'External Link',
        file_size: 0,
        status: 'pending_review',
        submitted_by: partnerUser.id,
      });

      // Send notification to admin
      try {
        const { notificationsService } = await import('@/services/supabaseService');
        await notificationsService.create({
          partner_id: partnerId,
          type: 'info',
          title: 'New Submission Received',
          message: `A new submission has been submitted for "${deliverable.name}". Please review.`,
          metadata: {
            submission_id: submission.id,
            deliverable_id: deliverable.id,
            deliverable_name: deliverable.name,
          }
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
      }

      toast.success('Link submitted successfully!');
      setLinkUrl({ ...linkUrl, [deliverable.id]: '' });
      setShowLinkInput({ ...showLinkInput, [deliverable.id]: false });
      queryClient.invalidateQueries({ queryKey: ['exhibitorSubmissions', partnerId] });
    } catch (error) {
      console.error('Link submission error:', error);
      toast.error(error.message || 'Submission failed');
    } finally {
      setUploadingDeliverable(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading deliverables...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exhibitor Deliverables</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {buildOption === 'custom_build' 
            ? 'Complete all deliverables for your custom build booth'
            : 'Complete all deliverables for your SEF-built booth'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {exhibitorDeliverables.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No deliverables found. Please contact admin.
          </div>
        ) : (
          exhibitorDeliverables.map((deliverable) => {
            const status = getDeliverableStatus(deliverable);
            const statusConfig = getStatusConfig(status);
            const submission = submissionsMap[deliverable.id];
            const StatusIcon = statusConfig.icon;
            const canSubmit = status !== 'approved' && status !== 'locked_for_printing';

            return (
              <div
                key={deliverable.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{deliverable.name}</h4>
                      {!deliverable.is_required && (
                        <Badge variant="outline" className="text-xs">Optional</Badge>
                      )}
                    </div>
                    {deliverable.notes && (
                      <p className="text-sm text-gray-600">{deliverable.notes}</p>
                    )}
                  </div>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {submission && (
                  <div className="bg-gray-50 rounded p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Submitted: {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                      {submission.file_url && (
                        <div className="flex gap-2">
                          {submission.file_url.startsWith('http') && !submission.file_url.includes('supabase') ? (
                            <a
                              href={submission.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="w-4 h-4" />
                              View Link
                            </a>
                          ) : (
                            <a
                              href={submission.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline flex items-center gap-1"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    {submission.review_notes && (
                      <div className="text-sm text-gray-700 bg-white rounded p-2 border">
                        <strong>Admin Notes:</strong> {submission.review_notes}
                      </div>
                    )}
                  </div>
                )}

                {canSubmit && (
                  <div className="flex gap-2">
                    <input
                      type="file"
                      id={`file-${deliverable.id}`}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(deliverable, file);
                      }}
                      disabled={uploadingDeliverable === deliverable.id}
                    />
                    <label htmlFor={`file-${deliverable.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={uploadingDeliverable === deliverable.id}
                        asChild
                      >
                        <span>
                          {uploadingDeliverable === deliverable.id ? (
                            <>Uploading...</>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload File
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinkInput({ ...showLinkInput, [deliverable.id]: true })}
                      disabled={uploadingDeliverable === deliverable.id}
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Submit Link
                    </Button>
                  </div>
                )}

                {showLinkInput[deliverable.id] && (
                  <div className="space-y-2 border-t pt-3">
                    <Label>Enter URL</Label>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={linkUrl[deliverable.id] || ''}
                        onChange={(e) => setLinkUrl({ ...linkUrl, [deliverable.id]: e.target.value })}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleLinkSubmit(deliverable)}
                        disabled={uploadingDeliverable === deliverable.id}
                      >
                        Submit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowLinkInput({ ...showLinkInput, [deliverable.id]: false });
                          setLinkUrl({ ...linkUrl, [deliverable.id]: '' });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

