import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Scale, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PitchJudgeSection({ partnerEmail, isAdmin, showAllPartners }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    award_type: "pitch_competition_judge",
    nominee_name: "",
    nominee_title: "",
    nominee_email: "",
    nominee_phone: "",
    nominee_bio: "",
    justification: ""
  });

  const queryClient = useQueryClient();

  // Fetch judges - ALL if admin global view, otherwise filtered
  const { data: judges = [] } = useQuery({
    queryKey: ['pitchJudges', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        const all = await base44.entities.RecognitionAward.list('-created_date');
        return all.filter(r => r.award_type === 'pitch_competition_judge');
      }
      const filtered = await base44.entities.RecognitionAward.filter({ partner_email: partnerEmail });
      return filtered.filter(r => r.award_type === 'pitch_competition_judge');
    },
    enabled: !!(partnerEmail || showAllPartners),
  });

  // Fetch all partners for displaying names in admin view
  const { data: allPartners = [], isLoading: isLoadingPartners } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: showAllPartners,
  });

  const getPartnerInfo = (email) => {
    if (isLoadingPartners || !allPartners) return { name: email, company: '' };
    const partner = allPartners.find(p => p.email === email);
    return {
      name: partner?.full_name || email,
      company: partner?.company_name || ''
    };
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RecognitionAward.create({ ...data, partner_email: partnerEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitchJudges'] });
      setIsAdding(false);
      setFormData({
        award_type: "pitch_competition_judge",
        nominee_name: "",
        nominee_title: "",
        nominee_email: "",
        nominee_phone: "",
        nominee_bio: "",
        justification: ""
      });
      toast.success("Judge nomination submitted successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RecognitionAward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitchJudges'] });
      toast.success("Judge nomination removed");
    },
  });

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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {showAllPartners ? 'All Pitch Competition Judge Nominations' : 'Pitch Competition Judge'}
              </h3>
              <p className="text-sm text-gray-600">
                {showAllPartners ? 'View judge nominations from all partners' : 'Nominate judges for the pitch competition'}
              </p>
            </div>
          </div>
        </div>
        {!isAdding && !showAllPartners && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nominate Judge
          </Button>
        )}
      </div>

      {/* Admin Stats Card */}
      {showAllPartners && (
        <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-600">{judges.length}</p>
                <p className="text-sm text-gray-600">Total Nominations</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {judges.filter(j => j.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">
                  {judges.filter(j => j.status === 'submitted' || j.status === 'under_review').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      {!showAllPartners && (
        <Card className="border-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-900 mb-1">About Pitch Competition Judges</p>
              <p className="text-sm text-indigo-800">
                Nominate experienced professionals to judge the pitch competition. Judges will evaluate startup presentations and help select winners.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Form - Only show for specific partner */}
      {!showAllPartners && (
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-2 border-indigo-200 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Scale className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Nominate Judge</h3>
                        <p className="text-indigo-100 text-sm">For Pitch Competition</p>
                      </div>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
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
                        <Label>Title/Position</Label>
                        <Input
                          value={formData.nominee_title}
                          onChange={(e) => setFormData(prev => ({ ...prev, nominee_title: e.target.value }))}
                          placeholder="CEO, Investor, etc."
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Contact Email</Label>
                        <Input
                          type="email"
                          value={formData.nominee_email}
                          onChange={(e) => setFormData(prev => ({ ...prev, nominee_email: e.target.value }))}
                          placeholder="judge@email.com"
                        />
                      </div>
                      <div>
                        <Label>Phone Number *</Label>
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
                      <Label>Biography/Credentials</Label>
                      <Textarea
                        value={formData.nominee_bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, nominee_bio: e.target.value }))}
                        rows={4}
                        placeholder="Describe their background, expertise, and relevant experience..."
                      />
                    </div>

                    <div>
                      <Label>Why This Judge?</Label>
                      <Textarea
                        value={formData.justification}
                        onChange={(e) => setFormData(prev => ({ ...prev, justification: e.target.value }))}
                        rows={4}
                        placeholder="Explain why this person would be an excellent judge for the pitch competition..."
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAdding(false)}
                        size="lg"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createMutation.isPending}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                        size="lg"
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        Submit Nomination
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Judges Grid */}
      {judges.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {judges.map((judge, index) => {
            const partnerInfo = showAllPartners ? getPartnerInfo(judge.partner_email) : null;
            
            return (
              <motion.div
                key={judge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group border-2 border-gray-100 hover:border-indigo-300 hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur">
                        #{index + 1}
                      </Badge>
                      {!showAllPartners && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(judge.id)}
                          className="text-white hover:bg-white/20 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-xl text-white mb-1">{judge.nominee_name}</h4>
                      {judge.nominee_title && (
                        <p className="text-indigo-100 text-sm">{judge.nominee_title}</p>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-5 flex-1 flex flex-col">
                    {/* Partner Info - Only in admin global view */}
                    {showAllPartners && partnerInfo && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Nominated by</p>
                        <p className="font-semibold text-sm text-gray-900">{partnerInfo.name}</p>
                        {partnerInfo.company && (
                          <p className="text-xs text-gray-600">{partnerInfo.company}</p>
                        )}
                      </div>
                    )}

                    <Badge className={`${getStatusColor(judge.status)} mb-4 w-fit text-xs px-3 py-1`}>
                      {judge.status.replace(/_/g, ' ')}
                    </Badge>

                    <div className="space-y-1 mb-3">
                      {judge.nominee_email && (
                        <p className="text-sm text-blue-600">📧 {judge.nominee_email}</p>
                      )}
                      {judge.nominee_phone && (
                        <p className="text-sm text-gray-600">📱 {judge.nominee_phone}</p>
                      )}
                    </div>

                    {judge.nominee_bio && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Credentials:</p>
                        <p className="text-sm text-gray-700 line-clamp-3">{judge.nominee_bio}</p>
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Justification:</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{judge.justification}</p>
                    </div>

                    {judge.admin_notes && isAdmin && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-900 mb-1">Admin Notes</p>
                        <p className="text-xs text-yellow-800">{judge.admin_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {judges.length === 0 && !isAdding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Scale className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {showAllPartners ? 'No Judges Nominated Yet' : 'No Judges Nominated Yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {showAllPartners 
                  ? 'There are currently no pitch competition judge nominations from any partner.' 
                  : 'Nominate experienced professionals to judge the pitch competition and help identify the best startups.'}
              </p>
              {!showAllPartners && (
                <Button 
                  onClick={() => setIsAdding(true)} 
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nominate First Judge
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}