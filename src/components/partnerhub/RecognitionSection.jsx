import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Award, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function RecognitionSection({ partnerEmail, isAdmin, showAllPartners }) {
  const [activeTab, setActiveTab] = useState("seffy_awards");
  const [isAddingSeffy, setIsAddingSeffy] = useState(false);
  const [isAddingPitch, setIsAddingPitch] = useState(false);
  
  const [seffyForm, setSeffyForm] = useState({
    nominee_name: "",
    nominee_title: "",
    nominee_email: "",
    nominee_phone: "",
    nominee_bio: ""
  });
  
  const [pitchForm, setPitchForm] = useState({
    nominee_name: "",
    nominee_title: "",
    nominee_email: "",
    nominee_phone: "",
    nominee_bio: ""
  });

  const queryClient = useQueryClient();

  // Fetch all partners for admin view
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAllPartners
  });

  const getPartnerInfo = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return {
      name: partner?.full_name || email,
      company: partner?.company_name || ''
    };
  };

  // SEFFY Awards nominations
  const { data: seffyNominations = [] } = useQuery({
    queryKey: ['seffyAwardsNominations', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        return await base44.entities.RecognitionAward.filter({ award_type: 'SEFFY_presenter' });
      }
      return await base44.entities.RecognitionAward.filter({ 
        partner_email: partnerEmail,
        award_type: 'SEFFY_presenter'
      });
    },
    enabled: !!partnerEmail || showAllPartners
  });

  // Pitch Competition nominations
  const { data: pitchNominations = [] } = useQuery({
    queryKey: ['pitchCompetitionNominations', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        return await base44.entities.RecognitionAward.filter({ award_type: 'pitch_competition_presenter' });
      }
      return await base44.entities.RecognitionAward.filter({ 
        partner_email: partnerEmail,
        award_type: 'pitch_competition_presenter'
      });
    },
    enabled: !!partnerEmail || showAllPartners
  });

  const createSeffyMutation = useMutation({
    mutationFn: (data) => base44.entities.RecognitionAward.create({ 
      ...data, 
      partner_email: partnerEmail,
      award_type: 'SEFFY_presenter'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seffyAwardsNominations'] });
      setIsAddingSeffy(false);
      setSeffyForm({ nominee_name: "", nominee_title: "", nominee_email: "", nominee_phone: "", nominee_bio: "" });
      toast.success("SEFFY Awards nomination submitted!");
    }
  });

  const createPitchMutation = useMutation({
    mutationFn: (data) => base44.entities.RecognitionAward.create({ 
      ...data, 
      partner_email: partnerEmail,
      award_type: 'pitch_competition_presenter'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitchCompetitionNominations'] });
      setIsAddingPitch(false);
      setPitchForm({ nominee_name: "", nominee_title: "", nominee_email: "", nominee_phone: "", nominee_bio: "" });
      toast.success("Pitch Competition nomination submitted!");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecognitionAward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seffyAwardsNominations'] });
      queryClient.invalidateQueries({ queryKey: ['pitchCompetitionNominations'] });
      toast.success("Nomination deleted");
    }
  });

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const renderNominationForm = (type) => {
    const isSeffy = type === 'seffy';
    const form = isSeffy ? seffyForm : pitchForm;
    const setForm = isSeffy ? setSeffyForm : setPitchForm;
    const mutation = isSeffy ? createSeffyMutation : createPitchMutation;
    const setIsAdding = isSeffy ? setIsAddingSeffy : setIsAddingPitch;
    const title = isSeffy ? 'SEFFY Awards' : 'Pitch Competition';
    const gradient = isSeffy ? 'from-amber-500 to-orange-600' : 'from-indigo-500 to-purple-600';

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Card className="border-2 border-gray-200 shadow-lg">
          <div className={`bg-gradient-to-r ${gradient} px-6 py-4`}>
            <h3 className="text-xl font-bold text-white">{title} Nomination</h3>
            <p className="text-white/80 text-sm">Submit your nomination details</p>
          </div>
          <CardContent className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={form.nominee_name}
                    onChange={(e) => setForm(prev => ({ ...prev, nominee_name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <Label>Title/Position</Label>
                  <Input
                    value={form.nominee_title}
                    onChange={(e) => setForm(prev => ({ ...prev, nominee_title: e.target.value }))}
                    placeholder="e.g., CEO, Director"
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
                    placeholder="email@example.com"
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
                <Label>Bio/Background</Label>
                <Textarea
                  value={form.nominee_bio}
                  onChange={(e) => setForm(prev => ({ ...prev, nominee_bio: e.target.value }))}
                  rows={4}
                  placeholder="Brief background and relevant experience..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} className={`bg-gradient-to-r ${gradient}`}>
                  Submit Nomination
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderNominationCards = (nominations, type) => {
    const isSeffy = type === 'seffy';
    const gradient = isSeffy ? 'from-amber-500 to-orange-600' : 'from-indigo-500 to-purple-600';
    const Icon = isSeffy ? Award : Scale;

    if (nominations.length === 0) {
      return (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <Icon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Nominations Yet</h3>
            <p className="text-gray-600 mb-6">Be the first to submit a nomination</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-4">
        {nominations.map((nomination) => {
          const partnerInfo = showAllPartners ? getPartnerInfo(nomination.partner_email) : null;
          
          return (
            <motion.div
              key={nomination.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <div className={`bg-gradient-to-r ${gradient} px-4 py-3`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold">{nomination.nominee_name}</span>
                    </div>
                    {!showAllPartners && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(nomination.id)}
                        className="text-white hover:bg-white/20 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  {showAllPartners && partnerInfo && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600 font-semibold">Submitted by</p>
                      <p className="text-sm font-medium">{partnerInfo.name}</p>
                    </div>
                  )}

                  {nomination.nominee_title && (
                    <p className="text-sm text-gray-600 mb-2">{nomination.nominee_title}</p>
                  )}

                  <Badge className={getStatusColor(nomination.status)} variant="outline">
                    {nomination.status?.replace(/_/g, ' ') || 'submitted'}
                  </Badge>

                  <div className="mt-3 space-y-1 text-sm">
                    {nomination.nominee_email && (
                      <p className="text-gray-600">📧 {nomination.nominee_email}</p>
                    )}
                    {nomination.nominee_phone && (
                      <p className="text-gray-600">📱 {nomination.nominee_phone}</p>
                    )}
                  </div>

                  {nomination.nominee_bio && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500 mb-1">Bio</p>
                      <p className="text-sm text-gray-700 line-clamp-3">{nomination.nominee_bio}</p>
                    </div>
                  )}

                  {nomination.admin_notes && isAdmin && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                      <strong>Admin Notes:</strong> {nomination.admin_notes}
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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="seffy_awards" className="gap-2">
            <Award className="w-4 h-4" />
            SEFFY Awards
          </TabsTrigger>
          <TabsTrigger value="pitch_competition" className="gap-2">
            <Scale className="w-4 h-4" />
            Pitch Competition
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seffy_awards">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">SEFFY Awards Nominations</h3>
                <p className="text-sm text-gray-600">Submit nominations for the SEFFY Awards ceremony</p>
              </div>
              {!isAddingSeffy && !showAllPartners && (
                <Button
                  onClick={() => setIsAddingSeffy(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Nomination
                </Button>
              )}
            </div>

            <AnimatePresence>
              {isAddingSeffy && renderNominationForm('seffy')}
            </AnimatePresence>

            {renderNominationCards(seffyNominations, 'seffy')}
          </div>
        </TabsContent>

        <TabsContent value="pitch_competition">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Pitch Competition Nominations</h3>
                <p className="text-sm text-gray-600">Submit nominations for the Pitch Competition</p>
              </div>
              {!isAddingPitch && !showAllPartners && (
                <Button
                  onClick={() => setIsAddingPitch(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Nomination
                </Button>
              )}
            </div>

            <AnimatePresence>
              {isAddingPitch && renderNominationForm('pitch')}
            </AnimatePresence>

            {renderNominationCards(pitchNominations, 'pitch')}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}