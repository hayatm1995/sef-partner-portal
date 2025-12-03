import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image as ImageIcon,
  Presentation,
  Map,
  Download,
  Eye,
  Trash2,
  FileCheck,
  Clock,
  XCircle,
  AlertCircle,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function DeliverableCard({ deliverable, onDelete, isAdmin }) {
  const getFileIcon = (type) => {
    const icons = {
      contract: FileText,
      media_asset: ImageIcon,
      logo: ImageIcon,
      presentation: Presentation,
      floorplan: Map,
      other: FileText
    };
    return icons[type] || FileText;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending_review: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "Pending Review"
      },
      approved: {
        color: "bg-green-100 text-green-800",
        icon: FileCheck,
        label: "Approved"
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Rejected"
      },
      revision_needed: {
        color: "bg-orange-100 text-orange-800",
        icon: AlertCircle,
        label: "Revision Needed"
      }
    };
    return configs[status] || configs.pending_review;
  };

  const getTypeGradient = (type) => {
    const gradients = {
      contract: "from-blue-500 to-blue-600",
      media_asset: "from-purple-500 to-purple-600",
      logo: "from-pink-500 to-pink-600",
      presentation: "from-green-500 to-green-600",
      floorplan: "from-orange-500 to-orange-600",
      other: "from-gray-500 to-gray-600"
    };
    return gradients[type] || gradients.other;
  };

  const FileIcon = getFileIcon(deliverable.type);
  const statusConfig = getStatusConfig(deliverable.status);
  const StatusIcon = statusConfig.icon;
  const gradient = getTypeGradient(deliverable.type);

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const getPartnerName = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.full_name || email;
  };

  const getPartnerCompany = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.company_name || '';
  };

    const getStatusColor = (status) => {
    switch (status) {
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'revision_needed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
              <CardTitle className="text-lg line-clamp-2">{deliverable.title}</CardTitle>
              {isAdmin && (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-medium text-blue-600">
                    {getPartnerName(deliverable.partner_email)}
                  </p>
                  {getPartnerCompany(deliverable.partner_email) && (
                    <p className="text-xs text-gray-500">
                      {getPartnerCompany(deliverable.partner_email)}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">{deliverable.partner_email}</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getStatusColor(deliverable.status)}>
              {deliverable.status.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {deliverable.type.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-between">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileIcon className="w-4 h-4" />
              <span className="truncate">{deliverable.file_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(deliverable.created_date), 'MMM d, yyyy h:mm a')}</span>
            </div>
            {deliverable.notes && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-xs font-semibold text-yellow-900 mb-1">Admin Feedback:</p>
                <p className="text-sm text-yellow-800">{deliverable.notes}</p>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open(deliverable.file_url, '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            View File
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}