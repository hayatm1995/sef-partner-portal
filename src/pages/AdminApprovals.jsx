import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Plus, 
  Eye, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  FileText,
  Filter,
  Download,
  User,
  Users as UsersIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isPast, parseISO } from "date-fns";
import { toast } from "sonner";

export default function AdminApprovals() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [viewingApproval, setViewingApproval] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPartner, setFilterPartner] = useState("all");
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    file_type: "media_kit",
    deadline: "2025-12-15",
    assigned_partner_emails: [],
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [newComment, setNewComment] = useState("");

  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role !== 'admin' && !u.is_super_admin);
    },
    enabled: isAdmin,
  });

  const { data: approvals = [] } = useQuery({
    queryKey: ['partnerApprovals'],
    queryFn: () => base44.entities.PartnerApproval.list('-created_date'),
    enabled: isAdmin,
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      // Send notifications to partners
      const notificationPromises = data.assigned_partner_emails.map(partnerEmail =>
        base44.entities.StatusUpdate.create({
          partner_email: partnerEmail,
          title: "New File for Review & Approval",
          message: `${data.title}: Please review and respond before ${format(parseISO(data.deadline), 'MMM d, yyyy')}`,
          type: "action_required",
          read: false
        })
      );
      await Promise.all(notificationPromises);

      return base44.entities.PartnerApproval.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowUploadDialog(false);
      resetForm();
      toast.success('File uploaded and partners notified');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ approvalId, comment }) => {
      const approval = approvals.find(a => a.id === approvalId);
      const updatedThread = [
        ...(approval.comment_thread || []),
        {
          author_email: user.email,
          author_name: user.full_name,
          comment,
          timestamp: new Date().toISOString()
        }
      ];
      return base44.entities.PartnerApproval.update(approvalId, {
        comment_thread: updatedThread
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerApprovals'] });
      setNewComment("");
      toast.success('Comment added');
    },
  });

  const handleFileUpload = async () => {
    if (!fileToUpload) {
      toast.error('Please select a file');
      return;
    }

    if (uploadForm.assigned_partner_emails.length === 0) {
      toast.error('Please select at least one partner');
      return;
    }

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: fileToUpload });
      
      await uploadMutation.mutateAsync({
        ...uploadForm,
        file_url,
        file_name: fileToUpload.name,
        uploaded_by_admin: user.email,
        status: "pending",
        partner_responses: uploadForm.assigned_partner_emails.map(email => ({
          partner_email: email,
          response: "pending",
          comment: "",
          response_date: null
        })),
        comment_thread: [],
        reminder_sent: false,
        is_overdue: false
      });
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
    }
    setUploadingFile(false);
  };

  const resetForm = () => {
    setUploadForm({
      title: "",
      description: "",
      file_type: "media_kit",
      deadline: "2025-12-15",
      assigned_partner_emails: [],
    });
    setFileToUpload(null);
  };

  const getPartnerName = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.full_name || email;
  };

  const getPartnerCompany = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.company_name || '';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
      partially_approved: "bg-blue-100 text-blue-800 border-blue-300"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getResponseColor = (response) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      approved: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[response] || "bg-gray-100 text-gray-800";
  };

  const filteredApprovals = approvals.filter(approval => {
    const statusMatch = filterStatus === "all" || approval.status === filterStatus;
    const partnerMatch = filterPartner === "all" || 
      approval.assigned_partner_emails.includes(filterPartner);
    return statusMatch && partnerMatch;
  });

  const stats = {
    total: approvals.length,
    pending: approvals.filter(a => a.status === "pending").length,
    approved: approvals.filter(a => a.status === "approved").length,
    rejected: approvals.filter(a => a.status === "rejected").length,
    overdue: approvals.filter(a => isPast(parseISO(a.deadline)) && a.status === "pending").length
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Admin access required</p>
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Partner Approval System
            </h1>
            <p className="text-gray-600 mt-1">Upload files for partner review and approval</p>
          </div>
          <Button
            onClick={() => setShowUploadDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 shadow-lg"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Upload for Approval
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
                    <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-2 border-yellow-100 bg-gradient-to-br from-yellow-50 to-white shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Approved</p>
                    <p className="text-3xl font-bold text-green-700">{stats.approved}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-white shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Rejected</p>
                    <p className="text-3xl font-bold text-red-700">{stats.rejected}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Overdue</p>
                    <p className="text-3xl font-bold text-orange-700">{stats.overdue}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-2 border-purple-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-sm mb-2 block font-medium">Filter by Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="partially_approved">Partially Approved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-sm mb-2 block font-medium">Filter by Partner</Label>
                <Select value={filterPartner} onValueChange={setFilterPartner}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    {allPartners.map(partner => (
                      <SelectItem key={partner.id} value={partner.email}>
                        {partner.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approvals Grid */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredApprovals.map((approval, idx) => {
              const isOverdue = isPast(parseISO(approval.deadline)) && approval.status === "pending";
              const approvedCount = approval.partner_responses?.filter(r => r.response === "approved").length || 0;
              const totalCount = approval.partner_responses?.length || 0;
              const progressPercent = totalCount > 0 ? (approvedCount / totalCount) * 100 : 0;

              return (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border-2 hover:shadow-xl transition-all duration-300 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-purple-100'}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Section */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 mb-2">{approval.title}</h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="border-2">
                                  {approval.file_type.replace(/_/g, ' ')}
                                </Badge>
                                <Badge variant="outline" className={`border-2 ${getStatusColor(approval.status)}`}>
                                  {approval.status.replace(/_/g, ' ')}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="destructive" className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    OVERDUE
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-gray-500 mb-3">{approval.file_name}</p>

                          {approval.description && (
                            <p className="text-sm text-gray-600 mb-4">{approval.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                            <div className="flex items-center gap-2">
                              <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-gray-400'}`} />
                              <span className={isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                                Deadline: {format(parseISO(approval.deadline), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <UsersIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{totalCount} partner(s)</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium text-gray-600">Approval Progress</span>
                              <span className="text-xs font-semibold text-gray-900">
                                {approvedCount}/{totalCount} Approved
                              </span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                          </div>

                          {/* Partner Names */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {approval.assigned_partner_emails.slice(0, 3).map(email => {
                              const response = approval.partner_responses?.find(r => r.partner_email === email);
                              return (
                                <Badge 
                                  key={email} 
                                  variant="outline" 
                                  className={`${getResponseColor(response?.response || 'pending')} border-2`}
                                >
                                  <User className="w-3 h-3 mr-1" />
                                  {getPartnerName(email)}
                                </Badge>
                              );
                            })}
                            {approval.assigned_partner_emails.length > 3 && (
                              <Badge variant="outline" className="border-2 border-gray-300">
                                +{approval.assigned_partner_emails.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <Button
                            onClick={() => setViewingApproval(approval)}
                            className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details & Responses
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredApprovals.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="border-2 border-purple-100">
                <CardContent className="p-12 text-center">
                  <FileText className="w-20 h-20 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No approval requests found</h3>
                  <p className="text-gray-600 mb-6">Upload a file to get started with partner approvals</p>
                  <Button 
                    onClick={() => setShowUploadDialog(true)} 
                    className="bg-gradient-to-r from-purple-600 to-indigo-700"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Upload for Approval
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Upload File for Partner Approval
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-medium">Title *</Label>
                <Input
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Brand Guidelines Review"
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="font-medium">Description</Label>
                <Textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide context or instructions..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="font-medium">File Type *</Label>
                <Select
                  value={uploadForm.file_type}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, file_type: value }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="media_kit">Media Kit</SelectItem>
                    <SelectItem value="deliverable">Deliverable</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="branding_asset">Branding Asset</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="font-medium">Upload File *</Label>
                <Input
                  type="file"
                  onChange={(e) => setFileToUpload(e.target.files[0])}
                  className="mt-2"
                />
                {fileToUpload && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {fileToUpload.name}
                  </p>
                )}
              </div>

              <div>
                <Label className="font-medium mb-2 block">Assign to Partners * ({uploadForm.assigned_partner_emails.length} selected)</Label>
                <div className="border-2 rounded-lg p-4 max-h-64 overflow-y-auto space-y-2 bg-gray-50">
                  {allPartners.map(partner => (
                    <label key={partner.id} className="flex items-start gap-3 cursor-pointer hover:bg-white p-3 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={uploadForm.assigned_partner_emails.includes(partner.email)}
                        onChange={(e) => {
                          const emails = e.target.checked
                            ? [...uploadForm.assigned_partner_emails, partner.email]
                            : uploadForm.assigned_partner_emails.filter(email => email !== partner.email);
                          setUploadForm(prev => ({ ...prev, assigned_partner_emails: emails }));
                        }}
                        className="mt-1 rounded"
                      />
                      <div>
                        <p className="font-medium text-sm">{partner.full_name}</p>
                        <p className="text-xs text-gray-600">{partner.company_name || partner.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="font-medium">Approval Deadline *</Label>
                <Input
                  type="date"
                  value={uploadForm.deadline}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, deadline: e.target.value }))}
                  className="mt-2"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">Default: December 15, 2025</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={uploadingFile || !fileToUpload || !uploadForm.title || !uploadForm.deadline || uploadForm.assigned_partner_emails.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700"
                >
                  {uploadingFile ? 'Uploading...' : 'Upload & Notify Partners'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* View Details Dialog */}
      {viewingApproval && (
        <Dialog open={!!viewingApproval} onOpenChange={() => setViewingApproval(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{viewingApproval.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* File Info */}
              <Card className="border-2 border-purple-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    File Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">File:</span>
                      <a href={viewingApproval.file_url} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium">
                        <Download className="w-4 h-4" />
                        {viewingApproval.file_name}
                      </a>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Type:</span>
                      <Badge variant="outline" className="border-2">
                        {viewingApproval.file_type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Deadline:</span>
                      <span className="text-sm font-semibold">
                        {format(parseISO(viewingApproval.deadline), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Status:</span>
                      <Badge variant="outline" className={`border-2 ${getStatusColor(viewingApproval.status)}`}>
                        {viewingApproval.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  {viewingApproval.description && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Description:</span>
                      <p className="text-sm p-3 bg-gray-50 rounded-lg">{viewingApproval.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Partner Responses */}
              <Card className="border-2 border-purple-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UsersIcon className="w-5 h-5" />
                    Partner Responses ({viewingApproval.partner_responses?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {viewingApproval.partner_responses?.map((response, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 border-2 rounded-lg bg-gradient-to-r from-gray-50 to-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-5 h-5 text-gray-600" />
                              <span className="font-bold text-gray-900">{getPartnerName(response.partner_email)}</span>
                            </div>
                            {getPartnerCompany(response.partner_email) && (
                              <p className="text-sm text-gray-600 ml-7">{getPartnerCompany(response.partner_email)}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={`border-2 ${getResponseColor(response.response)}`}>
                            {response.response}
                          </Badge>
                        </div>
                        {response.comment && (
                          <div className="ml-7 mt-3 p-3 bg-white border-l-4 border-purple-400 rounded">
                            <p className="text-sm font-medium text-gray-600 mb-1">Comment:</p>
                            <p className="text-sm text-gray-800">{response.comment}</p>
                          </div>
                        )}
                        {response.response_date && (
                          <p className="text-xs text-gray-500 mt-3 ml-7">
                            Responded on {format(parseISO(response.response_date), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comment Thread */}
              <Card className="border-2 border-purple-100">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments & Discussion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {viewingApproval.comment_thread?.map((comment, idx) => (
                      <div key={idx} className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border-l-4 border-purple-400">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">{comment.author_name}</span>
                          <span className="text-xs text-gray-500">
                            {format(parseISO(comment.timestamp), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (newComment.trim()) {
                          addCommentMutation.mutate({
                            approvalId: viewingApproval.id,
                            comment: newComment
                          });
                        }
                      }}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="bg-gradient-to-r from-purple-600 to-indigo-700"
                    >
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}