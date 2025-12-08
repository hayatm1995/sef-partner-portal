import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  partnersService, 
  deliverablesService, 
  nominationsService,
  partnerUsersService
} from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Award,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Users,
  Briefcase,
  Trophy,
  Star,
  Gift,
  User,
  Building
} from "lucide-react";

import AdminDeliverables from "../components/admin/AdminDeliverables";
import AdminNominations from "../components/admin/AdminNominations";
import AdminNotifications from "../components/admin/AdminNotifications";
import VIPInvitationStatusManager from "../components/admin/VIPInvitationStatusManager";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const queryClient = useQueryClient();
  const { role, user } = useAuth();
  const isAdmin = role === 'admin' || role === 'superadmin';

  const { partnerId } = useAuth();

  // Get all partner users for name mapping (role-based filtering)
  const { data: allPartnerUsers = [] } = useQuery({
    queryKey: ['allPartnerUsers', role, partnerId],
    queryFn: async () => {
      try {
        const result = await partnerUsersService.getAll({
          role: role || undefined,
          currentUserAuthId: user?.id || undefined,
        });
        return result || [];
      } catch (error) {
        console.error('Error fetching partner users:', error);
        return [];
      }
    },
    enabled: isAdmin,
    retry: 1,
  });

  // Get all partners for company name mapping (role-based filtering)
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners', role, partnerId],
    queryFn: async () => {
      try {
        const result = await partnersService.getAll({
          role: role || undefined,
          currentUserAuthId: user?.id || undefined,
        });
        return result || [];
      } catch (error) {
        console.error('Error fetching partners:', error);
        return [];
      }
    },
    enabled: isAdmin,
    retry: 1,
  });

  const getPartnerName = (email) => {
    const user = allPartnerUsers.find(p => p.email === email);
    return user?.full_name || email;
  };

  const getPartnerCompany = (email) => {
    const user = allPartnerUsers.find(p => p.email === email);
    if (user?.partner_id) {
      const partner = allPartners.find(p => p.id === user.partner_id);
      return partner?.name || '';
    }
    return '';
  };

  const { data: deliverables = [] } = useQuery({
    queryKey: ['allDeliverables', role, partnerId],
    queryFn: async () => {
      try {
        const result = await deliverablesService.getAll({
          role: role || undefined,
          currentUserAuthId: user?.id || undefined,
        });
        return result || [];
      } catch (error) {
        console.error('Error fetching deliverables:', error);
        return [];
      }
    },
    enabled: isAdmin,
    retry: 1,
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ['allNominations', role, partnerId],
    queryFn: async () => {
      try {
        const result = await nominationsService.getAll({
          role: role || undefined,
          currentUserAuthId: user?.id || undefined,
        });
        return result || [];
      } catch (error) {
        console.error('Error fetching nominations:', error);
        return [];
      }
    },
    enabled: isAdmin,
    retry: 1,
  });

  // TODO: These entities need to be migrated to Supabase
  // For now, return empty arrays
  const { data: mediaFiles = [] } = useQuery({
    queryKey: ['allMediaBranding'],
    queryFn: async () => {
      console.warn('MediaBranding migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const { data: workshops = [] } = useQuery({
    queryKey: ['allWorkshops'],
    queryFn: async () => {
      console.warn('WorkshopNomination migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const { data: speakers = [] } = useQuery({
    queryKey: ['allSpeakers'],
    queryFn: async () => {
      console.warn('SpeakerNomination migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const { data: startups = [] } = useQuery({
    queryKey: ['allStartups'],
    queryFn: async () => {
      console.warn('StartupNomination migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const { data: awards = [] } = useQuery({
    queryKey: ['allAwards'],
    queryFn: async () => {
      console.warn('RecognitionAward migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const { data: vipInvitations = [] } = useQuery({
    queryKey: ['allVIPInvitations'],
    queryFn: async () => {
      console.warn('VIPInvitation migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const { data: badgeRegistrations = [] } = useQuery({
    queryKey: ['allBadgeRegistrations'],
    queryFn: async () => {
      console.warn('BadgeRegistration migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const { data: boothActivations = [] } = useQuery({
    queryKey: ['allBoothActivations'],
    queryFn: async () => {
      console.warn('BoothActivation migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ['allTestimonials'],
    queryFn: async () => {
      console.warn('Testimonial migration to Supabase pending');
      return [];
    },
    enabled: isAdmin,
  });

  const updateDeliverableMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await deliverablesService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDeliverables'] });
    },
  });

  const updateNominationMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await nominationsService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNominations'] });
    },
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access this page.</p>
      </div>
    );
  }

  const pendingDeliverables = deliverables.filter(d => d.status === 'Pending Review' || d.status === 'pending_review').length;
  const pendingNominations = nominations.filter(n => n.status === 'Submitted' || n.status === 'submitted' || n.status === 'Under Review' || n.status === 'under_review').length;
  const pendingWorkshops = workshops.filter(w => w.status === 'submitted').length;
  const pendingSpeakers = speakers.filter(s => s.status === 'submitted').length;

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-purple-100 text-purple-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      pending_review: "bg-yellow-100 text-yellow-800",
      rejected: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32 animate-pulse" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-400/20 rounded-full blur-2xl translate-y-48 -translate-x-48" />
          
          <div className="relative flex items-center gap-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/40">
                <CheckCircle className="w-10 h-10 text-white drop-shadow-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">Content Review Panel</h1>
              <p className="text-indigo-50 text-lg font-medium">Manage all partner submissions & approvals</p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            <Card className="relative border-0 bg-gradient-to-br from-blue-500 to-cyan-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-blue-100 font-semibold mb-2 uppercase tracking-wider">Total Deliverables</p>
                    <p className="text-5xl font-black text-white mb-1">{deliverables.length}</p>
                    <p className="text-xs text-blue-100 font-medium">Files uploaded</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-amber-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            <Card className="relative border-0 bg-gradient-to-br from-orange-500 to-amber-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-orange-100 font-semibold mb-2 uppercase tracking-wider">Pending Review</p>
                    <p className="text-5xl font-black text-white mb-1">{pendingDeliverables}</p>
                    <p className="text-xs text-orange-100 font-medium">Awaiting approval</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            <Card className="relative border-0 bg-gradient-to-br from-purple-500 to-pink-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-purple-100 font-semibold mb-2 uppercase tracking-wider">Nominations</p>
                    <p className="text-5xl font-black text-white mb-1">{nominations.length}</p>
                    <p className="text-xs text-purple-100 font-medium">Total submissions</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />
            <Card className="relative border-0 bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl hover:shadow-3xl transition-all rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-grid-white/5" />
              <CardContent className="p-7 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-green-100 font-semibold mb-2 uppercase tracking-wider">Media Files</p>
                    <p className="text-5xl font-black text-white mb-1">{mediaFiles.length}</p>
                    <p className="text-xs text-green-100 font-medium">Brand assets</p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Card className="mb-6 border-0 shadow-2xl rounded-3xl overflow-hidden bg-white/80 backdrop-blur-sm">
          <CardContent className="p-2">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 bg-transparent">
              <TabsTrigger value="deliverables" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <FileText className="w-4 h-4" />
                <span className="hidden md:inline">Deliverables</span>
              </TabsTrigger>
              <TabsTrigger value="nominations" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <Award className="w-4 h-4" />
                <span className="hidden md:inline">Nominations</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <ImageIcon className="w-4 h-4" />
                <span className="hidden md:inline">Media</span>
              </TabsTrigger>
              <TabsTrigger value="workshops" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <Briefcase className="w-4 h-4" />
                <span className="hidden lg:inline">Workshops</span>
                <Badge variant="secondary" className="ml-1 text-xs">{workshops.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="speakers" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline">Speakers</span>
                <Badge variant="secondary" className="ml-1 text-xs">{speakers.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="more" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                <Trophy className="w-4 h-4" />
                <span className="hidden md:inline">More</span>
              </TabsTrigger>
            </TabsList>
          </CardContent>
        </Card>

        <TabsContent value="deliverables">
          <AdminDeliverables
            deliverables={deliverables}
            onUpdate={(id, data) => updateDeliverableMutation.mutate({ id, data })}
          />
        </TabsContent>

        <TabsContent value="nominations">
          <AdminNominations
            nominations={nominations}
            onUpdate={(id, data) => updateNominationMutation.mutate({ id, data })}
          />
        </TabsContent>

        <TabsContent value="media">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-emerald-100 p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Media & Branding Files</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">All partner media uploads</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {mediaFiles.length > 0 ? (
                <div className="space-y-4">
                  {mediaFiles.map((file) => (
                    <Card key={file.id} className="border-orange-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <ImageIcon className="w-5 h-5 text-orange-600" />
                              <h4 className="font-semibold">{file.file_name}</h4>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Partner:</span>{' '}
                                <span className="text-blue-600">{getPartnerName(file.partner_email)}</span>
                                {getPartnerCompany(file.partner_email) && (
                                  <span className="text-gray-500 ml-2">({getPartnerCompany(file.partner_email)})</span>
                                )}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Email:</span>{' '}
                                <span className="text-gray-600">{file.partner_email}</span>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Type:</span>{' '}
                                <Badge variant="outline" className="ml-1">{file.file_type.replace(/_/g, ' ')}</Badge>
                              </p>
                              {file.description && (
                                <p className="text-sm text-gray-600 mt-2">{file.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            View File
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center py-12 text-gray-500">No media files uploaded yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workshops">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b-2 border-indigo-100 p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Workshop Submissions</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">All partner workshop nominations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {workshops.length > 0 ? (
                <div className="space-y-4">
                  {workshops.map((workshop) => (
                    <Card key={workshop.id} className="border-blue-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{workshop.workshop_title}</h4>
                              <Badge className={getStatusColor(workshop.status)}>
                                {workshop.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <div className="space-y-1 mb-3">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Partner:</span>{' '}
                                <span className="text-blue-600">{getPartnerName(workshop.partner_email)}</span>
                                {getPartnerCompany(workshop.partner_email) && (
                                  <span className="text-gray-500 ml-2">({getPartnerCompany(workshop.partner_email)})</span>
                                )}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Email:</span>{' '}
                                <span className="text-gray-600">{workshop.partner_email}</span>
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Instructor:</span> {workshop.instructor_name}
                              </p>
                              <p className="text-sm text-gray-600">{workshop.description}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center py-12 text-gray-500">No workshops submitted yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speakers">
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b-2 border-violet-100 p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Speaker Nominations</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">All partner speaker nominations</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {speakers.length > 0 ? (
                <div className="space-y-4">
                  {speakers.map((speaker) => (
                    <Card key={speaker.id} className="border-purple-100">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{speaker.speaker_name}</h4>
                              <Badge className={getStatusColor(speaker.status)}>
                                {speaker.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Nominated by:</span>{' '}
                                <span className="text-blue-600">{getPartnerName(speaker.partner_email)}</span>
                                {getPartnerCompany(speaker.partner_email) && (
                                  <span className="text-gray-500 ml-2">({getPartnerCompany(speaker.partner_email)})</span>
                                )}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium text-gray-700">Partner Email:</span>{' '}
                                <span className="text-gray-600">{speaker.partner_email}</span>
                              </p>
                              {speaker.speaker_title && (
                                <p className="text-sm text-gray-600">{speaker.speaker_title}</p>
                              )}
                              {speaker.speaker_company && (
                                <p className="text-sm text-gray-600">{speaker.speaker_company}</p>
                              )}
                              <p className="text-sm text-blue-600">{speaker.speaker_email}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center py-12 text-gray-500">No speakers nominated yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="more">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Startups */}
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xl">Startup Nominations</span>
                    <Badge variant="secondary" className="ml-2">{startups.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {startups.map((startup) => (
                  <div key={startup.id} className="mb-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{startup.startup_name}</h4>
                      <Badge className={getStatusColor(startup.status)}>{startup.status}</Badge>
                    </div>
                    <p className="text-sm text-blue-600 mb-1">{getPartnerName(startup.partner_email)}</p>
                    <p className="text-xs text-gray-500">{startup.partner_email}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Badge Registrations */}
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b border-cyan-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xl">Badge Registrations</span>
                    <Badge variant="secondary" className="ml-2">{badgeRegistrations.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {badgeRegistrations.map((badge) => (
                  <div key={badge.id} className="mb-4 p-3 border rounded-lg">
                    <h4 className="font-semibold">{badge.attendee_name}</h4>
                    <p className="text-sm text-gray-600">{badge.attendee_email}</p>
                    <p className="text-sm text-blue-600 mt-1">{getPartnerName(badge.partner_email)}</p>
                    <p className="text-xs text-gray-500">{badge.partner_email}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* VIP Invitations */}
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xl">VIP Invitations</span>
                    <Badge variant="secondary" className="ml-2">{vipInvitations.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vipInvitations.map((vip) => (
                  <div key={vip.id} className="mb-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">{vip.event_type.replace(/_/g, ' ')}</h4>
                      <Badge>{vip.invite_count} invites</Badge>
                    </div>
                    <p className="text-sm text-blue-600">{getPartnerName(vip.partner_email)}</p>
                    <p className="text-xs text-gray-500 mb-3">{vip.partner_email}</p>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs text-gray-500">Update Status:</span>
                      <VIPInvitationStatusManager invitation={vip} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Booth Activations */}
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xl">Booth Activations</span>
                    <Badge variant="secondary" className="ml-2">{boothActivations.length}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {boothActivations.map((booth) => (
                  <div key={booth.id} className="mb-4 p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{booth.activation_title}</h4>
                      <Badge className={getStatusColor(booth.status)}>{booth.status}</Badge>
                    </div>
                    <p className="text-sm text-blue-600">{getPartnerName(booth.partner_email)}</p>
                    <p className="text-xs text-gray-500">{booth.partner_email}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}