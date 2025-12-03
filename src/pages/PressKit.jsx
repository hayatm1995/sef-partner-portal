import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Megaphone, Mail, Phone, FileText, Download, UserCircle, RefreshCcw, MessageSquare, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

export default function PressKit() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(location.search);
  const viewAsEmail = urlParams.get('viewAs');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const effectivePartnerEmail = viewAsEmail || user?.email;
  const isAdmin = user?.role === 'admin' || user?.is_super_admin;

  const { data: prMarketing = {} } = useQuery({
    queryKey: ['prMarketing', effectivePartnerEmail],
    queryFn: async () => {
      const prData = await base44.entities.PRMarketing.filter({ partner_email: effectivePartnerEmail });
      return prData[0] || {};
    },
    enabled: !!effectivePartnerEmail,
  });

  const updatePRMarketingMutation = useMutation({
    mutationFn: (data) => {
      if (prMarketing.id) {
        return base44.entities.PRMarketing.update(prMarketing.id, data);
      } else {
        return base44.entities.PRMarketing.create({ ...data, partner_email: effectivePartnerEmail });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prMarketing'] });
      toast.success("PR information updated!");
      setEditMode(false);
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  React.useEffect(() => {
    setFormData({
      spokesperson_name_en: prMarketing.spokesperson_name_en || "",
      spokesperson_name_ar: prMarketing.spokesperson_name_ar || "",
      spokesperson_title_en: prMarketing.spokesperson_title_en || "",
      spokesperson_title_ar: prMarketing.spokesperson_title_ar || "",
      pr_quote_en: prMarketing.pr_quote_en || "",
      pr_quote_ar: prMarketing.pr_quote_ar || "",
      media_contact_preference: prMarketing.media_contact_preference || "",
    });
  }, [prMarketing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePRMarketingMutation.mutate(formData);
  };

  const mediaResources = [
    { title: "SEF 2026 Press Release", description: "Official festival announcement", file_url: "https://sharjahef.com/press", icon: FileText },
    { title: "Media Kit & Logos", description: "High-resolution brand assets", file_url: "https://sharjahef.com/media-kit", icon: Download },
    { title: "Event Fact Sheet", description: "Key facts and figures", file_url: "https://sharjahef.com/facts", icon: FileText },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PR & Press</h1>
          <p className="text-gray-600">Media resources and spokesperson information</p>
        </div>

        <Card className="mb-8 border-blue-200/50 shadow-2xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 p-10 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative flex items-start gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl border border-white/20">
                <Megaphone className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">Media Relations Hub</h2>
                <p className="text-white/95 text-xl font-medium">Resources for effective public relations and media engagement</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-6 border-orange-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <UserCircle className="w-6 h-6 text-orange-600" />
                Your Spokesperson Information
              </CardTitle>
              {(!isAdmin || viewAsEmail) && (
                <Button variant="outline" onClick={() => setEditMode(!editMode)}>
                  <RefreshCcw className="w-4 h-4 mr-2" /> {editMode ? 'Cancel' : 'Edit'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Spokesperson Name (English)</Label>
                  <Input value={formData.spokesperson_name_en} onChange={(e) => setFormData({ ...formData, spokesperson_name_en: e.target.value })} disabled={!editMode} />
                </div>
                <div>
                  <Label>Spokesperson Name (Arabic)</Label>
                  <Input value={formData.spokesperson_name_ar} onChange={(e) => setFormData({ ...formData, spokesperson_name_ar: e.target.value })} disabled={!editMode} dir="rtl" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Title (English)</Label>
                  <Input value={formData.spokesperson_title_en} onChange={(e) => setFormData({ ...formData, spokesperson_title_en: e.target.value })} disabled={!editMode} />
                </div>
                <div>
                  <Label>Title (Arabic)</Label>
                  <Input value={formData.spokesperson_title_ar} onChange={(e) => setFormData({ ...formData, spokesperson_title_ar: e.target.value })} disabled={!editMode} dir="rtl" />
                </div>
              </div>
              <div>
                <Label>PR Quote (English)</Label>
                <Textarea value={formData.pr_quote_en} onChange={(e) => setFormData({ ...formData, pr_quote_en: e.target.value })} rows={3} disabled={!editMode} />
              </div>
              <div>
                <Label>PR Quote (Arabic)</Label>
                <Textarea value={formData.pr_quote_ar} onChange={(e) => setFormData({ ...formData, pr_quote_ar: e.target.value })} rows={3} disabled={!editMode} dir="rtl" />
              </div>
              <div>
                <Label>Preferred Media Contact Method</Label>
                <Input value={formData.media_contact_preference} onChange={(e) => setFormData({ ...formData, media_contact_preference: e.target.value })} placeholder="e.g., Email, Phone, Via Account Manager" disabled={!editMode} />
              </div>
              {editMode && (
                <Button type="submit" disabled={updatePRMarketingMutation.isPending} className="bg-gradient-to-r from-orange-500 to-amber-600">
                  {updatePRMarketingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              )}
            </form>
            {!prMarketing.id && (!isAdmin || viewAsEmail) && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">Please fill in your spokesperson information for press materials.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 border-green-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Download className="w-6 h-6 text-green-600" />
              Media Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4">
              {mediaResources.map((resource, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <resource.icon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">{resource.title}</p>
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => window.open(resource.file_url, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" /> View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/50 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Mail className="w-6 h-6 text-purple-600" />
              Media Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <UserCircle className="w-10 h-10 text-purple-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 text-lg">SEF Media Relations Team</p>
                <p className="text-sm text-gray-600">For all press inquiries and interview requests</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-purple-600" />
                <a href="mailto:media@sharjahef.com" className="font-medium text-gray-900 hover:underline">
                  media@sharjahef.com
                </a>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-purple-600" />
                <a href="tel:+97165094000" className="font-medium text-gray-900 hover:underline">
                  +971 6 509 4000
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}