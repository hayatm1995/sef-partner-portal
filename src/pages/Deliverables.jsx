import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

import FileUploader from "../components/deliverables/FileUploader";
import DeliverableCard from "../components/deliverables/DeliverableCard";

export default function Deliverables() {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;

  // Get viewAs parameter for admin viewing as partner
  const urlParams = new URLSearchParams(location.search);
  const viewAsEmail = urlParams.get('viewAs');
  const effectiveEmail = viewAsEmail || user?.email;

  const { data: deliverables = [], isLoading } = useQuery({
    queryKey: ['deliverables', effectiveEmail, isAdmin, viewAsEmail],
    queryFn: async () => {
      if (isAdmin && !viewAsEmail) {
        // Admin viewing all deliverables INCLUDING archived ones
        return base44.entities.Deliverable.list('-created_date');
      } else {
        // Partner viewing their own OR admin viewing as specific partner - EXCLUDE archived
        const allDeliverables = await base44.entities.Deliverable.filter({ 
          partner_email: effectiveEmail 
        }, '-created_date');
        return allDeliverables.filter(d => d.status !== 'archived');
      }
    },
    enabled: !!user,
  });

  const createDeliverableMutation = useMutation({
    mutationFn: (data) => base44.entities.Deliverable.create(data),
    onSuccess: async (newDeliverable) => {
      // Log the activity
      try {
        await base44.entities.ActivityLog.create({
          activity_type: "deliverable_submitted",
          user_email: user.email,
          description: `Deliverable uploaded: "${newDeliverable.title}" (${newDeliverable.type})`,
          metadata: {
            deliverable_id: newDeliverable.id,
            deliverable_type: newDeliverable.type,
            file_name: newDeliverable.file_name
          }
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
      setIsUploading(false);
    },
  });

  const deleteDeliverableMutation = useMutation({
    mutationFn: (id) => base44.entities.Deliverable.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliverables'] });
    },
  });

  const handleUpload = async (formData) => {
    createDeliverableMutation.mutate({
      ...formData,
      partner_email: effectiveEmail,
    });
  };

  const filteredDeliverables = activeTab === "all" 
    ? deliverables 
    : deliverables.filter(d => d.status === activeTab);

  const getStatusCount = (status) => {
    return deliverables.filter(d => d.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deliverables...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deliverables</h1>
            <p className="text-gray-600 mt-1">
              {isAdmin && !viewAsEmail
                ? `All partner deliverables (${deliverables.length} total)` 
                : 'Upload and manage your files and documents'}
            </p>
          </div>
          {(!isAdmin || viewAsEmail) && (
            <Button
              onClick={() => setIsUploading(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New File
            </Button>
          )}
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {isUploading && (
            <FileUploader
              onClose={() => setIsUploading(false)}
              onUpload={handleUpload}
              isLoading={createDeliverableMutation.isPending}
            />
          )}
        </AnimatePresence>

        {/* Filters */}
        <Card className="mb-6 border-orange-100 shadow-md">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2">
                <TabsTrigger value="all" className="gap-2">
                  All ({deliverables.length})
                </TabsTrigger>
                <TabsTrigger value="pending_review" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Pending ({getStatusCount('pending_review')})
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approved ({getStatusCount('approved')})
                </TabsTrigger>
                <TabsTrigger value="revision_needed" className="gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Revision ({getStatusCount('revision_needed')})
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  <XCircle className="w-4 h-4" />
                  Rejected ({getStatusCount('rejected')})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Deliverables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredDeliverables.map((deliverable) => (
              <DeliverableCard
                key={deliverable.id}
                deliverable={deliverable}
                onDelete={() => deleteDeliverableMutation.mutate(deliverable.id)}
                isAdmin={isAdmin && !viewAsEmail}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredDeliverables.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No deliverables found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === "all" 
                ? isAdmin && !viewAsEmail
                  ? "No deliverables have been uploaded by any partner yet"
                  : "Upload your first file to get started" 
                : `No deliverables with "${activeTab.replace(/_/g, ' ')}" status`}
            </p>
            {activeTab === "all" && (!isAdmin || viewAsEmail) && (
              <Button onClick={() => setIsUploading(true)} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}