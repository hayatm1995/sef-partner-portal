
import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  Link as LinkIcon,
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin,
  Globe,
  Plus,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  X,
  Youtube,
  Radio,
  Tv,
  Newspaper,
  Mail as MailIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MediaTracker() {
  const [showForm, setShowForm] = useState(false);
  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [formData, setFormData] = useState({
    platform: "",
    upload_date: new Date().toISOString().split('T')[0],
    proof_type: "both",
    screenshot_urls: [],
    post_url: "",
    campaign_name: "",
    reach: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: mediaProofs = [] } = useQuery({
    queryKey: ['mediaProofs', user?.email, user?.role, user?.is_super_admin], // Added user role/admin status to queryKey
    queryFn: async () => {
      if (user?.role === 'admin' || user?.is_super_admin) {
        return base44.entities.MediaUsage.list('-upload_date'); // Admins see all
      }
      return base44.entities.MediaUsage.filter({ partner_email: user?.email }, '-upload_date'); // Partners see their own
    },
    enabled: !!user,
  });

  const createProofMutation = useMutation({
    mutationFn: (data) => base44.entities.MediaUsage.create({
      ...data,
      partner_email: user.email
    }),
    onSuccess: async (newProof) => {
      // Log the activity
      try {
        await base44.entities.ActivityLog.create({
          activity_type: "deliverable_submitted",
          user_email: user.email,
          description: `Media upload shared: ${newProof.platform} - ${newProof.campaign_name || 'Media proof'}`,
          metadata: {
            media_id: newProof.id,
            platform: newProof.platform,
            campaign_name: newProof.campaign_name
          }
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      queryClient.invalidateQueries({ queryKey: ['mediaProofs'] });
      setShowForm(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      platform: "",
      upload_date: new Date().toISOString().split('T')[0],
      proof_type: "both",
      screenshot_urls: [],
      post_url: "",
      campaign_name: "",
      reach: "",
      notes: ""
    });
  };

  const handleScreenshotUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingScreenshots(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      
      setFormData(prev => ({
        ...prev,
        screenshot_urls: [...prev.screenshot_urls, ...urls]
      }));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploadingScreenshots(false);
    }
  };

  const removeScreenshot = (index) => {
    setFormData(prev => ({
      ...prev,
      screenshot_urls: prev.screenshot_urls.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createProofMutation.mutate({
      ...formData,
      reach: formData.reach ? Number(formData.reach) : null
    });
  };

  const platforms = [
    { value: "facebook", label: "Facebook", icon: Facebook, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    { value: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-600", bgColor: "bg-pink-50", borderColor: "border-pink-200" },
    { value: "twitter", label: "Twitter/X", icon: Twitter, color: "text-sky-600", bgColor: "bg-sky-50", borderColor: "border-sky-200" },
    { value: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-300" },
    { value: "tiktok", label: "TikTok", icon: Globe, color: "text-gray-900", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
    { value: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
    { value: "website", label: "Website", icon: Globe, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
    { value: "email", label: "Email", icon: MailIcon, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    { value: "radio", label: "Radio", icon: Radio, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    { value: "tv", label: "TV", icon: Tv, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" },
    { value: "print", label: "Print", icon: Newspaper, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" },
    { value: "other", label: "Other", icon: Globe, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" }
  ];

  const getPlatformIcon = (platform) => {
    const p = platforms.find(pl => pl.value === platform);
    return p ? p.icon : Globe;
  };

  const getPlatformColor = (platform) => {
    const p = platforms.find(pl => pl.value === platform);
    return p ? p.color : "text-gray-600";
  };

  const getPlatformBg = (platform) => {
    const p = platforms.find(pl => pl.value === platform);
    return p ? p.bgColor : "bg-gray-50";
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      verified: "bg-green-100 text-green-800",
      needs_review: "bg-yellow-100 text-yellow-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredProofs = selectedPlatform === "all" 
    ? mediaProofs 
    : mediaProofs.filter(p => p.platform === selectedPlatform);

  const getPlatformCount = (platform) => {
    return mediaProofs.filter(p => p.platform === platform).length;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Media Upload Tracker</h1>
            <p className="text-gray-600">
              {user?.role === 'admin' || user?.is_super_admin 
                ? 'View all partner media uploads and track engagement' 
                : 'Share your media uploads and track engagement across platforms'}
            </p>
          </div>
          {(user?.role !== 'admin' && !user?.is_super_admin) && (
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Share Upload
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-blue-100 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Uploads</p>
                  <p className="text-3xl font-bold text-blue-600">{mediaProofs.length}</p>
                </div>
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-3xl font-bold text-green-600">
                    {mediaProofs.filter(m => m.status === 'verified').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-100 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Under Review</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {mediaProofs.filter(m => m.status === 'submitted' || m.status === 'needs_review').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Platforms</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {[...new Set(mediaProofs.map(m => m.platform))].length}
                  </p>
                </div>
                <Globe className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Navigation */}
        <Card className="mb-8 border-orange-100 shadow-md">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Filter by Platform</h3>
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPlatform("all")}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedPlatform === "all"
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-orange-300'
                }`}
              >
                <Globe className={`w-5 h-5 ${selectedPlatform === "all" ? "text-orange-600" : "text-gray-600"}`} />
                <span className={`font-medium ${selectedPlatform === "all" ? "text-orange-900" : "text-gray-700"}`}>
                  All
                </span>
                <Badge variant="secondary" className="ml-1">{mediaProofs.length}</Badge>
              </motion.button>

              {platforms.map((platform) => {
                const count = getPlatformCount(platform.value);
                if (count === 0) return null;
                
                const PlatformIcon = platform.icon;
                
                return (
                  <motion.button
                    key={platform.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPlatform(platform.value)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      selectedPlatform === platform.value
                        ? `${platform.borderColor} ${platform.bgColor} shadow-md`
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <PlatformIcon className={`w-5 h-5 ${selectedPlatform === platform.value ? platform.color : "text-gray-600"}`} />
                    <span className={`font-medium ${selectedPlatform === platform.value ? "text-gray-900" : "text-gray-700"}`}>
                      {platform.label}
                    </span>
                    <Badge variant="secondary" className="ml-1">{count}</Badge>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upload Form */}
        <AnimatePresence>
          {showForm && (user?.role !== 'admin' && !user?.is_super_admin) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="border-orange-100 shadow-lg">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Share Your Media Upload</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label>Platform *</Label>
                        <Select
                          value={formData.platform}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            {platforms.map(platform => {
                              const PlatformFormIcon = platform.icon;
                              return (
                                <SelectItem key={platform.value} value={platform.value}>
                                  <div className="flex items-center gap-2">
                                    <PlatformFormIcon className={`w-4 h-4 ${platform.color}`} />
                                    {platform.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Upload Date *</Label>
                        <Input
                          type="date"
                          value={formData.upload_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, upload_date: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Campaign/Context Name</Label>
                      <Input
                        value={formData.campaign_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                        placeholder="e.g., SEF 2025 Promotion"
                      />
                    </div>

                    <div>
                      <Label>Post/Content URL</Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="url"
                          value={formData.post_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, post_url: e.target.value }))}
                          placeholder="https://..."
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Upload Screenshots</Label>
                      <div className="mt-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleScreenshotUpload}
                          className="hidden"
                          id="screenshot-upload"
                          disabled={uploadingScreenshots}
                        />
                        <label htmlFor="screenshot-upload">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            disabled={uploadingScreenshots}
                            asChild
                          >
                            <span>
                              {uploadingScreenshots ? (
                                <>
                                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <ImageIcon className="w-4 h-4 mr-2" />
                                  Select Screenshots
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>

                      {formData.screenshot_urls.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          {formData.screenshot_urls.map((url, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={url} 
                                alt={`Screenshot ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeScreenshot(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>Estimated Reach/Impressions</Label>
                      <Input
                        type="number"
                        value={formData.reach}
                        onChange={(e) => setFormData(prev => ({ ...prev, reach: e.target.value }))}
                        placeholder="Optional"
                      />
                    </div>

                    <div>
                      <Label>Additional Notes</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any additional information..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createProofMutation.isPending || !formData.platform}
                        className="bg-gradient-to-r from-orange-500 to-amber-600"
                      >
                        {createProofMutation.isPending ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Share Upload
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submissions List */}
        <Card className="border-orange-100 shadow-md">
          <CardHeader>
            <CardTitle>
              {selectedPlatform === "all" ? "All Submissions" : `${platforms.find(p => p.value === selectedPlatform)?.label} Submissions`}
              {(user?.role === 'admin' || user?.is_super_admin) && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (All Partners)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProofs.length > 0 ? (
              <div className="space-y-4">
                {filteredProofs.map((proof) => {
                  const Icon = getPlatformIcon(proof.platform);
                  return (
                    <motion.div
                      key={proof.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${getPlatformBg(proof.platform)} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-6 h-6 ${getPlatformColor(proof.platform)}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 capitalize">
                              {proof.platform} - {proof.campaign_name || 'Upload'}
                            </h3>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">
                                {format(new Date(proof.upload_date), 'MMM d, yyyy')}
                              </p>
                              {(user?.role === 'admin' || user?.is_super_admin) && (
                                <Badge variant="outline" className="text-xs text-gray-600 bg-gray-100 border-gray-200">
                                  {proof.partner_email}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(proof.status)}>
                          {proof.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>

                      {proof.screenshot_urls && proof.screenshot_urls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {proof.screenshot_urls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Screenshot ${idx + 1}`}
                              className="w-full h-20 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                              onClick={() => window.open(url, '_blank')}
                            />
                          ))}
                        </div>
                      )}

                      {proof.post_url && (
                        <a
                          href={proof.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2"
                        >
                          <LinkIcon className="w-3 h-3" />
                          View Post
                        </a>
                      )}

                      {proof.reach && (
                        <p className="text-sm text-gray-600 mb-2">
                          Reach: <span className="font-semibold">{proof.reach.toLocaleString()}</span>
                        </p>
                      )}

                      {proof.notes && (
                        <p className="text-sm text-gray-600 italic">{proof.notes}</p>
                      )}

                      {proof.admin_notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Admin Feedback:</p>
                          <p className="text-sm text-blue-800">{proof.admin_notes}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {selectedPlatform === "all" ? "No submissions yet" : `No ${platforms.find(p => p.value === selectedPlatform)?.label} submissions yet`}
                </h3>
                <p className="text-gray-600 mb-6">
                  {user?.role === 'admin' || user?.is_super_admin 
                    ? 'No partners have shared media uploads yet.' 
                    : 'Share your media uploads to start tracking engagement'}
                </p>
                {(user?.role !== 'admin' && !user?.is_super_admin) && (
                  <Button onClick={() => setShowForm(true)} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Share First Upload
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
