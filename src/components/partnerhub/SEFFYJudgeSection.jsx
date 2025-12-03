import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Award, Scale, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function SEFFYJudgeSection({ partnerEmail, isAdmin, showAllPartners }) {
  const [isAdding, setIsAdding] = useState(false);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [formData, setFormData] = useState({
    nominee_name: "",
    nominee_title: "",
    nominee_email: "",
    nominee_phone: "",
    headshot_url: "",
    nominee_bio: "",
    justification: ""
  });

  const queryClient = useQueryClient();

  const { data: seffyJudges = [] } = useQuery({
    queryKey: ['seffyJudges', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        return await base44.entities.RecognitionAward.filter({ award_type: "SEFFY_judge" });
      }
      return await base44.entities.RecognitionAward.filter({ 
        partner_email: partnerEmail,
        award_type: "SEFFY_judge"
      });
    },
    enabled: !!partnerEmail || showAllPartners
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAllPartners
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecognitionAward.create({ 
      ...data, 
      partner_email: partnerEmail,
      award_type: "SEFFY_judge"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seffyJudges'] });
      toast.success("SEFFY Judge nomination submitted!");
      setIsAdding(false);
      setFormData({
        nominee_name: "",
        nominee_title: "",
        nominee_email: "",
        nominee_phone: "",
        headshot_url: "",
        nominee_bio: "",
        justification: ""
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecognitionAward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seffyJudges'] });
      toast.success("Nomination deleted");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RecognitionAward.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seffyJudges'] });
      toast.success("Status updated");
    }
  });

  const handleHeadshotUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingHeadshot(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, headshot_url: file_url }));
      toast.success("Headshot uploaded!");
    } catch (error) {
      toast.error("Failed to upload headshot");
    } finally {
      setUploadingHeadshot(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
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

  const getPartnerInfo = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return {
      name: partner?.full_name || email,
      company: partner?.company_name || ''
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">SEFFY Award Judge Nominations</h3>
          <p className="text-sm text-gray-600">Nominate judges for the SEFFY Awards ceremony</p>
        </div>
        {!isAdding && !showAllPartners && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Judge
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  Nominate SEFFY Judge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Judge Name *</Label>
                      <Input
                        value={formData.nominee_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, nominee_name: e.target.value }))}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div>
                      <Label>Title/Position *</Label>
                      <Input
                        value={formData.nominee_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, nominee_title: e.target.value }))}
                        placeholder="e.g., CEO, Investor"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={formData.nominee_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, nominee_email: e.target.value }))}
                        placeholder="judge@example.com"
                        required
                      />
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <Input
                        type="tel"
                        value={formData.nominee_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, nominee_phone: e.target.value }))}
                        placeholder="+971 XX XXX XXXX"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Professional Headshot</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleHeadshotUpload}
                        disabled={uploadingHeadshot}
                        className="flex-1"
                      />
                      {formData.headshot_url && (
                        <img 
                          src={formData.headshot_url} 
                          alt="Preview" 
                          className="w-12 h-12 rounded-lg object-cover border-2 border-indigo-300"
                        />
                      )}
                    </div>
                    {uploadingHeadshot && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                  </div>

                  <div>
                    <Label>Biography/Background</Label>
                    <Textarea
                      value={formData.nominee_bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, nominee_bio: e.target.value }))}
                      rows={4}
                      placeholder="Professional background, expertise, and achievements..."
                    />
                  </div>

                  <div>
                    <Label>Why This Person Should Judge?</Label>
                    <Textarea
                      value={formData.justification}
                      onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                      rows={4}
                      placeholder="Explain their qualifications and why they'd be a great SEFFY judge..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAdding(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600"
                    >
                      Submit Nomination
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid md:grid-cols-2 gap-4">
        {seffyJudges.map((judge) => {
          const partnerInfo = showAllPartners ? getPartnerInfo(judge.partner_email) : null;
          
          return (
            <motion.div
              key={judge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="border-indigo-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      {judge.headshot_url ? (
                        <img 
                          src={judge.headshot_url} 
                          alt={judge.nominee_name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-indigo-300"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <Scale className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-lg">{judge.nominee_name}</h4>
                        {judge.nominee_title && (
                          <p className="text-sm text-gray-600">{judge.nominee_title}</p>
                        )}
                      </div>
                    </div>
                    {!showAllPartners && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(judge.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {showAllPartners && (
                    <div className="mb-3 p-2 bg-blue-50 rounded">
                      <p className="text-xs text-gray-600">Partner: {partnerInfo.name}</p>
                      <p className="text-xs text-gray-500">{judge.partner_email}</p>
                    </div>
                  )}

                  <Badge className={getStatusColor(judge.status)} variant="outline">
                    {judge.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>

                  <div className="mt-3 space-y-2 text-sm">
                    {judge.nominee_email && (
                      <p className="text-gray-600">📧 {judge.nominee_email}</p>
                    )}
                    {judge.nominee_phone && (
                      <p className="text-gray-600">📱 {judge.nominee_phone}</p>
                    )}
                  </div>

                  {judge.nominee_bio && (
                    <div className="mt-3">
                      <p className="font-medium text-gray-700 text-xs mb-1">Bio:</p>
                      <p className="text-gray-600 text-sm line-clamp-3">{judge.nominee_bio}</p>
                    </div>
                  )}

                  {judge.justification && (
                    <div className="mt-3">
                      <p className="font-medium text-gray-700 text-xs mb-1">Justification:</p>
                      <p className="text-gray-600 text-sm line-clamp-2">{judge.justification}</p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-4 pt-4 border-t">
                      <Label className="text-xs mb-2 block">Admin Actions</Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: judge.id, data: { status: "approved" }})}
                          disabled={judge.status === "approved"}
                          className="text-green-600"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMutation.mutate({ id: judge.id, data: { status: "declined" }})}
                          disabled={judge.status === "declined"}
                          className="text-red-600"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  )}

                  {judge.admin_notes && isAdmin && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                      <strong>Admin Notes:</strong> {judge.admin_notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {seffyJudges.length === 0 && !isAdding && (
        <Card>
          <CardContent className="p-12 text-center">
            <Scale className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No SEFFY Judges Nominated</h3>
            <p className="text-gray-600 mb-6">Nominate qualified individuals to judge at the SEFFY Awards</p>
            {!showAllPartners && (
              <Button onClick={() => setIsAdding(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Judge
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}