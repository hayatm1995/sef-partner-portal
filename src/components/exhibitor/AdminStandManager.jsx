import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Building2,
  Edit,
  ExternalLink,
  Download,
  MessageSquare,
  Save,
  Search,
  Plus,
  Settings,
  CheckCircle2,
  AlertCircle,
  Upload,
  Zap,
  Trash2
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import StandDiscussionWall from "./StandDiscussionWall";

export default function AdminStandManager({ stands, allPartners, onConfigClick, currentUser }) {
  const [selectedStand, setSelectedStand] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(false);
  const [commentingOnArtwork, setCommentingOnArtwork] = useState(null);
  const [artworkComment, setArtworkComment] = useState("");
  const [creatingNewStand, setCreatingNewStand] = useState(false);
  const [selectedPartnerForNew, setSelectedPartnerForNew] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [discussionStand, setDiscussionStand] = useState(null);

  const [adminForm, setAdminForm] = useState({
    booth_number: "",
    booth_construction_type: "",
    technical_drawing_link: "",
    stand_render_link: "",
    technical_specs_link: "",
    branding_areas_link: "",
    exhibitor_manual_link: "",
    submission_deadline: "",
    admin_notes: "",
    revision_feedback: "",
    status: "pending_partner_review",
    admin_defined_voltages: []
  });

  const [newVoltageForStand, setNewVoltageForStand] = useState("");

  const queryClient = useQueryClient();

  const adminUpdateMutation = useMutation({
    mutationFn: async ({ standId, data }) => {
      return await base44.entities.ExhibitorStand.update(standId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitorStands'] });
      toast.success("Stand updated successfully!");
      setEditingAdmin(false);
      setSelectedStand(null);
    }
  });

  const createNewStandMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ExhibitorStand.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitorStands'] });
      toast.success("Stand created successfully!");
      setCreatingNewStand(false);
      setSelectedPartnerForNew("");
      setAdminForm({
        booth_number: "",
        booth_construction_type: "",
        technical_drawing_link: "",
        stand_render_link: "",
        technical_specs_link: "",
        branding_areas_link: "",
        exhibitor_manual_link: "",
        submission_deadline: "",
        admin_notes: "",
        revision_feedback: "",
        status: "pending_partner_review",
        admin_defined_voltages: []
      });
    }
  });

  const deleteStandMutation = useMutation({
    mutationFn: async (standId) => {
      return await base44.entities.ExhibitorStand.delete(standId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitorStands'] });
      toast.success("Stand deleted successfully!");
    }
  });

  const getPartnerInfo = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return {
      name: partner?.full_name || email,
      company: partner?.company_name || ''
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_partner_review: "bg-gray-100 text-gray-800",
      pending_admin_review: "bg-blue-100 text-blue-800",
      revision_needed: "bg-orange-100 text-orange-800",
      approved: "bg-green-100 text-green-800",
      completed: "bg-purple-100 text-purple-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const handleAdminSave = async (e, stand) => {
    e.preventDefault();

    const updateData = { ...adminForm };

    if (adminForm.status !== stand.status) {
      const revisionEntry = {
        status: adminForm.status,
        feedback: adminForm.revision_feedback || "",
        changed_by: "Admin",
        changed_at: new Date().toISOString()
      };

      const existingHistory = stand.revision_history || [];
      updateData.revision_history = [...existingHistory, revisionEntry];
    }

    await adminUpdateMutation.mutateAsync({
      standId: stand.id,
      data: updateData
    });
  };

  const handleArtworkFeedback = async (artworkIndex, stand) => {
    if (!artworkComment.trim()) return;

    const updatedArtwork = [...(stand.artwork_submissions || [])];
    const artwork = updatedArtwork[artworkIndex];

    const feedback = {
      comment: artworkComment,
      created_by: "Admin",
      created_at: new Date().toISOString()
    };

    artwork.admin_feedback = [...(artwork.admin_feedback || []), feedback];

    await adminUpdateMutation.mutateAsync({
      standId: stand.id,
      data: { artwork_submissions: updatedArtwork }
    });

    setCommentingOnArtwork(null);
    setArtworkComment("");
    toast.success("Feedback added");
  };

  const handleCreateStand = async (e) => {
    e.preventDefault();
    await createNewStandMutation.mutateAsync({
      partner_email: selectedPartnerForNew,
      ...adminForm,
      status: "pending"
    });
  };

  const filteredStands = stands.filter(stand => {
    const matchesStatus = statusFilter === "all" || stand.status === statusFilter;
    const partnerInfo = getPartnerInfo(stand.partner_email);
    const matchesSearch = searchQuery === "" ||
      partnerInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partnerInfo.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stand.partner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stand.booth_number?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Stats & Actions Header */}
      <div className="grid md:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("all")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{stands.length}</p>
            <p className="text-xs text-gray-600">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("pending_partner_review")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{stands.filter(s => s.status === 'pending_partner_review').length}</p>
            <p className="text-xs text-gray-600">Partner Review</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("pending_admin_review")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stands.filter(s => s.status === 'pending_admin_review').length}</p>
            <p className="text-xs text-gray-600">To Review</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("revision_needed")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{stands.filter(s => s.status === 'revision_needed').length}</p>
            <p className="text-xs text-gray-600">Revisions</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter("approved")}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stands.filter(s => s.status === 'approved').length}</p>
            <p className="text-xs text-gray-600">Approved</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-purple-50" onClick={onConfigClick}>
          <CardContent className="p-4 text-center">
            <Settings className="w-8 h-8 mx-auto text-indigo-600 mb-1" />
            <p className="text-xs text-gray-700 font-medium">Configure</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search partners or booth numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setCreatingNewStand(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              New Stand
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Stand Form */}
      <AnimatePresence>
        {creatingNewStand && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-green-300">
              <CardHeader className="bg-green-50">
                <CardTitle>Create New Exhibitor Stand</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateStand} className="space-y-4">
                  <div>
                    <Label>Partner *</Label>
                    <Select value={selectedPartnerForNew} onValueChange={setSelectedPartnerForNew} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select partner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allPartners
                          .filter(p => p.role === 'user')
                          .filter(p => !stands.find(s => s.partner_email === p.email))
                          .map((partner) => (
                            <SelectItem key={partner.id} value={partner.email}>
                              {partner.full_name} - {partner.company_name || partner.email}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Booth Number</Label>
                      <Input
                        value={adminForm.booth_number}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, booth_number: e.target.value }))}
                        placeholder="e.g., A-12"
                      />
                    </div>
                    <div>
                      <Label>Submission Deadline</Label>
                      <Input
                        type="datetime-local"
                        value={adminForm.submission_deadline}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, submission_deadline: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Booth Construction Type *</Label>
                    <Select
                      value={adminForm.booth_construction_type}
                      onValueChange={(value) => setAdminForm(prev => ({ ...prev, booth_construction_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select who builds the booth..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sef_built">SEF Team Builds Booth</SelectItem>
                        <SelectItem value="partner_built">Partner Builds Own Booth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-blue-900">📎 Stand Documentation Links</p>
                    <p className="text-xs text-blue-700">Paste links to Google Drive, Dropbox, WeTransfer, OneDrive, Figma, or any URL</p>
                    
                    <div>
                      <Label className="text-xs">Technical Drawing Link</Label>
                      <Input
                        type="url"
                        value={adminForm.technical_drawing_link}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, technical_drawing_link: e.target.value }))}
                        placeholder="https://drive.google.com/..."
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Stand Render Link</Label>
                      <Input
                        type="url"
                        value={adminForm.stand_render_link}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, stand_render_link: e.target.value }))}
                        placeholder="https://dropbox.com/..."
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Technical Specs Link</Label>
                      <Input
                        type="url"
                        value={adminForm.technical_specs_link}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, technical_specs_link: e.target.value }))}
                        placeholder="https://onedrive.com/..."
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Branding Areas Link</Label>
                      <Input
                        type="url"
                        value={adminForm.branding_areas_link}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, branding_areas_link: e.target.value }))}
                        placeholder="https://figma.com/..."
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Exhibitor Manual Link</Label>
                      <Input
                        type="url"
                        value={adminForm.exhibitor_manual_link}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, exhibitor_manual_link: e.target.value }))}
                        placeholder="https://..."
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCreatingNewStand(false);
                        setSelectedPartnerForNew("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!selectedPartnerForNew}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stands List */}
      <div className="space-y-4">
        {filteredStands.map((stand) => {
          const partnerInfo = getPartnerInfo(stand.partner_email);
          const isEditing = selectedStand?.id === stand.id && editingAdmin;

          return (
            <Card key={stand.id} className="border-l-4" style={{
              borderLeftColor: 
                stand.status === 'approved' ? '#10B981' :
                stand.status === 'revision_needed' ? '#F59E0B' :
                stand.status === 'artwork_submitted' ? '#3B82F6' :
                '#9CA3AF'
            }}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{partnerInfo.name}</h3>
                      <Badge className={getStatusColor(stand.status)}>
                        {stand.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{partnerInfo.company}</p>
                    <p className="text-xs text-gray-500">{stand.partner_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDiscussionStand(discussionStand?.id === stand.id ? null : stand)}
                      className={discussionStand?.id === stand.id ? "bg-indigo-50 border-indigo-300" : ""}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                      {stand.discussion_thread?.length > 0 && (
                        <Badge className="ml-2 bg-indigo-500 text-white text-xs px-1.5">
                          {stand.discussion_thread.length}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStand(stand);
                        setEditingAdmin(true);
                        setDiscussionStand(null);
                        setAdminForm({
                          booth_number: stand.booth_number || "",
                          booth_construction_type: stand.booth_construction_type || "",
                          technical_drawing_link: stand.technical_drawing_link || "",
                          stand_render_link: stand.stand_render_link || "",
                          technical_specs_link: stand.technical_specs_link || "",
                          branding_areas_link: stand.branding_areas_link || "",
                          exhibitor_manual_link: stand.exhibitor_manual_link || "",
                          submission_deadline: stand.submission_deadline ? new Date(stand.submission_deadline).toISOString().slice(0, 16) : "",
                          admin_notes: stand.admin_notes || "",
                          revision_feedback: stand.revision_feedback || "",
                          status: stand.status || "pending_partner_review",
                          admin_defined_voltages: stand.admin_defined_voltages || ["110V", "220V", "380V", "415V"]
                        });
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete stand for ${partnerInfo.name}? This cannot be undone.`)) {
                          deleteStandMutation.mutate(stand.id);
                        }
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={(e) => handleAdminSave(e, stand)} className="space-y-4 border-t pt-4 bg-gray-50 p-4 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Booth Number</Label>
                        <Input
                          value={adminForm.booth_number}
                          onChange={(e) => setAdminForm(prev => ({ ...prev, booth_number: e.target.value }))}
                          placeholder="e.g., A-12"
                        />
                      </div>
                      <div>
                        <Label>Status *</Label>
                        <Select
                          value={adminForm.status}
                          onValueChange={(value) => setAdminForm(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending_partner_review">Pending Partner Review</SelectItem>
                            <SelectItem value="pending_admin_review">Pending Admin Review</SelectItem>
                            <SelectItem value="revision_needed">Revision Needed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Submission Deadline</Label>
                        <Input
                          type="datetime-local"
                          value={adminForm.submission_deadline}
                          onChange={(e) => setAdminForm(prev => ({ ...prev, submission_deadline: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Booth Construction Type *</Label>
                      <Select
                        value={adminForm.booth_construction_type}
                        onValueChange={(value) => setAdminForm(prev => ({ ...prev, booth_construction_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select who builds the booth..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sef_built">SEF Team Builds Booth</SelectItem>
                          <SelectItem value="partner_built">Partner Builds Own Booth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-semibold text-blue-900">📎 Stand Documentation Links</p>
                      
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Technical Drawing</Label>
                          <Input
                            type="url"
                            value={adminForm.technical_drawing_link}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, technical_drawing_link: e.target.value }))}
                            placeholder="https://..."
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Stand Render</Label>
                          <Input
                            type="url"
                            value={adminForm.stand_render_link}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, stand_render_link: e.target.value }))}
                            placeholder="https://..."
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Technical Specs</Label>
                          <Input
                            type="url"
                            value={adminForm.technical_specs_link}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, technical_specs_link: e.target.value }))}
                            placeholder="https://..."
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Branding Areas</Label>
                          <Input
                            type="url"
                            value={adminForm.branding_areas_link}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, branding_areas_link: e.target.value }))}
                            placeholder="https://..."
                            className="text-sm"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label className="text-xs">Exhibitor Manual</Label>
                          <Input
                            type="url"
                            value={adminForm.exhibitor_manual_link}
                            onChange={(e) => setAdminForm(prev => ({ ...prev, exhibitor_manual_link: e.target.value }))}
                            placeholder="https://..."
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Internal Notes</Label>
                      <Textarea
                        value={adminForm.admin_notes}
                        onChange={(e) => setAdminForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                        rows={2}
                        placeholder="Private admin notes..."
                      />
                    </div>

                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5 text-yellow-600" />
                        <Label className="text-base font-semibold">Power Options for This Partner</Label>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">Define which voltage options are available for this partner's booth</p>
                      
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newVoltageForStand}
                          onChange={(e) => setNewVoltageForStand(e.target.value)}
                          placeholder="e.g., 440V"
                          className="max-w-xs"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (newVoltageForStand && !adminForm.admin_defined_voltages.includes(newVoltageForStand)) {
                              setAdminForm(prev => ({
                                ...prev,
                                admin_defined_voltages: [...prev.admin_defined_voltages, newVoltageForStand]
                              }));
                              setNewVoltageForStand("");
                            }
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {adminForm.admin_defined_voltages?.map((voltage, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="px-3 py-1.5 bg-yellow-100 border-yellow-400 text-yellow-900 flex items-center gap-2"
                          >
                            {voltage}
                            <button
                              type="button"
                              onClick={() => {
                                setAdminForm(prev => ({
                                  ...prev,
                                  admin_defined_voltages: prev.admin_defined_voltages.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {(adminForm.status === 'revision_needed' || adminForm.status === 'under_review') && (
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                        <Label>Feedback to Partner {adminForm.status === 'revision_needed' && '*'}</Label>
                        <Textarea
                          value={adminForm.revision_feedback}
                          onChange={(e) => setAdminForm(prev => ({ ...prev, revision_feedback: e.target.value }))}
                          rows={3}
                          placeholder="Explain what needs to be revised..."
                          required={adminForm.status === 'revision_needed'}
                          className="mt-2"
                        />
                        <p className="text-xs text-orange-700 mt-1">
                          Visible to partner
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditingAdmin(false);
                          setSelectedStand(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={adminUpdateMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </form>
) : discussionStand?.id === stand.id ? (
                  /* Discussion Wall for this stand */
                  <div className="border-t pt-4">
                    <StandDiscussionWall
                      stand={stand}
                      currentUser={currentUser}
                      isAdmin={true}
                      partnerInfo={partnerInfo}
                    />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
                    <div className="space-y-3">
                      {stand.booth_number && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold">Booth: {stand.booth_number}</span>
                        </div>
                      )}
                      {stand.booth_construction_type && (
                        <Badge className={stand.booth_construction_type === 'sef_built' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}>
                          {stand.booth_construction_type === 'sef_built' ? 'SEF Built' : 'Partner Built'}
                        </Badge>
                      )}
                      {stand.technical_drawing_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(stand.technical_drawing_link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Technical Drawing
                        </Button>
                      )}
                      {stand.stand_render_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(stand.stand_render_link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Render
                        </Button>
                      )}
                      {stand.technical_specs_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(stand.technical_specs_link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Specs
                        </Button>
                      )}
                      {stand.branding_areas_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(stand.branding_areas_link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Branding
                        </Button>
                      )}
                      {stand.exhibitor_manual_link && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(stand.exhibitor_manual_link, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Manual
                        </Button>
                      )}
                      {stand.power_voltage && (
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="w-4 h-4 text-yellow-600" />
                          <span>{stand.power_voltage} • {stand.power_outlets || 0} outlets</span>
                        </div>
                      )}
                    </div>

                    <div>
                      {stand.artwork_submissions?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-600 mb-2 font-semibold">
                            Artwork Files ({stand.artwork_submissions.length})
                          </p>
                          <div className="space-y-2">
                            {stand.artwork_submissions.map((artwork, idx) => (
                              <Card key={idx} className="bg-gray-50">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{artwork.artwork_type || artwork.file_name}</p>
                                      <p className="text-xs text-gray-500">
                                        {artwork.width}m × {artwork.height}m
                                      </p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(artwork.file_url, '_blank')}
                                    >
                                      <Download className="w-3 h-3" />
                                    </Button>
                                  </div>

                                  {artwork.admin_feedback?.length > 0 && (
                                    <div className="mb-2 space-y-1">
                                      {artwork.admin_feedback.map((fb, fbIdx) => (
                                        <div key={fbIdx} className="bg-blue-50 border border-blue-200 rounded p-2">
                                          <p className="text-xs text-blue-900">{fb.comment}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {commentingOnArtwork === `${stand.id}-${idx}` ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={artworkComment}
                                        onChange={(e) => setArtworkComment(e.target.value)}
                                        rows={2}
                                        placeholder="Feedback..."
                                        className="text-sm"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleArtworkFeedback(idx, stand)}
                                        >
                                          Post
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setCommentingOnArtwork(null);
                                            setArtworkComment("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setCommentingOnArtwork(`${stand.id}-${idx}`)}
                                      className="w-full text-xs"
                                    >
                                      <MessageSquare className="w-3 h-3 mr-1" />
                                      Feedback
                                    </Button>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredStands.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No stands found</h3>
              <p className="text-gray-600">Try adjusting filters or search</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}