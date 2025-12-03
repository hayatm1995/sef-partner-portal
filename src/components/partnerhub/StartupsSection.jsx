import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Rocket, AlertCircle, ExternalLink, Linkedin, Twitter, Instagram, Facebook, Sparkles, TrendingUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const MAX_STARTUPS = 3;

export default function StartupsSection({ partnerEmail, isAdmin, showAllPartners }) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    startup_name: "",
    founder_name: "",
    founder_email: "",
    founder_phone: "",
    startup_description: "",
    deck_url: "",
    website: "",
    linkedin_url: "",
    twitter_url: "",
    instagram_url: "",
    facebook_url: "",
    stage: "idea"
  });

  const queryClient = useQueryClient();

  // Fetch startups - ALL if admin global view, otherwise filtered
  const { data: startups = [] } = useQuery({
    queryKey: ['startups', partnerEmail, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        return await base44.entities.StartupNomination.list({ sort: '-created_date' });
      }
      return await base44.entities.StartupNomination.filter({ partner_email: partnerEmail });
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
    if (isLoadingPartners || !allPartners) return { name: email, company: '' }; // Handle loading state
    const partner = allPartners.find(p => p.email === email);
    return {
      name: partner?.full_name || email,
      company: partner?.company_name || ''
    };
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StartupNomination.create({ ...data, partner_email: partnerEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] }); // This will invalidate all startup queries, including the specific partner's and the all-partners view
      setIsAdding(false);
      setFormData({
        startup_name: "",
        founder_name: "",
        founder_email: "",
        founder_phone: "",
        startup_description: "",
        deck_url: "",
        website: "",
        linkedin_url: "",
        twitter_url: "",
        instagram_url: "",
        facebook_url: "",
        stage: "idea"
      });
      toast.success("🚀 Startup nominated successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StartupNomination.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['startups'] }); // This will invalidate all startup queries
      toast.success("Startup removed");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const partnerStartupsCount = startups.filter(s => s.partner_email === partnerEmail).length;
  const canAddMore = !showAllPartners && partnerStartupsCount < MAX_STARTUPS;
  const progressPercent = showAllPartners ? 0 : (partnerStartupsCount / MAX_STARTUPS) * 100;

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-500 text-white",
      under_review: "bg-yellow-500 text-white",
      approved: "bg-green-500 text-white",
      declined: "bg-red-500 text-white"
    };
    return colors[status] || "bg-gray-500 text-white";
  };

  const getStageInfo = (stage) => {
    const info = {
      idea: { color: "bg-slate-100 text-slate-700 border-slate-300", icon: "💡" },
      mvp: { color: "bg-blue-100 text-blue-700 border-blue-300", icon: "🔨" },
      early_revenue: { color: "bg-green-100 text-green-700 border-green-300", icon: "💰" },
      growth: { color: "bg-purple-100 text-purple-700 border-purple-300", icon: "📈" },
      scale: { color: "bg-orange-100 text-orange-700 border-orange-300", icon: "🚀" }
    };
    return info[stage] || info.idea;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {showAllPartners ? 'All Startup Nominations' : 'Startup Nominations'}
              </h3>
              <p className="text-sm text-gray-600">
                {showAllPartners ? 'View submissions from all partners' : 'Showcase innovative startups at SEF'}
              </p>
            </div>
          </div>
        </div>
        {canAddMore && !isAdding && !showAllPartners && (
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nominate Startup
          </Button>
        )}
      </div>

      {/* Progress Card - Only show for specific partner view */}
      {!showAllPartners && (
        <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-semibold text-gray-700">Nomination Progress</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                {partnerStartupsCount}/{MAX_STARTUPS}
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-3 bg-orange-100" 
            />
            <p className="text-xs text-gray-600 mt-2">
              {canAddMore 
                ? `${MAX_STARTUPS - partnerStartupsCount} nomination${MAX_STARTUPS - partnerStartupsCount !== 1 ? 's' : ''} remaining`
                : "Maximum nominations reached"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Admin Stats Card */}
      {showAllPartners && (
        <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-blue-600">{startups.length}</p>
                <p className="text-sm text-gray-600">Total Nominations</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {startups.filter(s => s.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600">Approved</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-yellow-600">
                  {startups.filter(s => s.status === 'submitted' || s.status === 'under_review').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Limit Reached Warning - Only for partner view */}
      {!canAddMore && !showAllPartners && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-yellow-900">Maximum Nominations Reached</p>
                <p className="text-sm text-yellow-800">
                  Contact your account manager if you need to nominate additional startups.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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
              <Card className="border-2 border-orange-200 shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Nominate a Startup</h3>
                        <p className="text-orange-100 text-sm">Share innovative startups with the SEF community</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAdding(false)}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-6">
                  {/* Security Deposit Notice */}
                  <Card className="border-2 border-blue-200 bg-blue-50 mb-6">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900 mb-1">💰 Refundable Security Deposit</p>
                          <p className="text-sm text-blue-800">
                            Startups will be required to pay <strong>AED 1,000</strong> as a refundable security deposit. 
                            This deposit will be fully refunded after the event.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Startup Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        Startup Information
                      </div>
                      
                      <div>
                        <Label className="text-sm font-semibold">Startup Name *</Label>
                        <Input
                          value={formData.startup_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, startup_name: e.target.value }))}
                          placeholder="e.g., InnovateTech Solutions"
                          className="mt-1.5"
                          required
                        />
                      </div>

                      <div className="grid md::grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold">Founder Name *</Label>
                          <Input
                            value={formData.founder_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, founder_name: e.target.value }))}
                            placeholder="Full name"
                            className="mt-1.5"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Founder Email *</Label>
                          <Input
                            type="email"
                            value={formData.founder_email}
                            onChange={(e) => setFormData(prev => ({ ...prev, founder_email: e.target.value }))}
                            placeholder="founder@startup.com"
                            className="mt-1.5"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold">Founder Phone *</Label>
                          <Input
                            type="tel"
                            value={formData.founder_phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, founder_phone: e.target.value }))}
                            placeholder="+971 50 XXX XXXX"
                            className="mt-1.5"
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Startup Stage</Label>
                          <Select
                            value={formData.stage}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="idea">💡 Idea Stage</SelectItem>
                              <SelectItem value="mvp">🔨 MVP Stage</SelectItem>
                              <SelectItem value="early_revenue">💰 Early Revenue</SelectItem>
                              <SelectItem value="growth">📈 Growth Stage</SelectItem>
                              <SelectItem value="scale">🚀 Scaling</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold">Startup Description *</Label>
                        <Textarea
                          value={formData.startup_description}
                          onChange={(e) => setFormData(prev => ({ ...prev, startup_description: e.target.value }))}
                          rows={4}
                          placeholder="Describe the startup, the problem it solves, and its unique value proposition..."
                          className="mt-1.5 resize-none"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Be detailed and compelling</p>
                      </div>
                    </div>

                    {/* Links Section */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <ExternalLink className="w-4 h-4 text-orange-600" />
                        Links & Resources
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-semibold">Website</Label>
                          <Input
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                            placeholder="https://startup.com"
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-semibold">Pitch Deck URL *</Label>
                          <Input
                            type="url"
                            value={formData.deck_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, deck_url: e.target.value }))}
                            placeholder="Google Drive, Dropbox, etc."
                            className="mt-1.5"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Social Media */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <Label className="text-sm font-semibold flex items-center gap-2">
                        <div className="flex -space-x-1">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                            <Linkedin className="w-3 h-3 text-white" />
                          </div>
                          <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                            <Twitter className="w-3 h-3 text-white" />
                          </div>
                          <div className="w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
                            <Instagram className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        Social Media Profiles
                      </Label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                            LinkedIn
                          </Label>
                          <Input
                            type="url"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                            placeholder="https://linkedin.com/company/..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Twitter className="w-3.5 h-3.5 text-blue-400" />
                            Twitter/X
                          </Label>
                          <Input
                            type="url"
                            value={formData.twitter_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, twitter_url: e.target.value }))}
                            placeholder="https://twitter.com/..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Instagram className="w-3.5 h-3.5 text-pink-600" />
                            Instagram
                          </Label>
                          <Input
                            type="url"
                            value={formData.instagram_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, instagram_url: e.target.value }))}
                            placeholder="https://instagram.com/..."
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 flex items-center gap-1.5">
                            <Facebook className="w-3.5 h-3.5 text-blue-700" />
                            Facebook
                          </Label>
                          <Input
                            type="url"
                            value={formData.facebook_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, facebook_url: e.target.value }))}
                            placeholder="https://facebook.com/..."
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
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
                        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                        size="lg"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
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

      {/* Startups Grid */}
      {startups.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.map((startup, index) => {
            const stageInfo = getStageInfo(startup.stage);
            const partnerInfo = showAllPartners ? getPartnerInfo(startup.partner_email) : null;
            
            return (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="group border-2 border-gray-100 hover:border-orange-300 hover:shadow-2xl transition-all duration-300 h-full flex flex-col overflow-hidden">
                  <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-4">
                    <div className="flex justify-between items-start">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur">
                        #{index + 1}
                      </Badge>
                      {!showAllPartners && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(startup.id)}
                          className="text-white hover:bg-white/20 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-3">
                      <h4 className="font-bold text-xl text-white mb-1 line-clamp-2">{startup.startup_name}</h4>
                      <Badge className={`${stageInfo.color} border text-xs`}>
                        {stageInfo.icon} {startup.stage.replace(/_/g, ' ')}
                      </Badge>
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

                    <Badge className={`${getStatusColor(startup.status)} mb-4 w-fit text-xs px-3 py-1`}>
                      {startup.status.replace(/_/g, ' ')}
                    </Badge>

                    <p className="text-sm text-gray-700 line-clamp-3 mb-4 flex-1">{startup.startup_description}</p>
                    
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Founder</p>
                        <p className="font-semibold text-gray-900">{startup.founder_name}</p>
                        <p className="text-sm text-blue-600">{startup.founder_email}</p>
                      </div>

                      {(startup.website || startup.deck_url) && (
                        <div className="flex gap-2">
                          {startup.website && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(startup.website, '_blank')}
                              className="flex-1"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Website
                            </Button>
                          )}
                          {startup.deck_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(startup.deck_url, '_blank')}
                              className="flex-1"
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Deck
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {(startup.linkedin_url || startup.twitter_url || startup.instagram_url || startup.facebook_url) && (
                        <div className="flex gap-1.5 pt-2">
                          {startup.linkedin_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 hover:bg-blue-50"
                              onClick={() => window.open(startup.linkedin_url, '_blank')}
                              title="LinkedIn"
                            >
                              <Linkedin className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}
                          {startup.twitter_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 hover:bg-blue-50"
                              onClick={() => window.open(startup.twitter_url, '_blank')}
                              title="Twitter/X"
                            >
                              <Twitter className="w-4 h-4 text-blue-400" />
                            </Button>
                          )}
                          {startup.instagram_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 hover:bg-pink-50"
                              onClick={() => window.open(startup.instagram_url, '_blank')}
                              title="Instagram"
                            >
                              <Instagram className="w-4 h-4 text-pink-600" />
                            </Button>
                          )}
                          {startup.facebook_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 hover:bg-blue-50"
                              onClick={() => window.open(startup.facebook_url, '_blank')}
                              title="Facebook"
                            >
                              <Facebook className="w-4 h-4 text-blue-700" />
                            </Button>
                          )}
                        </div>
                      )}

                      {startup.admin_notes && isAdmin && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-xs font-semibold text-yellow-900 mb-1">Admin Notes</p>
                          <p className="text-xs text-yellow-800">{startup.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {startups.length === 0 && !isAdding && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {showAllPartners ? 'No Startups Nominated Yet' : 'No Startups Nominated Yet'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {showAllPartners 
                  ? 'There are currently no startup nominations from any partner.' 
                  : 'Showcase innovative startups at SEF 2026. Share their stories and help them gain visibility.'}
              </p>
              {!showAllPartners && (
                <Button 
                  onClick={() => setIsAdding(true)} 
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nominate First Startup
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}