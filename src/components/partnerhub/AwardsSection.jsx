import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Trophy, Download, Upload, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AwardsSection({ partnerEmail, isAdmin, showAllPartners, profile: passedProfile }) {
  const [isAddingSEFFY, setIsAddingSEFFY] = useState(false);
  const [isAddingPitch, setIsAddingPitch] = useState(false);
  const [uploadingSEFFY, setUploadingSEFFY] = useState(false);
  const [uploadingPitch, setUploadingPitch] = useState(false);
  
  const [seffyForm, setSeffyForm] = useState({
    nominee_name: "",
    nominee_title: "",
    nominee_email: "",
    nominee_phone: "",
    headshot_url: ""
  });
  
  const [pitchForm, setPitchForm] = useState({
    nominee_name: "",
    nominee_title: "",
    nominee_email: "",
    nominee_phone: "",
    headshot_url: ""
  });

  const queryClient = useQueryClient();

  const { data: fetchedProfile } = useQuery({
    queryKey: ['partnerProfile', partnerEmail],
    queryFn: async () => {
      const profiles = await base44.entities.PartnerProfile.filter({ partner_email: partnerEmail });
      return profiles[0] || null;
    },
    enabled: !!partnerEmail && !passedProfile,
  });

  const profile = passedProfile || fetchedProfile;

  // Determine visibility - only showAllPartners (global admin view) sees all
  // When viewing a specific partner (even as admin), respect their profile settings
  const showSeffyPresenter = showAllPartners || profile?.show_seffy_awards === true;
  const showPitchPresenter = showAllPartners || profile?.show_pitch_competition === true;

  const { data: seffyAwards = [] } = useQuery({
    queryKey: ['seffyAwards', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        const allRecognitions = await base44.entities.RecognitionAward.list('-created_date');
        return allRecognitions.filter(r => r.award_type === 'SEFFY_presenter');
      }
      const allRecognitions = await base44.entities.RecognitionAward.filter({ 
        partner_email: partnerEmail,
        award_type: 'SEFFY_presenter'
      });
      return allRecognitions;
    },
    enabled: !!partnerEmail || showAllPartners,
  });

  const { data: pitchAwards = [] } = useQuery({
    queryKey: ['pitchAwards', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        const allRecognitions = await base44.entities.RecognitionAward.list('-created_date');
        return allRecognitions.filter(r => r.award_type === 'pitch_competition_presenter');
      }
      const allRecognitions = await base44.entities.RecognitionAward.filter({ 
        partner_email: partnerEmail,
        award_type: 'pitch_competition_presenter'
      });
      return allRecognitions;
    },
    enabled: !!partnerEmail || showAllPartners,
  });

  const createSeffyMutation = useMutation({
    mutationFn: (data) => base44.entities.RecognitionAward.create({ 
      ...data, 
      partner_email: partnerEmail,
      award_type: 'SEFFY_presenter'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seffyAwards'] });
      setIsAddingSEFFY(false);
      setSeffyForm({
        nominee_name: "",
        nominee_title: "",
        nominee_email: "",
        nominee_phone: "",
        headshot_url: ""
      });
      toast.success("SEFFY Awards Presenter nominated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to submit nomination: ${error.message}`);
    }
  });

  const createPitchMutation = useMutation({
    mutationFn: (data) => base44.entities.RecognitionAward.create({ 
      ...data, 
      partner_email: partnerEmail,
      award_type: 'pitch_competition_presenter'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitchAwards'] });
      setIsAddingPitch(false);
      setPitchForm({
        nominee_name: "",
        nominee_title: "",
        nominee_email: "",
        nominee_phone: "",
        headshot_url: ""
      });
      toast.success("Pitch Competition Presenter nominated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to submit nomination: ${error.message}`);
    }
  });

  const deleteSeffyMutation = useMutation({
    mutationFn: (id) => base44.entities.RecognitionAward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seffyAwards'] });
      toast.success("Nomination deleted");
    },
  });

  const deletePitchMutation = useMutation({
    mutationFn: (id) => base44.entities.RecognitionAward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitchAwards'] });
      toast.success("Nomination deleted");
    },
  });

  const handleSeffyHeadshotUpload = async (file) => {
    if (!file) return;
    
    setUploadingSEFFY(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSeffyForm(prev => ({ ...prev, headshot_url: file_url }));
      toast.success("Headshot uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload headshot");
      console.error("Upload failed:", error);
    } finally {
      setUploadingSEFFY(false);
    }
  };

  const handlePitchHeadshotUpload = async (file) => {
    if (!file) return;
    
    setUploadingPitch(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPitchForm(prev => ({ ...prev, headshot_url: file_url }));
      toast.success("Headshot uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload headshot");
      console.error("Upload failed:", error);
    } finally {
      setUploadingPitch(false);
    }
  };

  const handleSeffySubmit = (e) => {
    e.preventDefault();
    createSeffyMutation.mutate(seffyForm);
  };

  const handlePitchSubmit = (e) => {
    e.preventDefault();
    createPitchMutation.mutate(pitchForm);
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const renderPresenterForm = (type, form, setForm, handleSubmit, handleUpload, uploading, mutation) => {
    const title = type === 'seffy' ? 'SEFFY Awards Presenter' : 'Pitch Competition Award Presenter';
    
    return (
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.nominee_name}
                  onChange={(e) => setForm(prev => ({ ...prev, nominee_name: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.nominee_title}
                  onChange={(e) => setForm(prev => ({ ...prev, nominee_title: e.target.value }))}
                  placeholder="e.g., CEO, Marketing Director"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={form.nominee_email}
                  onChange={(e) => setForm(prev => ({ ...prev, nominee_email: e.target.value }))}
                  placeholder="email@company.com"
                  required
                />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input
                  type="tel"
                  value={form.nominee_phone}
                  onChange={(e) => setForm(prev => ({ ...prev, nominee_phone: e.target.value }))}
                  placeholder="+971 XX XXX XXXX"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Headshot Photo *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleUpload(e.target.files[0])}
                disabled={uploading}
                required={!form.headshot_url}
              />
              {uploading && (
                <p className="text-sm text-gray-500 mt-2">Uploading...</p>
              )}
              {form.headshot_url && (
                <div className="mt-3 flex items-center gap-3">
                  <img 
                    src={form.headshot_url} 
                    alt="Headshot preview" 
                    className="w-20 h-20 rounded-lg object-cover border-2 border-green-200"
                  />
                  <p className="text-sm text-green-600">✓ Photo uploaded</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => type === 'seffy' ? setIsAddingSEFFY(false) : setIsAddingPitch(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending || !form.headshot_url}
              >
                Submit Nomination
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAllPartners,
  });

  const getPartnerInfo = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return {
      name: partner?.full_name || email,
      company: partner?.company_name || ''
    };
  };

  const renderPresenterCards = (awards, deleteMutation, typeLabel) => {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {awards.map((award) => {
          const partnerInfo = showAllPartners ? getPartnerInfo(award.partner_email) : null;
          
          return (
            <motion.div
              key={award.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge className="bg-orange-100 text-orange-800">
                      {typeLabel}
                    </Badge>
                    {!showAllPartners && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(award.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="flex gap-4 mb-4">
                  {award.headshot_url && (
                    <img 
                      src={award.headshot_url} 
                      alt={award.nominee_name}
                      className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-1">{award.nominee_name}</h4>
                    {award.nominee_title && (
                      <p className="text-sm text-gray-600 mb-2">{award.nominee_title}</p>
                    )}
                    <Badge className={getStatusColor(award.status)} variant="outline">
                      {award.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t pt-3">
                  {award.nominee_email && (
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-blue-600">{award.nominee_email}</p>
                    </div>
                  )}
                </div>

                {isAdmin && award.headshot_url && (
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(award.headshot_url, '_blank')}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View/Download Headshot
                    </Button>
                  </div>
                )}

                {award.admin_notes && isAdmin && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                    Admin: {award.admin_notes}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          );
        })}
      </div>
    );
  };

  // If partner has neither section enabled, show a message
  if (!showSeffyPresenter && !showPitchPresenter) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">No award presenter sections are currently available for your account.</p>
          <p className="text-sm text-gray-500 mt-2">Contact your account manager for more information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: SEFFY Awards Presenter */}
      {showSeffyPresenter && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-600" />
                SEFFY Awards Presenter
              </h3>
              <p className="text-sm text-gray-600">
                Nominate someone to present SEFFY Awards
              </p>
            </div>
            {!isAddingSEFFY && !showAllPartners && (
              <Button
                onClick={() => setIsAddingSEFFY(true)}
                className="bg-gradient-to-r from-orange-500 to-amber-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Presenter
              </Button>
            )}
          </div>

          <AnimatePresence>
            {isAddingSEFFY && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {renderPresenterForm('seffy', seffyForm, setSeffyForm, handleSeffySubmit, handleSeffyHeadshotUpload, uploadingSEFFY, createSeffyMutation)}
              </motion.div>
            )}
          </AnimatePresence>

          {seffyAwards.length > 0 ? (
            renderPresenterCards(seffyAwards, deleteSeffyMutation, 'SEFFY Awards')
          ) : !isAddingSEFFY && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-600">No SEFFY Awards presenters nominated yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Divider - only show if both sections are visible */}
      {showSeffyPresenter && showPitchPresenter && (
        <div className="border-t border-gray-200"></div>
      )}

      {/* Section 2: Pitch Competition Award Presenter */}
      {showPitchPresenter && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-600" />
                Pitch Competition Award Presenter
              </h3>
              <p className="text-sm text-gray-600">
                Nominate someone to present Pitch Competition Awards
              </p>
            </div>
            {!isAddingPitch && !showAllPartners && (
              <Button
                onClick={() => setIsAddingPitch(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Presenter
              </Button>
            )}
          </div>

          <AnimatePresence>
            {isAddingPitch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                {renderPresenterForm('pitch', pitchForm, setPitchForm, handlePitchSubmit, handlePitchHeadshotUpload, uploadingPitch, createPitchMutation)}
              </motion.div>
            )}
          </AnimatePresence>

          {pitchAwards.length > 0 ? (
            renderPresenterCards(pitchAwards, deletePitchMutation, 'Pitch Competition')
          ) : !isAddingPitch && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-600">No Pitch Competition presenters nominated yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}