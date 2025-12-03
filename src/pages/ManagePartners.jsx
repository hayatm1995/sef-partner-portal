import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, Plus, Download, Edit, Trash2, Key, Mail, Loader2, 
  AlertCircle, Building2, Users, CheckCircle, 
  FileText, Award, TrendingUp, Bell 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import EditPartnerDialog from "../components/admin/EditPartnerDialog";
import CreatePartnerDialog from "../components/admin/CreatePartnerDialog";
import PartnerExportDialog from "../components/admin/PartnerExportDialog";
import PartnerLoginManager from "../components/admin/PartnerLoginManager";
import SendNotificationDialog from "../components/admin/SendNotificationDialog";

const APP_URL = "https://partners.sharjahef.com";

export default function ManagePartners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [selectedPartnerForLogins, setSelectedPartnerForLogins] = useState(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  
  const queryClient = useQueryClient();

  // Format large numbers with K/M/B abbreviations
  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['allProfiles'],
    queryFn: () => base44.entities.PartnerProfile.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: stands = [] } = useQuery({
    queryKey: ['allStands'],
    queryFn: () => base44.entities.ExhibitorStand.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ['allDeliverables'],
    queryFn: () => base44.entities.Deliverable.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ['allNominations'],
    queryFn: () => base44.entities.Nomination.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const deletePartnerMutation = useMutation({
    mutationFn: async ({ partnerId, profileId }) => {
      if (profileId) {
        await base44.entities.PartnerProfile.delete(profileId);
      }
      await base44.entities.User.delete(partnerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartners'] });
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      setPartnerToDelete(null);
      toast.success('Partner deleted successfully');
    },
  });

  const sendLoginReminderMutation = useMutation({
    mutationFn: async (partner) => {
      const profile = getPartnerProfile(partner.email);
      const response = await base44.functions.invoke('sendHtmlEmail', {
        action: 'loginReminder',
        partner: {
          email: partner.email,
          full_name: partner.full_name,
          company_name: partner.company_name
        },
        profile: profile || {}
      });
      return response;
    },
    onSuccess: (response, partner) => {
      queryClient.invalidateQueries({ queryKey: ['emailInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['activityLogs'] });
      toast.success(`✅ HTML login reminder sent to ${partner.full_name} (${partner.email})`);
    },
    onError: (error) => {
      console.error('Email send error:', error);
      toast.error(`Failed to send email: ${error.message}`);
    }
  });

  const partners = allPartners.filter(p => p.role !== 'admin');
  
  const filteredPartners = partners.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPartnerProfile = (email) => {
    return profiles.find(p => p.partner_email === email);
  };

  const getPartnerStats = (email) => {
    return {
      deliverables: deliverables.filter(d => d.partner_email === email).length,
      nominations: nominations.filter(n => n.partner_email === email).length,
      hasStand: stands.some(s => s.partner_email === email),
      profile: getPartnerProfile(email)
    };
  };

  const handleDeletePartner = () => {
    if (partnerToDelete) {
      const profile = getPartnerProfile(partnerToDelete.email);
      deletePartnerMutation.mutate({
        partnerId: partnerToDelete.id,
        profileId: profile?.id
      });
    }
  };

  if (user?.role !== 'admin' && !user?.is_super_admin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Admin access required</p>
      </div>
    );
  }

  const totalPartners = partners.length;
  const partnersWithProfiles = partners.filter(p => getPartnerProfile(p.email)).length;
  const totalDeliverables = deliverables.length;
  const totalNominations = nominations.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1800px] mx-auto p-4 md:p-8"
      >
        {/* Enhanced Header with Glassmorphism */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full blur-2xl translate-y-48 -translate-x-48" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/40 group-hover:scale-110 transition-transform">
                  <Users className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">Partner Command Center</h1>
                <p className="text-emerald-50 text-lg font-medium">Full control & engagement hub for SEF 2026</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowNotificationDialog(true)}
                variant="outline"
                className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 gap-2 shadow-xl transition-all hover:scale-105 hover:shadow-2xl font-medium"
              >
                <Bell className="w-4 h-4" />
                Send Notification
              </Button>
              <Button
                onClick={() => setShowExport(true)}
                variant="outline"
                className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25 gap-2 shadow-xl transition-all hover:scale-105 hover:shadow-2xl font-medium"
              >
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-white text-emerald-600 hover:bg-emerald-50 gap-2 shadow-2xl font-bold transition-all hover:scale-105 hover:shadow-3xl border-2 border-white/50"
              >
                <Plus className="w-5 h-5" />
                Create Partner
              </Button>
            </div>
          </div>
        </div>

        {/* Critical Warning Banner */}
        <Card className="mb-8 border-4 border-red-400 bg-gradient-to-r from-red-50 to-orange-50 shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-red-900 mb-4 flex items-center gap-2">
                  <span className="text-3xl">⚠️</span> CRITICAL: How to Add Partners Correctly
                </h3>
                
                <div className="bg-white border-2 border-red-300 rounded-lg p-4 mb-4">
                  <p className="font-bold text-red-900 mb-2 text-lg">🚫 DO NOT USE Backend Dashboard to Create Users!</p>
                  <p className="text-red-800 mb-3">
                    Creating users through <strong>Dashboard → Data → User → Create/Invite</strong> will send <strong className="underline">WRONG emails with WRONG URLs</strong> from Base44's system.
                  </p>
                </div>

                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
                  <p className="font-bold text-green-900 mb-3 text-lg">✅ CORRECT Way to Add Partners:</p>
                  <ol className="list-decimal list-inside space-y-2 text-green-900">
                    <li className="font-semibold">First: Create user in Backend WITHOUT sending invitation
                      <ul className="list-disc list-inside ml-6 mt-1 space-y-1 font-normal text-sm">
                        <li>Go to: Dashboard → Data → User → Create</li>
                        <li>Fill in email, name, company</li>
                        <li>Set role to "user" (NOT admin)</li>
                        <li><strong className="text-red-700 underline">DO NOT check "Send Invitation"</strong></li>
                        <li>Click Save</li>
                      </ul>
                    </li>
                    <li className="font-semibold">Then: Click "Create Partner" button on THIS page
                      <ul className="list-disc list-inside ml-6 mt-1 space-y-1 font-normal text-sm">
                        <li>Enter the partner's email</li>
                        <li>Fill in company details and account manager info</li>
                        <li>Click "Send Custom Invitation Email"</li>
                        <li><strong className="text-green-700">This sends OUR beautifully formatted HTML email with CORRECT URL!</strong></li>
                      </ul>
                    </li>
                  </ol>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>✉️ Result:</strong> Partner receives a professionally formatted HTML email from "SEF Team" 
                    with correct portal URL (<strong className="font-mono">{APP_URL}</strong>), 
                    company name, account manager details, and clear login instructions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Cards with Hover Effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }}
            whileHover={{ y: -8 }}
          >
            <Card className="relative border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-blue-100 font-semibold mb-3 uppercase tracking-wider">Total Partners</p>
                    <p className="text-5xl font-black text-white mb-1">{totalPartners}</p>
                    <p className="text-xs text-blue-100 font-medium">Registered organizations</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.2 }}
            whileHover={{ y: -8 }}
          >
            <Card className="relative border-0 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-green-100 font-semibold mb-3 uppercase tracking-wider">Active Profiles</p>
                    <p className="text-5xl font-black text-white mb-1">{partnersWithProfiles}</p>
                    <p className="text-xs text-green-100 font-medium">{Math.round((partnersWithProfiles/totalPartners)*100)}% completion rate</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.3 }}
            whileHover={{ y: -8 }}
          >
            <Card className="relative border-0 bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-orange-100 font-semibold mb-3 uppercase tracking-wider">Deliverables</p>
                    <p className="text-5xl font-black text-white mb-1">{formatNumber(totalDeliverables)}</p>
                    <p className="text-xs text-orange-100 font-medium">Files uploaded & tracked</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8 }}
          >
            <Card className="relative border-0 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden group">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-purple-100 font-semibold mb-3 uppercase tracking-wider">Nominations</p>
                    <p className="text-5xl font-black text-white mb-1">{formatNumber(totalNominations)}</p>
                    <p className="text-xs text-purple-100 font-medium">Submissions received</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Enhanced Search Bar with Glassmorphism */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="mb-8 border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-r from-white via-emerald-50/50 to-teal-50/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-emerald-600 w-6 h-6 z-10 transition-transform group-hover:scale-110" />
                <Input
                  placeholder="🔍 Search partners by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-6 h-14 text-lg border-2 border-emerald-200/50 focus:border-emerald-500 rounded-2xl bg-white/80 backdrop-blur-sm shadow-inner font-medium placeholder:text-gray-400 transition-all"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Partners Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b-2 border-emerald-200/50 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Partner Directory</CardTitle>
                </div>
                <Badge variant="outline" className="text-lg px-6 py-2.5 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-2 border-emerald-300 font-bold shadow-md">
                  {filteredPartners.length} {filteredPartners.length === 1 ? 'Partner' : 'Partners'}
                </Badge>
              </div>
            </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-emerald-50/30 hover:bg-gradient-to-r border-b-2 border-emerald-100">
                    <TableHead className="font-bold text-gray-800 text-sm uppercase tracking-wide">Partner</TableHead>
                    <TableHead className="font-bold text-gray-800 text-sm uppercase tracking-wide">Company</TableHead>
                    <TableHead className="font-bold text-gray-800 text-sm uppercase tracking-wide">Email</TableHead>
                    <TableHead className="font-bold text-gray-800 text-sm uppercase tracking-wide">Profile</TableHead>
                    <TableHead className="font-bold text-gray-800 text-sm uppercase tracking-wide">Stats</TableHead>
                    <TableHead className="font-bold text-gray-800 text-sm uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => {
                    const profile = getPartnerProfile(partner.email);
                    const stats = getPartnerStats(partner.email);
                    
                    return (
                      <TableRow key={partner.id} className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all border-b border-gray-100 group">
                        <TableCell className="font-bold text-gray-900 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform">
                              {partner.full_name?.charAt(0) || '?'}
                            </div>
                            <span className="group-hover:text-emerald-700 transition-colors">{partner.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700 font-medium">{partner.company_name || '-'}</TableCell>
                        <TableCell className="text-gray-600 font-mono text-sm">{partner.email}</TableCell>
                        <TableCell>
                          {profile ? (
                            <div className="space-y-2">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 font-semibold">
                                ✓ Complete
                              </Badge>
                              {profile.package_tier && (
                                <p className="text-xs text-gray-600 font-medium">📦 {profile.package_tier}</p>
                              )}
                              {profile.account_manager_name && (
                                <p className="text-xs text-gray-500">👤 {profile.account_manager_name}</p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 font-semibold">
                              ⚠ Incomplete
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {stats.deliverables > 0 && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                <FileText className="w-3 h-3 mr-1" />
                                {stats.deliverables}
                              </Badge>
                            )}
                            {stats.nominations > 0 && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <Award className="w-3 h-3 mr-1" />
                                {stats.nominations}
                              </Badge>
                            )}
                            {stats.hasStand && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                <Building2 className="w-3 h-3 mr-1" />
                                Stand
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendLoginReminderMutation.mutate(partner)}
                              disabled={sendLoginReminderMutation.isPending}
                              title="Send login reminder"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 transition-all hover:scale-110 shadow-sm hover:shadow-md"
                            >
                              {sendLoginReminderMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Mail className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPartnerForLogins(partner)}
                              title="Manage login emails"
                              className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all hover:scale-110 shadow-sm hover:shadow-md"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPartner({ partner, profile })}
                              title="Edit partner"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 transition-all hover:scale-110 shadow-sm hover:shadow-md"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPartnerToDelete(partner)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all hover:scale-110 shadow-sm hover:shadow-md"
                              title="Delete partner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>

      {showCreateDialog && (
        <CreatePartnerDialog
          onClose={() => setShowCreateDialog(false)}
        />
      )}

      {selectedPartner && (
        <EditPartnerDialog
          partner={selectedPartner.partner}
          profile={selectedPartner.profile}
          onClose={() => setSelectedPartner(null)}
        />
      )}

      {showExport && (
        <PartnerExportDialog
          partners={filteredPartners}
          profiles={profiles}
          onClose={() => setShowExport(false)}
        />
      )}

      {selectedPartnerForLogins && (
        <PartnerLoginManager
          partnerEmail={selectedPartnerForLogins.email}
          partnerName={selectedPartnerForLogins.company_name || selectedPartnerForLogins.full_name}
          onClose={() => setSelectedPartnerForLogins(null)}
        />
      )}

      {showNotificationDialog && (
        <SendNotificationDialog
          onClose={() => setShowNotificationDialog(false)}
        />
      )}

      <AlertDialog open={!!partnerToDelete} onOpenChange={() => setPartnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the partner account for{" "}
              <span className="font-semibold">{partnerToDelete?.full_name}</span> ({partnerToDelete?.email}) 
              and remove all their data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Partner profile and settings</li>
                <li>All deliverables and nominations</li>
                <li>Calendar bookings and reminders</li>
                <li>All associated data</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePartner}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePartnerMutation.isPending}
            >
              {deletePartnerMutation.isPending ? "Deleting..." : "Delete Partner"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}