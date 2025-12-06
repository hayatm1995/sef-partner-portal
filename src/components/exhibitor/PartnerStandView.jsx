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
  Upload,
  ExternalLink,
  Download,
  Trash2,
  Plus,
  FileImage,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Ruler,
  Image,
  FileText,
  Monitor,
  Palette
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import StandDiscussionWall from "./StandDiscussionWall";

export default function PartnerStandView({ currentStand, partnerEmail, currentUser }) {
  const [isAddingArtwork, setIsAddingArtwork] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isAddingLogo, setIsAddingLogo] = useState(false);
  const [isAddingRender, setIsAddingRender] = useState(false);
  const [isAddingDrawing, setIsAddingDrawing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [artworkForm, setArtworkForm] = useState({
    submission_type: "file",
    file: null,
    link_url: "",
    requirement_type: "",
    custom_width: "",
    custom_height: "",
    description: ""
  });
  const [logoForm, setLogoForm] = useState({ file: null, description: "" });
  const [renderForm, setRenderForm] = useState({ file: null, description: "" });
  const [drawingForm, setDrawingForm] = useState({ file: null, drawing_type: "", description: "" });
  const [avRequirements, setAvRequirements] = useState({
    equipment_list: currentStand?.av_requirements?.equipment_list || "",
    special_instructions: currentStand?.av_requirements?.special_instructions || ""
  });
  const [commentText, setCommentText] = useState("");
  
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['standConfig'],
    queryFn: async () => {
      const configs = await base44.entities.StandConfiguration.list();
      return configs[0] || null;
    }
  });

  const saveStandMutation = useMutation({
    mutationFn: async (data) => {
      if (currentStand) {
        return await base44.entities.ExhibitorStand.update(currentStand.id, data);
      }
      return await base44.entities.ExhibitorStand.create({
        ...data,
        partner_email: partnerEmail
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitorStands'] });
      toast.success("Updated successfully!");
      setIsAddingArtwork(false);
      setIsAddingComment(false);
      setArtworkForm({
        submission_type: "file",
        file: null,
        link_url: "",
        requirement_type: "",
        custom_width: "",
        custom_height: "",
        description: ""
      });
      setCommentText("");
    }
  });

  const handleArtworkUpload = async (e) => {
    e.preventDefault();
    
    if (artworkForm.submission_type === "file" && !artworkForm.file) {
      toast.error("Please select a file");
      return;
    }
    
    if (artworkForm.submission_type === "link" && !artworkForm.link_url) {
      toast.error("Please enter a link");
      return;
    }

    setUploading(true);
    try {
      let file_url = null;
      
      if (artworkForm.submission_type === "file") {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: artworkForm.file });
        file_url = uploadResult.file_url;
      }

      const selectedReq = config?.artwork_requirements?.find(r => r.name === artworkForm.requirement_type);
      
      const newSubmission = {
        submission_type: artworkForm.submission_type,
        file_url: artworkForm.submission_type === "file" ? file_url : null,
        link_url: artworkForm.submission_type === "link" ? artworkForm.link_url : null,
        file_name: artworkForm.submission_type === "file" ? artworkForm.file.name : null,
        width: selectedReq ? selectedReq.width : parseFloat(artworkForm.custom_width),
        height: selectedReq ? selectedReq.height : parseFloat(artworkForm.custom_height),
        description: artworkForm.description,
        artwork_type: artworkForm.requirement_type || "Custom",
        submitted_at: new Date().toISOString(),
        submitted_by: partnerEmail,
        comments: [],
        version_history: []
      };

      const existingSubmissions = currentStand?.artwork_submissions || [];

      await saveStandMutation.mutateAsync({
        artwork_submissions: [...existingSubmissions, newSubmission],
        status: "pending_admin_review"
      });

      // Send notification to admins
      await base44.entities.StatusUpdate.create({
        partner_email: partnerEmail,
        title: "New Stand Artwork Submitted",
        message: `${partnerEmail} submitted new artwork for review`,
        type: "action_required"
      });

      // Log activity
      await base44.entities.ActivityLog.create({
        activity_type: "deliverable_submitted",
        user_email: partnerEmail,
        description: `Submitted stand artwork (${artworkForm.submission_type})`
      });

      toast.success("Artwork submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit artwork");
    } finally {
      setUploading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment = {
      comment: commentText,
      created_by: partnerEmail,
      created_at: new Date().toISOString()
    };

    const existingComments = currentStand?.partner_comments || [];

    await saveStandMutation.mutateAsync({
      partner_comments: [...existingComments, newComment]
    });
  };

  const handleLogoUpload = async (e) => {
    e.preventDefault();
    if (!logoForm.file) {
      toast.error("Please select a file");
      return;
    }
    setUploading(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: logoForm.file });
      const newLogo = {
        file_url: uploadResult.file_url,
        file_name: logoForm.file.name,
        description: logoForm.description,
        submitted_at: new Date().toISOString(),
        submitted_by: partnerEmail
      };
      const existingLogos = currentStand?.logo_submissions || [];
      await saveStandMutation.mutateAsync({
        logo_submissions: [...existingLogos, newLogo],
        status: "pending_admin_review"
      });
      setLogoForm({ file: null, description: "" });
      setIsAddingLogo(false);
      toast.success("Logo submitted!");
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRenderUpload = async (e) => {
    e.preventDefault();
    if (!renderForm.file) {
      toast.error("Please select a file");
      return;
    }
    setUploading(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: renderForm.file });
      const newRender = {
        file_url: uploadResult.file_url,
        file_name: renderForm.file.name,
        description: renderForm.description,
        submitted_at: new Date().toISOString(),
        submitted_by: partnerEmail
      };
      const existingRenders = currentStand?.render_submissions || [];
      await saveStandMutation.mutateAsync({
        render_submissions: [...existingRenders, newRender],
        status: "pending_admin_review"
      });
      setRenderForm({ file: null, description: "" });
      setIsAddingRender(false);
      toast.success("Render submitted!");
    } catch (error) {
      toast.error("Failed to upload render");
    } finally {
      setUploading(false);
    }
  };

  const handleDrawingUpload = async (e) => {
    e.preventDefault();
    if (!drawingForm.file) {
      toast.error("Please select a file");
      return;
    }
    setUploading(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: drawingForm.file });
      const newDrawing = {
        file_url: uploadResult.file_url,
        file_name: drawingForm.file.name,
        drawing_type: drawingForm.drawing_type,
        description: drawingForm.description,
        submitted_at: new Date().toISOString(),
        submitted_by: partnerEmail
      };
      const existingDrawings = currentStand?.technical_drawing_submissions || [];
      await saveStandMutation.mutateAsync({
        technical_drawing_submissions: [...existingDrawings, newDrawing],
        status: "pending_admin_review"
      });
      setDrawingForm({ file: null, drawing_type: "", description: "" });
      setIsAddingDrawing(false);
      toast.success("Technical drawing submitted!");
    } catch (error) {
      toast.error("Failed to upload drawing");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAVRequirements = async () => {
    await saveStandMutation.mutateAsync({
      av_requirements: avRequirements,
      status: "pending_admin_review"
    });
    toast.success("AV requirements saved!");
  };

  const deleteLogo = async (index) => {
    const updated = [...(currentStand?.logo_submissions || [])];
    updated.splice(index, 1);
    await saveStandMutation.mutateAsync({ logo_submissions: updated });
    toast.success("Logo deleted");
  };

  const deleteRender = async (index) => {
    const updated = [...(currentStand?.render_submissions || [])];
    updated.splice(index, 1);
    await saveStandMutation.mutateAsync({ render_submissions: updated });
    toast.success("Render deleted");
  };

  const deleteDrawing = async (index) => {
    const updated = [...(currentStand?.technical_drawing_submissions || [])];
    updated.splice(index, 1);
    await saveStandMutation.mutateAsync({ technical_drawing_submissions: updated });
    toast.success("Drawing deleted");
  };

  const deleteArtwork = async (index) => {
    const updatedSubmissions = [...(currentStand?.artwork_submissions || [])];
    updatedSubmissions.splice(index, 1);

    await saveStandMutation.mutateAsync({
      artwork_submissions: updatedSubmissions
    });
    toast.success("Artwork deleted");
  };

  const addSubmissionComment = async (submissionIndex, comment) => {
    const updatedSubmissions = [...(currentStand?.artwork_submissions || [])];
    const submission = updatedSubmissions[submissionIndex];
    
    submission.comments = [...(submission.comments || []), {
      comment,
      created_by: partnerEmail,
      created_at: new Date().toISOString()
    }];

    await saveStandMutation.mutateAsync({
      artwork_submissions: updatedSubmissions
    });
    toast.success("Comment added");
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

  const isOverdue = currentStand?.submission_deadline && new Date(currentStand.submission_deadline) < new Date() && currentStand.status !== 'approved' && currentStand.status !== 'completed';

  const selectedReq = config?.artwork_requirements?.find(r => r.name === artworkForm.requirement_type);

  const handleConstructionTypeChange = async (type) => {
    await saveStandMutation.mutateAsync({ booth_construction_type: type });
    
    // Send notification
    await base44.entities.StatusUpdate.create({
      partner_email: partnerEmail,
      title: "Booth Construction Type Selected",
      message: `${partnerEmail} selected: ${type === 'partner_built' ? 'Building their own booth' : 'SEF team to build booth'}`,
      type: "info"
    });
  };

  return (
    <div className="space-y-6">
      {/* Booth Construction Choice */}
      {!currentStand?.booth_construction_type && (
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="w-6 h-6 text-purple-600" />
              How would you like your booth to be built?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">Please select your preferred booth construction option. This will determine what information you'll need to provide.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConstructionTypeChange('sef_built')}
                className="p-6 border-2 border-orange-200 rounded-xl bg-white hover:border-orange-400 hover:shadow-lg transition-all text-left"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">SEF Team Builds My Booth</h3>
                <p className="text-sm text-gray-600">
                  Our experienced team will design and construct your booth. You'll just need to provide branding assets like logos and artwork.
                </p>
                <Badge className="mt-3 bg-orange-100 text-orange-700">Recommended</Badge>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleConstructionTypeChange('partner_built')}
                className="p-6 border-2 border-blue-200 rounded-xl bg-white hover:border-blue-400 hover:shadow-lg transition-all text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                  <Ruler className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">I'll Build My Own Booth</h3>
                <p className="text-sm text-gray-600">
                  You'll handle the booth construction yourself. You'll need to submit technical drawings, renders, and AV requirements for approval.
                </p>
                <Badge className="mt-3 bg-blue-100 text-blue-700">Custom Build</Badge>
              </motion.button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show selection badge if already selected */}
      {currentStand?.booth_construction_type && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                currentStand.booth_construction_type === 'sef_built' ? 'bg-orange-100' : 'bg-blue-100'
              }`}>
                {currentStand.booth_construction_type === 'sef_built' ? (
                  <CheckCircle2 className="w-5 h-5 text-orange-600" />
                ) : (
                  <Ruler className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {currentStand.booth_construction_type === 'sef_built' 
                    ? 'SEF Team is Building Your Booth' 
                    : 'You Are Building Your Own Booth'}
                </p>
                <p className="text-sm text-gray-600">
                  {currentStand.booth_construction_type === 'sef_built'
                    ? 'Submit your branding assets below'
                    : 'Submit technical drawings, renders, and AV requirements below'}
                </p>
              </div>
            </div>
            {currentStand.status === 'pending_partner_review' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => saveStandMutation.mutate({ booth_construction_type: null })}
              >
                Change
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Card */}
      {currentStand && currentStand.booth_construction_type && (
        <Card className={`border-2 ${isOverdue ? 'border-red-300 bg-red-50/30' : 'border-orange-200'}`}>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Stand Status</CardTitle>
                {currentStand.submission_deadline && (
                  <p className={`text-xs mt-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                    Deadline: {new Date(currentStand.submission_deadline).toLocaleString()}
                    {isOverdue && ' ⚠️ OVERDUE'}
                  </p>
                )}
              </div>
              <Badge className={getStatusColor(currentStand.status)}>
                {currentStand.status.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          {currentStand.status === 'revision_needed' && currentStand.revision_feedback && (
            <CardContent className="bg-orange-50 border-t-2 border-orange-200">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-900 mb-2">🔄 Revisions Required</p>
                  <p className="text-sm text-orange-800 whitespace-pre-wrap">{currentStand.revision_feedback}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Booth Info & Documentation */}
      {currentStand && (currentStand.booth_number || currentStand.technical_drawing_link || currentStand.stand_render_link || currentStand.technical_specs_link || currentStand.branding_areas_link || currentStand.exhibitor_manual_link) && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <FileImage className="w-5 h-5 text-purple-600" />
                Stand Documentation
              </h3>
              {currentStand.booth_number && (
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  Booth #{currentStand.booth_number}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {currentStand.technical_drawing_link && (
                <Button
                  variant="outline"
                  onClick={() => window.open(currentStand.technical_drawing_link, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Technical Drawing
                </Button>
              )}
              {currentStand.stand_render_link && (
                <Button
                  variant="outline"
                  onClick={() => window.open(currentStand.stand_render_link, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Render
                </Button>
              )}
              {currentStand.technical_specs_link && (
                <Button
                  variant="outline"
                  onClick={() => window.open(currentStand.technical_specs_link, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Specs
                </Button>
              )}
              {currentStand.branding_areas_link && (
                <Button
                  variant="outline"
                  onClick={() => window.open(currentStand.branding_areas_link, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Branding Areas
                </Button>
              )}
              {currentStand.exhibitor_manual_link && (
                <Button
                  variant="outline"
                  onClick={() => window.open(currentStand.exhibitor_manual_link, '_blank')}
                  className="text-xs bg-orange-50 border-orange-200 hover:bg-orange-100"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Exhibitor Manual
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEF BUILT BOOTH - Artwork & Logo Submissions */}
      {currentStand?.booth_construction_type === 'sef_built' && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Artwork Upload */}
          <Card className="border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileImage className="w-5 h-5 text-green-600" />
                Artwork Files
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {currentStand?.artwork_submissions?.map((submission, index) => (
                <Card key={index} className="bg-gray-50 border">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{submission.artwork_type || submission.file_name}</p>
                          <Badge variant="outline" className="text-xs">
                            {submission.submission_type === 'link' ? '🔗 Link' : '📄 File'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {submission.width}m × {submission.height}m
                        </p>
                        {submission.description && (
                          <p className="text-xs text-gray-600 mt-1">{submission.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      {currentStand.status !== 'approved' && currentStand.status !== 'completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteArtwork(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {submission.comments?.length > 0 && (
                      <div className="mb-2 space-y-1 max-h-32 overflow-y-auto">
                        {submission.comments.map((comment, commentIdx) => (
                          <div key={commentIdx} className="bg-blue-50 border border-blue-200 rounded p-2">
                            <p className="text-xs text-blue-900">{comment.comment}</p>
                            <p className="text-xs text-blue-600 mt-1">
                              {comment.created_by} • {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(submission.submission_type === 'link' ? submission.link_url : submission.file_url, '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      {submission.submission_type === 'link' ? 'Open Link' : 'View File'}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {!isAddingArtwork && currentStand?.status !== 'approved' && (
                <Button
                  onClick={() => setIsAddingArtwork(true)}
                  variant="outline"
                  className="w-full border-2 border-dashed border-green-300 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {currentStand?.status === 'revision_needed' ? 'Upload Revised Artwork' : 'Add Artwork'}
                </Button>
              )}

              <AnimatePresence>
                {isAddingArtwork && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleArtworkUpload}
                    className="space-y-3 border-2 border-green-200 rounded-lg p-4 bg-green-50"
                  >
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Submission Method *</Label>
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="submission_type"
                            value="file"
                            checked={artworkForm.submission_type === "file"}
                            onChange={(e) => setArtworkForm(prev => ({ ...prev, submission_type: e.target.value }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">📄 Upload File</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="submission_type"
                            value="link"
                            checked={artworkForm.submission_type === "link"}
                            onChange={(e) => setArtworkForm(prev => ({ ...prev, submission_type: e.target.value }))}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">🔗 Share Link</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Artwork Type *</Label>
                      <Select
                        value={artworkForm.requirement_type}
                        onValueChange={(value) => setArtworkForm(prev => ({ ...prev, requirement_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select artwork type..." />
                        </SelectTrigger>
                        <SelectContent>
                          {config?.artwork_requirements && config.artwork_requirements.length > 0 && 
                            config.artwork_requirements.map((req, idx) => (
                              <SelectItem key={idx} value={req.name}>
                                {req.name} ({req.width}m × {req.height}m) {req.is_required && '⚠️'}
                              </SelectItem>
                            ))
                          }
                          <SelectItem value="Custom">Custom / Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedReq && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Requirement Details:</p>
                        <p className="text-xs text-blue-800">
                          {selectedReq.description || `Upload ${selectedReq.name} artwork`}
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          Dimensions: <strong>{selectedReq.width}m × {selectedReq.height}m</strong>
                        </p>
                      </div>
                    )}

                    {artworkForm.requirement_type === "Custom" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Width (m) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={artworkForm.custom_width}
                            onChange={(e) => setArtworkForm(prev => ({ ...prev, custom_width: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Height (m) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={artworkForm.custom_height}
                            onChange={(e) => setArtworkForm(prev => ({ ...prev, custom_height: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {artworkForm.submission_type === "file" ? (
                      <div>
                        <Label className="text-sm font-semibold">Upload File *</Label>
                        <Input
                          type="file"
                          accept="image/*,.pdf,.ai,.eps"
                          onChange={(e) => setArtworkForm(prev => ({ ...prev, file: e.target.files[0] }))}
                          required
                          className="mt-1"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label className="text-sm font-semibold">Share Link *</Label>
                        <Input
                          type="url"
                          value={artworkForm.link_url}
                          onChange={(e) => setArtworkForm(prev => ({ ...prev, link_url: e.target.value }))}
                          placeholder="https://drive.google.com/..."
                          required
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-sm">Notes (optional)</Label>
                      <Textarea
                        value={artworkForm.description}
                        onChange={(e) => setArtworkForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        placeholder="Any additional details..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddingArtwork(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploading || !artworkForm.requirement_type} className="flex-1 bg-green-600 hover:bg-green-700">
                        {uploading ? "Submitting..." : <><Upload className="w-4 h-4 mr-2" />Submit</>}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Logo Submissions */}
          <Card className="border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="w-5 h-5 text-purple-600" />
                Logo Files
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {currentStand?.logo_submissions?.map((logo, index) => (
                <Card key={index} className="bg-gray-50 border">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{logo.file_name}</p>
                        {logo.description && <p className="text-xs text-gray-600 mt-1">{logo.description}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted {new Date(logo.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      {currentStand.status !== 'approved' && (
                        <Button variant="ghost" size="sm" onClick={() => deleteLogo(index)} className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.open(logo.file_url, '_blank')} className="w-full">
                      <ExternalLink className="w-3 h-3 mr-2" />View Logo
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {!isAddingLogo && currentStand?.status !== 'approved' && (
                <Button onClick={() => setIsAddingLogo(true)} variant="outline" className="w-full border-2 border-dashed border-purple-300 hover:bg-purple-50">
                  <Plus className="w-4 h-4 mr-2" />Add Logo
                </Button>
              )}

              <AnimatePresence>
                {isAddingLogo && (
                  <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleLogoUpload} className="space-y-3 border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                    <div>
                      <Label className="text-sm font-semibold">Upload Logo *</Label>
                      <Input type="file" accept="image/*,.pdf,.ai,.eps,.svg" onChange={(e) => setLogoForm(prev => ({ ...prev, file: e.target.files[0] }))} required className="mt-1" />
                      <p className="text-xs text-gray-500 mt-1">PNG, SVG, AI, EPS preferred</p>
                    </div>
                    <div>
                      <Label className="text-sm">Description</Label>
                      <Input value={logoForm.description} onChange={(e) => setLogoForm(prev => ({ ...prev, description: e.target.value }))} placeholder="e.g., Primary logo, White version..." />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddingLogo(false)} className="flex-1">Cancel</Button>
                      <Button type="submit" disabled={uploading} className="flex-1 bg-purple-600 hover:bg-purple-700">
                        {uploading ? "Uploading..." : <><Upload className="w-4 h-4 mr-2" />Upload</>}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PARTNER BUILT BOOTH - Technical Drawings, Renders, AV Requirements */}
      {currentStand?.booth_construction_type === 'partner_built' && (
        <div className="space-y-6">
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Custom Booth Requirements</p>
                  <p className="text-sm text-blue-800">
                    Since you're building your own booth, please submit your technical drawings, 3D renders, and AV requirements for approval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Technical Drawings */}
            <Card className="border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Technical Drawings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {currentStand?.technical_drawing_submissions?.map((drawing, index) => (
                  <Card key={index} className="bg-gray-50 border">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{drawing.file_name}</p>
                          {drawing.drawing_type && <Badge variant="outline" className="text-xs mt-1">{drawing.drawing_type}</Badge>}
                          {drawing.description && <p className="text-xs text-gray-600 mt-1">{drawing.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">Submitted {new Date(drawing.submitted_at).toLocaleDateString()}</p>
                        </div>
                        {currentStand.status !== 'approved' && (
                          <Button variant="ghost" size="sm" onClick={() => deleteDrawing(index)} className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(drawing.file_url, '_blank')} className="w-full">
                        <ExternalLink className="w-3 h-3 mr-2" />View Drawing
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {!isAddingDrawing && currentStand?.status !== 'approved' && (
                  <Button onClick={() => setIsAddingDrawing(true)} variant="outline" className="w-full border-2 border-dashed border-indigo-300 hover:bg-indigo-50">
                    <Plus className="w-4 h-4 mr-2" />Add Technical Drawing
                  </Button>
                )}

                <AnimatePresence>
                  {isAddingDrawing && (
                    <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleDrawingUpload} className="space-y-3 border-2 border-indigo-200 rounded-lg p-4 bg-indigo-50">
                      <div>
                        <Label className="text-sm font-semibold">Drawing Type</Label>
                        <Select value={drawingForm.drawing_type} onValueChange={(value) => setDrawingForm(prev => ({ ...prev, drawing_type: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Floor Plan">Floor Plan</SelectItem>
                            <SelectItem value="Elevation">Elevation</SelectItem>
                            <SelectItem value="Structural">Structural</SelectItem>
                            <SelectItem value="Electrical">Electrical</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Upload File *</Label>
                        <Input type="file" accept=".pdf,.dwg,.dxf,image/*" onChange={(e) => setDrawingForm(prev => ({ ...prev, file: e.target.files[0] }))} required className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Description</Label>
                        <Textarea value={drawingForm.description} onChange={(e) => setDrawingForm(prev => ({ ...prev, description: e.target.value }))} rows={2} placeholder="Details about this drawing..." />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddingDrawing(false)} className="flex-1">Cancel</Button>
                        <Button type="submit" disabled={uploading} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                          {uploading ? "Uploading..." : <><Upload className="w-4 h-4 mr-2" />Upload</>}
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* 3D Renders */}
            <Card className="border-pink-200">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Image className="w-5 h-5 text-pink-600" />
                  3D Renders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {currentStand?.render_submissions?.map((render, index) => (
                  <Card key={index} className="bg-gray-50 border">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{render.file_name}</p>
                          {render.description && <p className="text-xs text-gray-600 mt-1">{render.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">Submitted {new Date(render.submitted_at).toLocaleDateString()}</p>
                        </div>
                        {currentStand.status !== 'approved' && (
                          <Button variant="ghost" size="sm" onClick={() => deleteRender(index)} className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(render.file_url, '_blank')} className="w-full">
                        <ExternalLink className="w-3 h-3 mr-2" />View Render
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {!isAddingRender && currentStand?.status !== 'approved' && (
                  <Button onClick={() => setIsAddingRender(true)} variant="outline" className="w-full border-2 border-dashed border-pink-300 hover:bg-pink-50">
                    <Plus className="w-4 h-4 mr-2" />Add 3D Render
                  </Button>
                )}

                <AnimatePresence>
                  {isAddingRender && (
                    <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleRenderUpload} className="space-y-3 border-2 border-pink-200 rounded-lg p-4 bg-pink-50">
                      <div>
                        <Label className="text-sm font-semibold">Upload Render *</Label>
                        <Input type="file" accept="image/*,.pdf" onChange={(e) => setRenderForm(prev => ({ ...prev, file: e.target.files[0] }))} required className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm">Description</Label>
                        <Textarea value={renderForm.description} onChange={(e) => setRenderForm(prev => ({ ...prev, description: e.target.value }))} rows={2} placeholder="e.g., Front view, Aerial view..." />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsAddingRender(false)} className="flex-1">Cancel</Button>
                        <Button type="submit" disabled={uploading} className="flex-1 bg-pink-600 hover:bg-pink-700">
                          {uploading ? "Uploading..." : <><Upload className="w-4 h-4 mr-2" />Upload</>}
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* AV Requirements */}
          <Card className="border-cyan-200">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-teal-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Monitor className="w-5 h-5 text-cyan-600" />
                AV Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Equipment List</Label>
                <Textarea
                  value={avRequirements.equipment_list}
                  onChange={(e) => setAvRequirements(prev => ({ ...prev, equipment_list: e.target.value }))}
                  rows={3}
                  placeholder="List all AV equipment (screens, projectors, sound systems, etc.)..."
                  disabled={currentStand?.status === 'approved'}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Special Instructions</Label>
                <Textarea
                  value={avRequirements.special_instructions}
                  onChange={(e) => setAvRequirements(prev => ({ ...prev, special_instructions: e.target.value }))}
                  rows={3}
                  placeholder="Any special setup requirements, timing, or technical needs..."
                  disabled={currentStand?.status === 'approved'}
                />
              </div>
              {currentStand?.status !== 'approved' && (
                <Button onClick={handleSaveAVRequirements} className="bg-cyan-600 hover:bg-cyan-700">
                  Save AV Requirements
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Power & Comments - Show for both types */}
      {currentStand?.booth_construction_type && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-amber-200">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-amber-600" />
                Power Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Voltage</Label>
                  <Select
                    value={currentStand?.power_voltage || ""}
                    onValueChange={(value) => saveStandMutation.mutate({ power_voltage: value })}
                    disabled={currentStand?.status === 'approved'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select voltage" />
                    </SelectTrigger>
                    <SelectContent>
                      {(currentStand?.admin_defined_voltages || config?.available_voltages || ["110V", "220V", "380V", "415V"]).map((voltage, idx) => (
                        <SelectItem key={idx} value={voltage}>{voltage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block"># Outlets</Label>
                  <Input
                    type="number"
                    placeholder="Number of outlets"
                    value={currentStand?.power_outlets || ""}
                    onChange={(e) => saveStandMutation.mutate({ power_outlets: parseInt(e.target.value) })}
                    disabled={currentStand?.status === 'approved'}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-semibold mb-2 block">Special Requirements</Label>
                <Textarea
                  value={currentStand?.special_requirements || ""}
                  onChange={(e) => saveStandMutation.mutate({ special_requirements: e.target.value })}
                  rows={3}
                  placeholder="Any special power or setup needs..."
                  disabled={currentStand?.status === 'approved'}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {currentStand?.partner_comments?.map((comment, idx) => (
                  <div key={idx} className="bg-gray-50 border rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {comment.created_by} • {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))}
              </div>

              {!isAddingComment && (
                <Button onClick={() => setIsAddingComment(true)} variant="outline" size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />Add Comment
                </Button>
              )}

              {isAddingComment && (
                <form onSubmit={handleAddComment} className="space-y-2">
                  <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} rows={2} placeholder="Your comment..." required />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsAddingComment(false)}>Cancel</Button>
                    <Button type="submit" size="sm">Post</Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Guidelines */}
      {config?.guidelines && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ruler className="w-5 h-5 text-indigo-600" />
              Artwork Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600"><strong>Formats:</strong> {config.guidelines.file_formats}</p>
                <p className="text-gray-600"><strong>Resolution:</strong> {config.guidelines.min_resolution}</p>
                <p className="text-gray-600"><strong>Color Mode:</strong> {config.guidelines.color_mode}</p>
              </div>
              <div>
                <p className="text-gray-600"><strong>Bleed Area:</strong> {config.guidelines.bleed_area}</p>
                <p className="text-gray-600"><strong>Review Time:</strong> {config.guidelines.review_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discussion Wall */}
      {currentStand && currentUser && (
        <StandDiscussionWall
          stand={currentStand}
          currentUser={currentUser}
          isAdmin={false}
        />
      )}
    </div>
  );
}