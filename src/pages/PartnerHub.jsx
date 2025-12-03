import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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

export default function PartnerHub() {
  const [activeTab, setActiveTab] = useState("profile");
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const urlParams = new URLSearchParams(location.search);
  const viewAsEmail = urlParams.get('viewAs');
  
  const effectivePartnerEmail = viewAsEmail || user?.email;
  const isAdminGlobalView = (user?.role === 'admin' || user?.is_super_admin) && !viewAsEmail;

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', effectivePartnerEmail],
    queryFn: async () => {
      const profiles = await base44.entities.PartnerProfile.filter({ 
        partner_email: effectivePartnerEmail 
      });
      return profiles[0] || null;
    },
    enabled: !!effectivePartnerEmail && !isAdminGlobalView,
  });

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;
  const visibleHubSections = profile?.visible_hub_sections || [];
  
  const hasSection = (section) => {
    if (isAdmin) return true;
    
    // Special handling for pitch_judge and seffy_judge based on profile flags
    if (section === 'pitch_judge') {
      return profile?.show_pitch_competition === true;
    }
    if (section === 'seffy_judge') {
      return profile?.show_seffy_awards === true;
    }
    
    if (!profile || visibleHubSections.length === 0) return true;
    return visibleHubSections.includes(section);
  };

  const allTabs = [
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
                    <div>
                      <p className="text-xs text-orange-100 font-semibold uppercase tracking-wider mb-2">
                        {viewAsEmail ? 'Viewing As' : 'Your Company'}
                      </p>
                      <p className="font-bold text-2xl text-white">{user.company_name}</p>
                    </div>
                    {profile?.package_tier && (
                      <Badge className="bg-white text-orange-600 px-5 py-2 text-base font-bold shadow-lg">
                        {profile.package_tier}
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
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="p-8">
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
                      <ProfileSection user={user} profile={profile} isAdmin={isAdmin} />
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
                      profile={profile}
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
              </div>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}