import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  FileCheck,
  Clock,
  XCircle,
  CheckCircle,
  Calendar,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import SubmissionUploader from "./SubmissionUploader";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DeliverableCard({ 
  deliverable, 
  onDelete, 
  onApprove, 
  onReject, 
  isAdmin,
  submission,
  partnerId,
  userId,
  onSubmissionSuccess,
  isProcessing = false
}) {
  const [showUploader, setShowUploader] = useState(false);
  const getFileIcon = (type) => {
    const icons = {
      'Media Asset': ImageIcon,
      'PR Requirement': FileText,
      'Document': FileText,
    };
    return icons[type] || FileText;
  };

  const getStatusConfig = (status) => {
    const configs = {
      'Pending Review': {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Pending Review"
      },
      'Approved': {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Approved"
      },
      'Rejected': {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        label: "Rejected"
      }
    };
    return configs[status] || configs['Pending Review'];
  };

  const getTypeGradient = (type) => {
    const gradients = {
      'Media Asset': "from-purple-500 to-purple-600",
      'PR Requirement': "from-blue-500 to-blue-600",
      'Document': "from-gray-500 to-gray-600"
    };
    return gradients[type] || gradients['Document'];
  };

  const FileIcon = getFileIcon(deliverable.type);
  const statusConfig = getStatusConfig(deliverable.status);
  const StatusIcon = statusConfig.icon;
  const gradient = getTypeGradient(deliverable.type);

  // Get submission status (if submission exists)
  const submissionStatus = submission?.status || null;
  const hasSubmission = !!submission;
  const isPending = submissionStatus === 'pending';
  const isApproved = submissionStatus === 'approved';
  const isRejected = submissionStatus === 'rejected';
  
  // Disable delete/edit when submission is pending or approved
  // Allow upload if no submission, rejected, or if admin
  const canDelete = !isAdmin && !isPending && !isApproved;
  const canUpload = !isAdmin && (!hasSubmission || isRejected);

  // Get status badge for submission
  const getSubmissionStatusBadge = () => {
    if (!hasSubmission) return null;
    
    const statusConfigs = {
      'pending': {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "🟡 Pending Review"
      },
      'approved': {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "🟢 Approved"
      },
      'rejected': {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        label: "🔴 Rejected"
      }
    };
    
    const config = statusConfigs[submissionStatus] || statusConfigs.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Get tooltip content for rejection reason
  const getRejectionTooltip = () => {
    if (isRejected && submission?.rejection_reason) {
      return submission.rejection_reason;
    }
    return null;
  };


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{deliverable.name || 'Untitled Deliverable'}</CardTitle>
              {isAdmin && deliverable.partners && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-blue-600">
                    {deliverable.partners.name || 'Unknown Partner'}
                  </p>
                  {deliverable.partners.tier && (
                    <p className="text-xs text-gray-500">
                      {deliverable.partners.tier}
                    </p>
                  )}
                </div>
              )}
            </div>
            {!isAdmin && canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={statusConfig.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.label}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {deliverable.type}
            </Badge>
            {getSubmissionStatusBadge() && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      {getSubmissionStatusBadge()}
                    </div>
                  </TooltipTrigger>
                  {getRejectionTooltip() && (
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-1">Rejection Reason:</p>
                      <p>{getRejectionTooltip()}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 mb-4">
            {submission?.file_url && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileIcon className="w-4 h-4" />
                <span className="truncate">{submission.file_name || submission.file_url.split('/').pop() || 'File'}</span>
              </div>
            )}
            {!submission?.file_url && deliverable.file_url && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FileIcon className="w-4 h-4" />
                <span className="truncate italic">No file uploaded yet</span>
              </div>
            )}
            {deliverable.created_at && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(deliverable.created_at), 'MMM d, yyyy')}</span>
              </div>
            )}
            {deliverable.due_date && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <Clock className="w-4 h-4" />
                <span>Due: {format(new Date(deliverable.due_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {submission?.rejection_reason && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                <p className="text-sm text-red-800">{submission.rejection_reason}</p>
              </div>
            )}
            {deliverable.notes && !submission?.rejection_reason && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-900 mb-1">Notes:</p>
                <p className="text-sm text-yellow-800">{deliverable.notes}</p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {submission?.file_url && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(submission.file_url, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View File
              </Button>
            )}
            {!isAdmin && canUpload && (
              <Button
                variant="outline"
                className="w-full border-orange-200 hover:bg-orange-50 text-orange-700"
                onClick={() => setShowUploader(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                {hasSubmission ? 'Re-upload File' : 'Upload File'}
              </Button>
            )}
            {!isAdmin && !canUpload && (isPending || isApproved) && (
              <div className="p-2 bg-gray-50 rounded text-xs text-gray-600 text-center">
                {isPending ? 'Submission is pending review' : 'Submission has been approved'}
              </div>
            )}
            {isAdmin && submission && submission.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={() => onApprove && onApprove(submission.id)}
                  disabled={isProcessing}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  onClick={() => onReject && onReject(submission)}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submission Uploader Modal */}
      <AnimatePresence>
        {showUploader && (
          <SubmissionUploader
            deliverable={deliverable}
            partnerId={partnerId}
            userId={userId}
            onClose={() => setShowUploader(false)}
            onSuccess={async (submissionData) => {
              if (onSubmissionSuccess) {
                await onSubmissionSuccess(submissionData);
              }
              setShowUploader(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}