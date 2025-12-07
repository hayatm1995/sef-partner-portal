import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contractsService } from "@/services/supabaseService";
import { partnerFeaturesService } from "@/services/partnerFeaturesService";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { Download, Upload, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import {
  User,
  Users,
  Image as ImageIcon,
  Megaphone,
  Briefcase,
  Award,
  Ticket,
  Package,
  IdCard,
  UserPlus,
  Building2,
  Rocket,
  Star,
  Trophy,
  Shield,
  Scale,
  Monitor,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";

import ProfileSection from "../components/partnerhub/ProfileSection";
import ContactPointsSection from "../components/partnerhub/ContactPointsSection";
import MediaBrandingSection from "../components/partnerhub/MediaBrandingSection";
import PRMarketingTestimonialSection from "../components/partnerhub/PRMarketingTestimonialSection";
import WorkshopsSection from "../components/partnerhub/WorkshopsSection";
import StartupsSection from "../components/partnerhub/StartupsSection";
import RecognitionSection from "../components/partnerhub/RecognitionSection";
import VIPInvitationsSection from "../components/partnerhub/VIPInvitationsSection";

import BadgeRegistrationSection from "../components/partnerhub/BadgeRegistrationSection";
import VIPBoxTrackerSection from "../components/partnerhub/VIPBoxTrackerSection";
import TeamMembersManager from "../components/partnerhub/TeamMembersManager";
import AwardsSection from "../components/partnerhub/AwardsSection";
import SpeakersSection from "../components/partnerhub/SpeakersSection";
import PitchJudgeSection from "../components/partnerhub/PitchJudgeSection";
import SEFFYJudgeSection from "../components/partnerhub/SEFFYJudgeSection";
import DigitalDisplaySection from "../components/partnerhub/DigitalDisplaySection";
import DeliverablesSection from "../components/partnerhub/DeliverablesSection";
import BoothDashboard from "../components/partner/BoothDashboard";
import PartnerHubHomepage from "../components/partnerhub/PartnerHubHomepage";

export default function PartnerHub() {
  const [activeTab, setActiveTab] = useState("home");
  const location = useLocation();
  const { user, partner, role, partnerId, loading: authLoading } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const viewAsPartnerId = urlParams.get('viewAs');
  
  // Fetch partner_id from partner_users table if not already available
  const { data: partnerUserData, isLoading: loadingPartnerUser } = useQuery({
    queryKey: ['partnerUser', user?.id, user?.email],
    queryFn: async () => {
      if (!user?.id && !user?.email) return null;
      
      try {
        const { partnerUsersService } = await import('@/services/supabaseService');
        
        // Try by auth_user_id first
        if (user?.id) {
          const { data, error } = await supabase
            .from('partner_users')
            .select('*, partners(*)')
            .eq('auth_user_id', user.id)
            .single();
          
          if (!error && data) {
            console.log('[PartnerHub] Found partner_user by auth_user_id:', data);
            return data;
          }
        }
        
        // Fallback to email
        if (user?.email) {
          const data = await partnerUsersService.getByEmail(user.email);
          if (data) {
            console.log('[PartnerHub] Found partner_user by email:', data);
            return data;
          }
        }
        
        console.log('[PartnerHub] No partner_user found for user:', { id: user?.id, email: user?.email });
        return null;
      } catch (error) {
        console.error('[PartnerHub] Error fetching partner_user:', error);
        return null;
      }
    },
    enabled: !!user && (!!user.id || !!user.email) && !viewAsPartnerId && role === 'partner',
    retry: 1,
  });

  // Determine current partner ID
  const resolvedPartnerId = viewAsPartnerId || partnerId || partnerUserData?.partner_id || partner?.id;
  const currentPartnerId = resolvedPartnerId;
  
  // For VIP section, we'll pass partner email from user context
  const effectivePartnerEmail = user?.email || partnerUserData?.email || '';
  const isAdminGlobalView = (role === 'admin' || role === 'superadmin') && !viewAsPartnerId;

  // Show loading state while fetching partner data
  const isLoading = authLoading || (role === 'partner' && !currentPartnerId && loadingPartnerUser);

  // Fetch partner data for allocations
  const { data: currentPartner, isLoading: loadingPartner } = useQuery({
    queryKey: ['partner', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return null;
      try {
        const { partnersService } = await import('@/services/supabaseService');
        const partnerData = await partnersService.getById(currentPartnerId);
        console.log('[PartnerHub] Fetched partner data:', partnerData);
        return partnerData;
      } catch (error) {
        console.error('[PartnerHub] Error fetching partner:', error);
        return partner || partnerUserData?.partners || null;
      }
    },
    enabled: !!currentPartnerId && !isAdminGlobalView,
    initialData: partner || partnerUserData?.partners || null,
  });

  // Show loading state
  if (isLoading || loadingPartner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Partner Hub...</p>
        </div>
      </div>
    );
  }

  // Show error if partner not found (for actual partners, not admins)
  if (role === 'partner' && !currentPartnerId && !isAdminGlobalView) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
        <div className="max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Partner Profile Not Found</h3>
            <p className="text-red-600 mb-4">
              Your account is not associated with a partner profile. Please contact your administrator.
            </p>
            <p className="text-sm text-red-500">Email: {user?.email}</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'sef_admin' || user?.is_super_admin;
  
  // Fetch enabled features for current partner
  const { data: enabledFeatures = [] } = useQuery({
    queryKey: ['partnerFeatures', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return [];
      return await partnerFeaturesService.getEnabledFeatures(currentPartnerId);
    },
    enabled: !!currentPartnerId && !isAdmin, // Only fetch for partners, admins see all
  });
  
  // Map section IDs to feature names (matching partner_features.feature values)
  const sectionToFeatureMap = {
    'profile': 'company_profile',
    'contacts': 'contacts',
    'media': 'media_assets',
    'pr': 'sef_schedule', // PR/Marketing section maps to SEF Schedule
    'deliverables': 'deliverables',
    'nominations': 'nominations',
    'booth': 'booth_options',
    'vip': 'vip_guest_list',
    'payments': 'payments',
    'legal': 'legal_branding',
    'speakers': 'speaker_requests',
  };
  
  // Fetch booth for current partner to check if they have one
  const { data: partnerBooth } = useQuery({
    queryKey: ['partnerBoothForHub', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return null;
      try {
        const { exhibitorStandsService } = await import('@/services/supabaseService');
        const stands = await exhibitorStandsService.getAll(currentPartnerId);
        return stands.length > 0 ? stands[0] : null;
      } catch (error) {
        console.error('Error fetching booth:', error);
        return null;
      }
    },
    enabled: !!currentPartnerId && !isAdminGlobalView,
  });

  const hasSection = (section) => {
    // Home section is always visible
    if (section === 'home') return true;
    
    // Admins always see all sections (when not viewing as partner)
    if (isAdmin && !viewAsPartnerId) return true;
    
    // Special handling for booth - only show if partner has a booth assigned
    if (section === 'booth') {
      return !!partnerBooth;
    }
    
    // Special handling for pitch_judge and seffy_judge based on partner flags
    if (section === 'pitch_judge') {
      return currentPartner?.show_pitch_competition === true;
    }
    if (section === 'seffy_judge') {
      return currentPartner?.show_seffy_awards === true;
    }
    
    // Check if section is mapped to a feature
    const featureName = sectionToFeatureMap[section];
    if (featureName) {
      // If no features loaded yet, default to showing (backward compatibility)
      if (!currentPartnerId || enabledFeatures.length === 0) {
        return true;
      }
      // If feature is enabled, show section
      return enabledFeatures.includes(featureName);
    }
    
    // For sections not in the feature map, default to visible (backward compatibility)
    return true;
  };

  // Calculate progress based on enabled features
  const calculateProgress = () => {
    if (isAdmin && !viewAsPartnerId) return null; // Don't show progress for admin view
    
    if (!currentPartnerId || enabledFeatures.length === 0) return null;
    
    // Count enabled features vs total features
    const totalFeatures = Object.keys(sectionToFeatureMap).length;
    const enabledCount = enabledFeatures.filter(f => Object.values(sectionToFeatureMap).includes(f)).length;
    
    return totalFeatures > 0 ? Math.round((enabledCount / totalFeatures) * 100) : 0;
  };

  const progressPercentage = calculateProgress();

  const allTabs = [
    { 
      id: "home", 
      label: "Home", 
      icon: LayoutDashboard, 
      section: "home",
      gradient: "from-orange-500 to-amber-600"
    },
    { 
      id: "profile", 
      label: "Profile", 
      icon: User, 
      section: "profile",
      gradient: "from-blue-500 to-cyan-600"
    },
    { 
      id: "team", 
      label: "Team", 
      icon: UserPlus, 
      section: "team",
      gradient: "from-purple-500 to-pink-600"
    },
    { 
      id: "contacts", 
      label: "Contacts", 
      icon: Users, 
      section: "contacts",
      gradient: "from-green-500 to-emerald-600"
    },
    { 
      id: "media", 
      label: "Media", 
      icon: ImageIcon, 
      section: "media",
      gradient: "from-orange-500 to-amber-600"
    },
    { 
      id: "pr", 
      label: "PR", 
      icon: Megaphone, 
      section: "pr",
      gradient: "from-red-500 to-rose-600"
    },
    { 
      id: "workshops", 
      label: "Workshops", 
      icon: Briefcase, 
      section: "workshops",
      gradient: "from-indigo-500 to-blue-600"
    },
    { 
      id: "speakers", 
      label: "Speakers", 
      icon: Users, 
      section: "speakers",
      gradient: "from-violet-500 to-purple-600"
    },
    { 
      id: "startups", 
      label: "Startups", 
      icon: Rocket, 
      section: "startups",
      gradient: "from-orange-500 to-amber-600"
    },
    { 
      id: "awards", 
      label: "Award Presenter", 
      icon: Trophy, 
      section: "awards",
      gradient: "from-yellow-500 to-orange-600"
    },
    { 
      id: "pitch_judge", 
      label: "Pitch Judge", 
      icon: Scale, 
      section: "pitch_judge",
      gradient: "from-indigo-500 to-purple-600"
    },
    { 
      id: "seffy_judge", 
      label: "SEFFY Judge", 
      icon: Award, 
      section: "seffy_judge",
      gradient: "from-indigo-600 to-violet-700"
    },
    { 
      id: "recognition", 
      label: "Recognition", 
      icon: Star, 
      section: "recognition",
      gradient: "from-pink-500 to-rose-600"
    },
    { 
      id: "vip", 
      label: "BELONG+", 
      icon: Ticket, 
      section: "vip",
      gradient: "from-amber-500 to-yellow-600"
    },

    { 
      id: "badges", 
      label: "Badges", 
      icon: IdCard, 
      section: "badges",
      gradient: "from-blue-500 to-indigo-600"
    },
    { 
      id: "vipbox", 
      label: "VIP Box", 
      icon: Package, 
      section: "vipbox",
      gradient: "from-amber-500 to-yellow-600"
    },
    { 
      id: "digital_displays", 
      label: "Digital Displays", 
      icon: Monitor, 
      section: "digital_displays",
      gradient: "from-cyan-500 to-blue-600"
    },
    { 
      id: "deliverables", 
      label: "Deliverables", 
      icon: FileText, 
      section: "deliverables",
      gradient: "from-orange-500 to-amber-600"
    },
    { 
      id: "booth", 
      label: "Booth", 
      icon: Building2, 
      section: "booth",
      gradient: "from-purple-500 to-indigo-600"
    },
    { 
      id: "contracts", 
      label: "Contracts", 
      icon: Scale, 
      section: "contracts",
      gradient: "from-indigo-500 to-blue-600"
    },
  ];

  const tabs = allTabs.filter(tab => hasSection(tab.section));

  React.useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      <div className="relative bg-gradient-to-br from-orange-600 via-orange-500 to-amber-600 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative max-w-[1800px] mx-auto px-4 md:px-8 py-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/20">
                <Building2 className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-3 tracking-tight">
                  Partner Hub
                </h1>
                <p className="text-orange-100 text-xl font-medium">
                  {isAdminGlobalView ? 'All Partners - Admin View' : 'SEF 2026 Partnership Portal'}
                </p>
              </div>
            </div>

            {!isAdminGlobalView && user?.company_name && (
              <Card className="border-2 border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-orange-100 font-semibold uppercase tracking-wider mb-2">
                        {viewAsPartnerId ? 'Viewing As' : 'Your Company'}
                      </p>
                      <p className="font-bold text-2xl text-white">{user.company_name}</p>
                      {progressPercentage !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-orange-100">Portal Access</span>
                            <span className="text-xs font-semibold text-white">{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div 
                              className="bg-white rounded-full h-2 transition-all duration-300"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {currentPartner?.tier && (
                      <Badge className="bg-white text-orange-600 px-5 py-2 text-base font-bold shadow-lg">
                        {currentPartner.tier}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {isAdminGlobalView && (
              <Card className="border-2 border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-orange-100 font-semibold uppercase tracking-wider mb-1">Admin Mode</p>
                      <p className="font-bold text-xl text-white">Viewing All Partners</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2 border-orange-100/50 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-orange-50/30 px-6 py-4">
                <TabsList className="inline-flex flex-wrap gap-2 bg-transparent h-auto">
                  {tabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`
                        relative px-6 py-3 rounded-xl font-semibold transition-all duration-300
                        data-[state=active]:shadow-lg
                        ${activeTab === tab.id
                          ? `bg-gradient-to-r ${tab.gradient} text-white scale-105`
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-600'}`} />
                        <span>{tab.label}</span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {activeTabData && (
                !hasSection(activeTabData.section) && !isAdmin ? (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-8 text-center">
                      <Shield className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-orange-900 mb-2">Feature Not Available</h3>
                      <p className="text-orange-700">
                        This section is not available for your partner account. Please contact your account manager if you need access.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
                    className="relative overflow-hidden"
                  >
                  <div className={`absolute inset-0 bg-gradient-to-r ${activeTabData.gradient} opacity-90`}></div>
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
                  <div className="relative px-8 py-8">
                    <div className="flex items-center gap-6">
                      <motion.div 
                        className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/30"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <activeTabData.icon className="w-10 h-10 text-white" />
                      </motion.div>
                      <div>
                        <motion.h2 
                          className="text-4xl font-bold text-white mb-2 tracking-tight"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          {activeTabData.label}
                        </motion.h2>
                        <p className="text-white/95 text-lg font-medium">
                          {activeTabData.id === 'home' && 'Welcome to your Partner Hub dashboard'}
                          {activeTabData.id === 'profile' && 'Company information and account details'}
                          {activeTabData.id === 'team' && 'Manage team member access'}
                          {activeTabData.id === 'contacts' && 'Key points of contact'}
                          {activeTabData.id === 'media' && 'Logos, assets and branding materials'}
                          {activeTabData.id === 'pr' && 'PR materials and testimonials'}
                          {activeTabData.id === 'workshops' && 'Workshop proposals and speakers'}
                          {activeTabData.id === 'speakers' && 'Speaker nominations'}
                          {activeTabData.id === 'startups' && 'Showcase innovative startups'}
                          {activeTabData.id === 'awards' && 'Present awards to recipients'}
                          {activeTabData.id === 'pitch_judge' && 'Judge pitch competitions'}
                          {activeTabData.id === 'seffy_judge' && 'Nominate SEFFY Award judges'}
                          {activeTabData.id === 'recognition' && ''}
                          {activeTabData.id === 'vip' && 'BELONG+ exclusive event access'}
                          {activeTabData.id === 'exhibition' && 'Exhibition stand details'}
                          {activeTabData.id === 'badges' && 'Team badge registration'}
                          {activeTabData.id === 'vipbox' && 'VIP box shipping tracker'}
                          {activeTabData.id === 'digital_displays' && 'Manage digital display content'}
                          {activeTabData.id === 'deliverables' && 'Required deliverables and submission status'}
                        </p>
                      </div>
                    </div>
                  </div>
                  </motion.div>
                )
              )}

              <div className="p-8">
                <TabsContent value="home" className="mt-0">
                  <PartnerHubHomepage />
                </TabsContent>
                
                {hasSection("profile") && (
                  <TabsContent value="profile" className="mt-0">
                    {isAdminGlobalView ? (
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="p-8 text-center">
                          <Shield className="w-16 h-16 mx-auto text-yellow-600 mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Admin Global View</h3>
                          <p className="text-gray-600">
                            Use "View as Partner" from the sidebar to see specific partner profiles.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <ProfileSection user={user} profile={currentPartner} isAdmin={isAdmin} />
                    )}
                  </TabsContent>
                )}

                {hasSection("team") && (
                  <TabsContent value="team" className="mt-0">
                    <TeamMembersManager 
                      partnerEmail={effectivePartnerEmail} 
                      partnerName={user?.company_name || user?.full_name}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("contacts") && (
                  <TabsContent value="contacts" className="mt-0">
                    <ContactPointsSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("media") && (
                  <TabsContent value="media" className="mt-0">
                    <MediaBrandingSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("pr") && (
                  <TabsContent value="pr" className="mt-0">
                    <PRMarketingTestimonialSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("workshops") && (
                  <TabsContent value="workshops" className="mt-0">
                    <WorkshopsSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("speakers") && (
                  <TabsContent value="speakers" className="mt-0">
                    <SpeakersSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("startups") && (
                  <TabsContent value="startups" className="mt-0">
                    <StartupsSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("awards") && (
                  <TabsContent value="awards" className="mt-0">
                    <AwardsSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                      profile={currentPartner}
                    />
                  </TabsContent>
                )}

                {hasSection("pitch_judge") && (
                  <TabsContent value="pitch_judge" className="mt-0">
                    <PitchJudgeSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("seffy_judge") && (
                  <TabsContent value="seffy_judge" className="mt-0">
                    <SEFFYJudgeSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("recognition") && (
                  <TabsContent value="recognition" className="mt-0">
                    <RecognitionSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("vip") && (
                  <TabsContent value="vip" className="mt-0">
                    <VIPInvitationsSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}



                {hasSection("badges") && (
                  <TabsContent value="badges" className="mt-0">
                    <BadgeRegistrationSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("vipbox") && (
                  <TabsContent value="vipbox" className="mt-0">
                    <VIPBoxTrackerSection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("digital_displays") && (
                  <TabsContent value="digital_displays" className="mt-0">
                    <DigitalDisplaySection 
                      partnerEmail={effectivePartnerEmail} 
                      isAdmin={isAdmin}
                      showAllPartners={isAdminGlobalView}
                    />
                  </TabsContent>
                )}

                {hasSection("deliverables") && (
                  <TabsContent value="deliverables" className="mt-0">
                    <DeliverablesSection />
                  </TabsContent>
                )}

                {hasSection("booth") && (
                  <TabsContent value="booth" className="mt-0">
                    <BoothDashboard />
                  </TabsContent>
                )}

                {hasSection("contracts") && (
                  <TabsContent value="contracts" className="mt-0">
                    <ContractsHubSection 
                      partnerId={currentPartnerId}
                      isAdmin={isAdmin}
                    />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Contracts Hub Section Component
function ContractsHubSection({ partnerId, isAdmin }) {
  const [selectedContract, setSelectedContract] = React.useState(null);
  const [showUpload, setShowUpload] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', partnerId],
    queryFn: () => contractsService.getByPartnerId(partnerId),
    enabled: !!partnerId,
  });

  const uploadSignedMutation = useMutation({
    mutationFn: async ({ contractId, file }) => {
      const filePath = `contracts/${partnerId}/${contractId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      return contractsService.uploadSigned(contractId, urlData.publicUrl);
    },
    onSuccess: () => {
      toast.success('Signed contract uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['contracts', partnerId] });
      setShowUpload(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to upload signed contract');
    }
  });

  const getStatusBadge = (status) => {
    const configs = {
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
      signed: { color: 'bg-green-100 text-green-800', label: 'Signed' },
      approved: { color: 'bg-purple-100 text-purple-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
    };
    return configs[status] || configs.draft;
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading contracts...</div>;
  }

  return (
    <div className="space-y-6">
      {contracts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Contracts</h3>
            <p className="text-gray-500">You don't have any contracts yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {contracts.map((contract) => {
            const statusConfig = getStatusBadge(contract.status);
            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{contract.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                        <Badge variant="outline">{contract.contract_type || 'Partnership'}</Badge>
                        <span className="text-sm text-gray-500">
                          {format(new Date(contract.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {contract.file_url_original && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(contract.file_url_original, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {contract.status === 'sent' && !contract.file_url_signed && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowUpload(true);
                          }}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Signed
                        </Button>
                      )}
                      {contract.file_url_signed && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(contract.file_url_signed, '_blank')}
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          View Signed
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {contract.notes && (
                  <CardContent>
                    <p className="text-sm text-gray-600">{contract.notes}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showUpload && selectedContract && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Signed Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fileInput = e.target.querySelector('input[type="file"]');
                const file = fileInput?.files?.[0];
                if (file) {
                  uploadSignedMutation.mutate({ contractId: selectedContract.id, file });
                }
              }}
              className="space-y-4"
            >
              <Input type="file" accept=".pdf,.doc,.docx" required />
              <div className="flex gap-2">
                <Button type="submit" disabled={uploadSignedMutation.isPending}>
                  {uploadSignedMutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUpload(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}