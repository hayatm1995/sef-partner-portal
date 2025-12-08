import React from "react";
import { usePartnerDeliverables } from "@/hooks/usePartnerDeliverables";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function DeliverablesSection() {
  const { data: deliverables, isLoading, error } = usePartnerDeliverables();
  const navigate = useNavigate();

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
        icon: AlertCircle,
        label: "Revision Required",
        badge: "🟠 Needs Changes"
      },
      'revision needed': {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertCircle,
        label: "Revision Required",
        badge: "🟠 Needs Changes"
      }
    };
    return configs[normalizedStatus] || null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading deliverables...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Deliverables</h3>
          <p className="text-gray-600">{error.message || "Failed to load deliverables. Please try again."}</p>
        </CardContent>
      </Card>
    );
  }

  if (!deliverables || deliverables.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Deliverables</h3>
          <p className="text-gray-600 mb-6">
            There are no deliverables assigned to your partner account at this time.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/Deliverables")}
            className="border-orange-200 hover:bg-orange-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Go to Deliverables Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Deliverables & Submissions</h2>
          <p className="text-gray-600 mt-1">
            View your required deliverables and submission status
          </p>
        </div>
        <Button
          onClick={() => navigate("/Deliverables")}
          className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Manage Deliverables
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliverables.map((deliverable) => {
          const statusConfig = getStatusConfig(deliverable.submission_status);
          const StatusIcon = statusConfig?.icon || FileText;
          const isOverdue = deliverable.due_date && new Date(deliverable.due_date) < new Date() && !deliverable.submission_status;

          return (
            <motion.div
              key={deliverable.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
            >
              <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                      {deliverable.title}
                    </CardTitle>
                    {deliverable.is_required && (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                        Required
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statusConfig && (
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.badge}
                      </Badge>
                    )}
                    {!deliverable.submission_status && (
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                        Not Submitted
                      </Badge>
                    )}
                    {isOverdue && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-4">
                    {deliverable.due_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Due: {format(new Date(deliverable.due_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                    {deliverable.submitted_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          Submitted: {format(new Date(deliverable.submitted_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {deliverable.submission_url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(deliverable.submission_url, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Submission
                      </Button>
                    )}
                    {!deliverable.submission_status && (
                      <Button
                        variant="outline"
                        className="w-full border-orange-200 hover:bg-orange-50 text-orange-700"
                        onClick={() => navigate("/Deliverables")}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


