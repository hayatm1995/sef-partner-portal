import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function SubmissionCard({
  submission,
  onApprove,
  onReject,
  onRequestChanges,
  isProcessing,
  partnerName,
}) {
  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Pending Review",
        badge: "🟡 Pending"
      },
      pending_review: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock,
        label: "Pending Review",
        badge: "🟡 Pending"
      },
      under_review: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
        label: "Under Review",
        badge: "🔵 Under Review"
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
      changes_requested: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertCircle,
        label: "Changes Requested",
        badge: "🟠 Changes"
      },
      locked_for_printing: {
        color: "bg-slate-100 text-slate-800 border-slate-200",
        icon: FileText,
        label: "Locked for Printing",
        badge: "⚙️ Locked"
      },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(submission.status);
  const StatusIcon = statusConfig.icon;
  const deliverable = submission.deliverables;
  const submittedBy = submission.submitted_by_user;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">
                {deliverable?.name || 'Unknown Deliverable'}
              </CardTitle>
              {partnerName && (
                <p className="text-sm text-blue-600 font-medium mt-1">
                  {partnerName}
                </p>
              )}
            </div>
            <Badge variant="outline" className={statusConfig.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusConfig.badge}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-4 h-4" />
              <span className="truncate">{submission.file_name || 'File'}</span>
            </div>
            
            {submittedBy && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>Submitted by: {submittedBy.full_name || submittedBy.email}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Submitted: {format(new Date(submission.created_at), 'MMM d, yyyy')}</span>
            </div>

            {submission.rejection_reason && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200 cursor-help">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-800 line-clamp-2">{submission.rejection_reason}</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{submission.rejection_reason}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {submission.review_notes && !submission.rejection_reason && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-xs font-semibold text-orange-900 mb-1">Change Requests:</p>
                <p className="text-sm text-orange-800">{submission.review_notes}</p>
              </div>
            )}

            {deliverable?.notes && !submission.rejection_reason && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-900 mb-1">Notes:</p>
                <p className="text-sm text-yellow-800">{deliverable.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {submission.file_url && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(submission.file_url, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View File
              </Button>
            )}

            {['pending', 'pending_review', 'under_review', 'changes_requested'].includes(submission.status) && (
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
                  className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                  onClick={() => onRequestChanges && onRequestChanges(submission)}
                  disabled={isProcessing}
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Request Changes
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

            {submission.status === 'approved' && (
              <div className="p-2 bg-green-50 rounded text-xs text-green-700 text-center font-medium">
                ✓ Approved
              </div>
            )}

            {submission.status === 'rejected' && (
              <div className="p-2 bg-red-50 rounded text-xs text-red-700 text-center font-medium">
                ✗ Rejected
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}


