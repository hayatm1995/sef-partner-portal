
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SplashScreen from "./components/common/SplashScreen";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  FileText,
  Award,
  LogOut,
  Shield,
  Users,
  BarChart3,
  Calendar as CalendarIcon,
  TrendingUp,
  User,
  ChevronDown,
  Package,
  ClipboardList,
  MessageSquare,
  Bell,
  FolderOpen,
  HelpCircle,
  Settings,
  CheckSquare,
  Activity,
  UserCircle,
  Download,
  CreditCard,
  Lightbulb,
  Briefcase,
  Video,
  Globe,
  Share2,
  Target,
  Star,
  Gift,
  Map,
  Phone,
  Mail,
  Building,
  Eye,
  X,
  Key,
  Building2
} from "lucide-react";
import SupportAgentChat from "./components/support/SupportAgentChat";
import GlobalNotificationBell from "./components/notifications/GlobalNotificationBell";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [pageStartTime, setPageStartTime] = useState(Date.now());
  const [showSplash, setShowSplash] = useState(true);
  const [showChat, setShowChat] = useState(false);

  const { data: user, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: loginMapping = [] } = useQuery({
    queryKey: ['loginMapping'],
    queryFn: () => base44.entities.PartnerLogin.list(),
    enabled: !!user && (user.role === 'admin' || user.is_super_admin),
  });

  const effectivePartnerEmail = (() => {
    const urlParams = new URLSearchParams(location.search);
    const viewAsParam = urlParams.get('viewAs');
    if (viewAsParam && (user?.role === 'admin' || user?.is_super_admin)) {
      return viewAsParam;
    }
    const mapping = loginMapping.find(m => m.admin_email === user?.email);
    return mapping?.partner_email || user?.email;
  })();

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: !!user && (user.role === 'admin' || user.is_super_admin),
  });

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;
  const isSuperAdmin = user?.is_super_admin;
  const viewingAsPartnerEmail = effectivePartnerEmail !== user?.email ? effectivePartnerEmail : null;
  const viewingAsPartner = viewingAsPartnerEmail ? allPartners.find(p => p.email === viewingAsPartnerEmail) : null;

  const addPartnerViewParam = (url) => {
    if (viewingAsPartnerEmail && url) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}viewAs=${encodeURIComponent(viewingAsPartnerEmail)}`;
    }
    return url;
  };

  const { data: currentProfile } = useQuery({
    queryKey: ['currentProfile', effectivePartnerEmail],
    queryFn: async () => {
      const profiles = await base44.entities.PartnerProfile.filter({ partner_email: effectivePartnerEmail });
      return profiles[0];
    },
    enabled: !!effectivePartnerEmail,
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jotfor.ms/s/umd/latest/for-cardform-embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Hide splash when loading is complete
    if (!userLoading) {
      // If there's an auth error (user not logged in), redirect to login
      if (userError) {
        base44.auth.redirectToLogin();
        return;
      }
      setShowSplash(false);
    }
  }, [userLoading, userError]);

  // Track page visits and time spent
  useEffect(() => {
    if (!user?.email || !currentPageName) return;

    const trackPageVisit = async () => {
      try {
        await base44.entities.ActivityLog.create({
          activity_type: 'page_visit',
          user_email: user.email,
          description: `Visited ${currentPageName}`,
          page_name: currentPageName,
          session_id: sessionId,
          metadata: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Failed to track page visit:', error);
      }
    };

    trackPageVisit();
    const startTime = Date.now();
    setPageStartTime(startTime);

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 2) {
        base44.entities.ActivityLog.create({
          activity_type: 'page_visit',
          user_email: user.email,
          description: `Spent ${timeSpent}s on ${currentPageName}`,
          page_name: currentPageName,
          session_id: sessionId,
          time_spent_seconds: timeSpent,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }).catch(console.error);
      }
    };
  }, [currentPageName, user?.email, sessionId]);

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', effectivePartnerEmail],
    queryFn: async () => {
      const allReminders = await base44.entities.Reminder.filter({ partner_email: effectivePartnerEmail });
      return allReminders.filter(r => new Date(r.reminder_date) >= new Date());
    },
    enabled: !!effectivePartnerEmail,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', effectivePartnerEmail],
    queryFn: async () => {
      const allNotifications = await base44.entities.StatusUpdate.list('-created_date', 50);
      return allNotifications.filter(n => n.partner_email === effectivePartnerEmail && !n.read);
    },
    enabled: !!effectivePartnerEmail,
  });

  const featureMap = {
    "Dashboard": "dashboard",
    "Getting Started": "getting_started",
    "Exhibitor Stand": "exhibitor_stand",
    "My Deliverables": "deliverables",
    "My Nominations": "nominations",
    "Contracts": "contracts",
    "Partner Hub": "partner_hub",
    "Timeline & Deadlines": "calendar",
    "Tasks & Reminders": "tasks",
    "Event Schedule": "event_schedule",
    "Venue Information": "venue",
    "Media Tracker": "media_tracker",
    "Brand Assets": "brand_assets",
    "Social Media Kit": "social_media",
    "PR & Press": "press_kit",
    "SEF Access & Passes": "passes",
    "Opportunities": "opportunities",
    "Networking": "networking",
    "Benefits & Perks": "benefits",
    "Imagine Lab": "imagine_lab",
    "Messages": "messages",
    "Notifications": "notifications",
    "Contact Directory": "contact_directory",
    "My Account Manager": "account_manager",
    "Resources & Downloads": "resources",
    "Documents Library": "documents",
    "Training & Tutorials": "training",
    "Support & FAQs": "support",
    "My Profile": "profile",
    "Activity Log": "activity_log",
    "Settings": "settings",
    "Review & Approve": "review_approve",
  };

  const allPartnerSections = [
    {
      label: "Overview",
      targetList: 'navItems',
      items: [
        { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard, description: "Your partnership hub" },
        { title: "Getting Started", url: createPageUrl("GettingStarted"), icon: Target, description: "Quick start guide" },
        { title: "Exhibitor Stand", url: createPageUrl("ExhibitorStand"), icon: Building2, description: "Booth placement & artwork" },
      ]
    },
    {
      label: "My Work",
      targetList: 'navItems',
      items: [
        { title: "My Deliverables", url: createPageUrl("Deliverables"), icon: FileText, description: "Track & upload files" },
        { title: "My Nominations", url: createPageUrl("Nominations"), icon: Award, description: "Submit nominations" },
        { title: "Contracts", url: createPageUrl("Contracts"), icon: Briefcase, description: "Partnership agreements" },
        { title: "Partner Hub", url: createPageUrl("PartnerHub"), icon: Package, description: "Complete info center" },
        { title: "Review & Approve", url: createPageUrl("ApprovalReview"), icon: CheckSquare, description: "Review admin files" },
      ]
    },
    {
      label: "Planning & Events",
      targetList: 'navItems',
      items: [
        { title: "Timeline & Deadlines", url: createPageUrl("Timeline"), icon: CalendarIcon, badge: reminders.length > 0 ? reminders.length : null, description: "Tasks, reminders & bookings" },
        { title: "Event Schedule", url: createPageUrl("EventSchedule"), icon: Map, description: "Full event program" },
        { title: "Venue Information", url: createPageUrl("Venue"), icon: Building, description: "Location & facilities" },
      ]
    },
    {
      label: "Media & Marketing",
      targetList: 'navItems',
      items: [
        { title: "Media Tracker", url: createPageUrl("MediaTracker"), icon: TrendingUp, description: "Track media usage" },
        { title: "Brand Assets", url: createPageUrl("BrandAssets"), icon: Star, description: "Logos & guidelines" },
        { title: "Social Media Kit", url: createPageUrl("SocialMedia"), icon: Share2, description: "Content & templates" },
        { title: "PR & Press", url: createPageUrl("PressKit"), icon: Globe, description: "Press materials" },
      ]
    },
    {
      label: "Engagement",
      targetList: 'navItems',
      items: [
        { title: "SEF Access & Passes", url: createPageUrl("Passes"), icon: CreditCard, description: "Your event access" },
        { title: "Opportunities", url: createPageUrl("Opportunities"), icon: Lightbulb, description: "New initiatives" },
        { title: "Networking", url: createPageUrl("Networking"), icon: Users, description: "Connect with partners" },
        { title: "Benefits & Perks", url: createPageUrl("Benefits"), icon: Gift, description: "Partner exclusive" },
        { title: "Imagine Lab", url: createPageUrl("ImagineLab"), icon: Star, description: "AI-powered vision board" },
      ]
    },
    {
      label: "Communication",
      targetList: 'navItems',
      items: [
        { title: "Messages", url: createPageUrl("Messages"), icon: MessageSquare, description: "Direct messaging" },
        { title: "Notifications", url: createPageUrl("Notifications"), icon: Bell, badge: notifications.length > 0 ? notifications.length : null, description: "Stay updated" },
        { title: "Contact Directory", url: createPageUrl("ContactDirectory"), icon: Phone, description: "Key contacts" },
      ]
    },
    {
      label: "Resources & Support",
      targetList: 'resourcesItems',
      items: [
        { title: "My Account Manager", url: createPageUrl("AccountManager"), icon: UserCircle, description: "Your dedicated contact" },
        { title: "Resources & Downloads", url: createPageUrl("Resources"), icon: Download, description: "Guides & templates" },
        { title: "Documents Library", url: createPageUrl("Documents"), icon: FolderOpen, description: "All your files" },
        { title: "Training & Tutorials", url: createPageUrl("Training"), icon: Video, description: "Learn the platform" },
        { title: "Support & FAQs", url: createPageUrl("Support"), icon: HelpCircle, description: "Get help" },
      ]
    },
    {
      label: "Account",
      targetList: 'accountItems',
      items: [
        { title: "My Profile", url: createPageUrl("Profile"), icon: User, description: "Manage your info" },
        { title: "Activity Log", url: createPageUrl("ActivityLog"), icon: Activity, description: "View your history" },
        { title: "Settings", url: createPageUrl("Settings"), icon: Settings, description: "Preferences" },
      ]
    }
  ];

  const filterPartnerNavSections = (sections, visibleModules, isAdminViewing) => {
    // If admin is viewing as partner, always show all sections
    if (isAdminViewing) {
      return sections;
    }
    
    // For actual partners, filter based on visible_modules
    // If visible_modules is empty or not set, show all sections (default behavior)
    if (visibleModules && visibleModules.length > 0) {
      return sections.map(section => ({
        ...section,
        items: section.items.filter(item => {
          const feature = featureMap[item.title];
          // If feature is not in featureMap, show it by default
          if (!feature) return true;
          return visibleModules.includes(feature);
        })
      })).filter(section => section.items.length > 0);
    }
    return sections;
  };

  const adminBaseNavItems = [
    { title: "Dashboard", url: createPageUrl("Dashboard"), icon: LayoutDashboard },
    { title: "Manage Partners", url: createPageUrl("ManagePartners"), icon: Users },
    { title: "Contracts", url: createPageUrl("Contracts"), icon: Briefcase },
    { title: "Requirements", url: createPageUrl("AdminRequirements"), icon: ClipboardList },
    { title: "Approvals System", url: createPageUrl("AdminApprovals"), icon: CheckSquare },
    { title: "Send Email", url: createPageUrl("SendEmail"), icon: Mail },
    { title: "Admin Panel", url: createPageUrl("AdminPanel"), icon: Shield },
    { title: "Analytics", url: createPageUrl("AdminAnalytics"), icon: BarChart3 },
    { title: "Email Invitations", url: createPageUrl("EmailInvitations"), icon: Mail },
    { title: "Email Test", url: createPageUrl("EmailTest"), icon: Mail },
  ];

  if (isSuperAdmin) {
    adminBaseNavItems.push({
      title: "Manage Admins",
      url: createPageUrl("SuperAdminPanel"),
      icon: Shield,
    });
  }

  const visibleModules = currentProfile?.visible_modules;

  const navItems = [];
  const resourcesItems = [];
  const accountItems = [];

  // Pass isAdmin && viewingAsPartnerEmail as isAdminViewing flag
  const filteredSections = isAdmin && !viewingAsPartnerEmail
    ? allPartnerSections
    : filterPartnerNavSections(allPartnerSections, visibleModules, isAdmin && !!viewingAsPartnerEmail);

  filteredSections.forEach(section => {
    if (section.targetList === 'navItems') {
      section.items.forEach(item => navItems.push(item));
    } else if (section.targetList === 'resourcesItems') {
      section.items.forEach(item => resourcesItems.push(item));
    } else if (section.targetList === 'accountItems') {
      section.items.forEach(item => accountItems.push(item));
    }
  });

  const adminNavItems = isAdmin ? adminBaseNavItems : [];

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  const handlePartnerSelect = (partnerEmail) => {
    const newUrl = `${location.pathname}?viewAs=${encodeURIComponent(partnerEmail)}`;
    navigate(newUrl);
  };

  const handleStopViewing = () => {
    navigate(location.pathname);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
        <Sidebar className="border-r border-gray-200/80 bg-white/95 backdrop-blur-xl shadow-xl w-64 flex flex-col">
          <SidebarContent className="flex-1 overflow-y-auto">
            <div className="p-6 border-b border-gray-200/60">
              <Link to={addPartnerViewParam(createPageUrl("Dashboard"))} className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f50edf823231efaa8f1c55/e4e1ba1a2_jabRmqnSDFvbmVPwHG7FuOV0ENZqO9tu.jpg"
                    alt="SEF Logo"
                    className="w-12 h-12 object-contain relative z-10"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent leading-tight">SEF Portal</h1>
                  <p className="text-xs text-gray-500 font-medium">Partner Dashboard</p>
                </div>
              </Link>
            </div>

            {viewingAsPartner && (
              <div className="mx-4 my-3 p-4 border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-semibold text-orange-900">Viewing as Partner</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{viewingAsPartner.full_name}</p>
                    <p className="text-xs text-gray-600">{viewingAsPartner.email}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleStopViewing}
                    className="h-7 w-7 hover:bg-orange-100 rounded-lg"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>
            )}

            {isAdmin && !viewingAsPartnerEmail && adminNavItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.title}>
                          <Link to={item.url}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {isAdmin && !viewingAsPartnerEmail && (
              <div className="px-4 py-3 border-b border-gray-200/60">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between hover:bg-orange-50 hover:border-orange-200 transition-all">
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">View as Partner</span>
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 max-h-96 overflow-y-auto" align="start">
                    {allPartners
                      .filter(p => p.role === 'user')
                      .map((partner) => (
                        <DropdownMenuItem
                          key={partner.id}
                          onClick={() => handlePartnerSelect(partner.email)}
                          className="hover:bg-orange-50 cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{partner.full_name}</p>
                            <p className="text-xs text-gray-500">{partner.email}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {filteredSections.filter(s => s.targetList === 'navItems').map(section => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.title}>
                          <Link to={addPartnerViewParam(item.url)}>
                            <item.icon />
                            <span className="flex-1">{item.title}</span>
                            {item.badge && (
                              <Badge variant="destructive" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            {filteredSections.filter(s => s.targetList === 'resourcesItems').map(section => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.title}>
                          <Link to={addPartnerViewParam(item.url)}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <div className="border-t border-gray-200/60 bg-gray-50/50">
            {filteredSections.filter(s => s.targetList === 'accountItems').map(section => (
              <SidebarGroup key={section.label}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={currentPageName === item.title}>
                          <Link to={addPartnerViewParam(item.url)}>
                            <item.icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            <div className="p-4">
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 font-medium shadow-sm"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          {/* Top Header Bar with Notification Bell */}
          <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-6 py-3">
            <div className="flex items-center justify-end gap-4">
              <GlobalNotificationBell partnerEmail={effectivePartnerEmail} />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-500">{user?.company_name || user?.email}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
          </div>
          {children}
        </main>

        <Toaster position="top-right" richColors />

        {/* Amira Chatbot Icon */}
        {user && (
          <Button
            size="icon"
            className="fixed bottom-8 right-8 rounded-full h-16 w-16 shadow-2xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 z-[100] p-0 overflow-hidden border-4 border-white hover:scale-110 transition-all duration-300"
            onClick={() => setShowChat(true)}
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f50edf823231efaa8f1c55/06633f35d_Screenshot2025-11-22at124610AM.png" 
              alt="Amira Support"
              className="w-full h-full object-cover rounded-full"
            />
          </Button>
        )}

        {/* Amira Chatbot Component */}
        <AnimatePresence>
          {showChat && (
            <SupportAgentChat onClose={() => setShowChat(false)} />
          )}
        </AnimatePresence>
      </div>
    </SidebarProvider>
  );
}
