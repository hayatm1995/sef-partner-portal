
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { activityLogService } from "@/services/supabaseService";
import { useQuery } from "@tanstack/react-query";
import SplashScreen from "@/components/common/SplashScreen";
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
import { Progress } from "@/components/ui/progress";
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
  MessageCircle,
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
  Building2,
  UserPlus,
  ShieldCheck
} from "lucide-react";
import SupportAgentChat from "@/components/support/SupportAgentChat";
import GlobalNotificationBell from "@/components/notifications/GlobalNotificationBell";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, partner, partnerUser, role, loading: authLoading, loginAsTestUser, viewMode, switchViewMode } = useAuth();
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [pageStartTime, setPageStartTime] = useState(Date.now());
  const [showSplash, setShowSplash] = useState(true);
  const [showChat, setShowChat] = useState(false);

  // STRICT ROLE LOGIC - Use role from AuthContext (already resolved from database)
  // Get role from context - this is the source of truth
  // MUST be defined BEFORE any useQuery hooks that depend on it
  const userRole = role || user?.role;
  
  // STRICT: Only 'superadmin', 'admin', or 'partner' - no fallback behavior
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin' || isSuperAdmin; // Admin includes superadmin
  const isPartner = userRole === 'partner';
  
  // If role is not valid, don't show any sidebar
  if (!isSuperAdmin && !isAdmin && !isPartner) {
    console.error('[Layout] Invalid role:', userRole);
  }

  // Get all partners (for admin view)
  // In dev mode, ensure Demo Partner is always included
  const isDevModeLayout = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: async () => {
      const { partnersService } = await import('@/services/supabaseService');
      const partners = await partnersService.getAll();
      
      // In dev mode, ensure Demo Partner exists in the list
      if (isDevModeLayout) {
        const hasDemoPartner = partners.some(p => p.name === 'Demo Partner');
        if (!hasDemoPartner) {
          // Try to create Demo Partner if it doesn't exist
          try {
            const demoPartnerId = '00000000-0000-0000-0000-000000000001';
            const demoPartner = await partnersService.create({
              id: demoPartnerId,
              name: 'Demo Partner',
              tier: 'Platinum',
              contract_status: 'Signed',
              website_url: null,
              logo_url: null,
            });
            console.log('✅ Created Demo Partner for dropdown:', demoPartner);
            return [demoPartner, ...partners];
          } catch (error) {
            // If creation fails, try to fetch by ID or use fallback
            try {
              const demoPartner = await partnersService.getById('00000000-0000-0000-0000-000000000001');
              return [demoPartner, ...partners];
            } catch {
              // Add fallback Demo Partner to the list
              const fallbackDemoPartner = {
                id: '00000000-0000-0000-0000-000000000001',
                name: 'Demo Partner',
                tier: 'Platinum',
                contract_status: 'Signed',
                website_url: null,
              };
              return [fallbackDemoPartner, ...partners];
            }
          }
        }
      }
      
      return partners;
    },
    enabled: !!user && isSuperAdmin,
  });

  // Get all partner users (for admin view)
  const { data: allPartnerUsers = [] } = useQuery({
    queryKey: ['allPartnerUsers'],
    queryFn: async () => {
      const { partnerUsersService } = await import('@/services/supabaseService');
      const partners = await partnersService.getAll();
      const allUsers = [];
      for (const p of partners) {
        const users = await partnerUsersService.getByPartnerId(p.id);
        allUsers.push(...users);
      }
      return allUsers;
    },
    enabled: !!user && isSuperAdmin,
  });

  const effectivePartnerId = (() => {
    const urlParams = new URLSearchParams(location.search);
    const viewAsParam = urlParams.get('viewAs');
    if (viewAsParam && isSuperAdmin) {
      return viewAsParam; // This would be partner_id when viewing as partner
    }
    return user?.partner_id;
  })();
  
  const viewingAsPartnerId = effectivePartnerId !== user?.partner_id ? effectivePartnerId : null;
  const viewingAsPartner = viewingAsPartnerId ? allPartners.find(p => p.id === viewingAsPartnerId) : null;

  const addPartnerViewParam = (url) => {
    if (viewingAsPartnerId && url) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}viewAs=${encodeURIComponent(viewingAsPartnerId)}`;
    }
    return url;
  };

  // Partner Info Card Component with Progress
  const PartnerInfoCard = ({ partner, onStopViewing, isViewingAs, userId }) => {
    const { data: progress } = useQuery({
      queryKey: ['partnerProgress', partner?.id],
      queryFn: async () => {
        if (!partner?.id) return null;
        try {
          const { partnerProgressService } = await import('@/services/supabaseService');
          return await partnerProgressService.getByPartnerId(partner.id);
        } catch (error) {
          console.error('Error fetching partner progress:', error);
          return null;
        }
      },
      enabled: !!partner?.id && !!userId,
    });

    const progressPercentage = progress?.progress_percentage ?? 0;

    return (
      <div className="mx-4 my-3 p-4 border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-sm">
        {isViewingAs && (
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-orange-600" />
            <p className="text-xs font-semibold text-orange-900">Viewing as Partner</p>
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{partner?.name}</p>
            <p className="text-xs text-gray-600">{partner?.tier}</p>
          </div>
          {isViewingAs && onStopViewing && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onStopViewing}
              className="h-7 w-7 hover:bg-orange-100 rounded-lg"
            >
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          )}
        </div>
        {progress !== null && (
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">Progress</span>
              <span className="text-xs font-bold text-orange-700">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {progress?.approved_submissions ?? 0} of {progress?.total_deliverables ?? 0} completed
            </p>
          </div>
        )}
      </div>
    );
  };

  // Get current partner data with safe fallback
  const currentPartner = viewingAsPartner || partner || null;

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
    // Hide splash when loading is complete OR if we have a user (dev mode)
    if (!authLoading || user) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 500); // Small delay for smooth transition
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  // Track page visits and time spent
  useEffect(() => {
    if (!user?.email || !currentPageName) return;

    const trackPageVisit = async () => {
      try {
        if (user?.partner_user?.id && user?.partner_id) {
          await activityLogService.create({
            activity_type: 'page_visit',
            user_id: user.partner_user.id,
            partner_id: user.partner_id,
            description: `Visited ${currentPageName}`,
            metadata: {
              page_name: currentPageName,
              session_id: sessionId,
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.error('Failed to track page visit:', error);
      }
    };

    trackPageVisit();
    const startTime = Date.now();
    setPageStartTime(startTime);

    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      if (timeSpent > 2 && user?.partner_user?.id && user?.partner_id) {
        activityLogService.create({
          activity_type: 'page_visit',
          user_id: user.partner_user.id,
          partner_id: user.partner_id,
          description: `Spent ${timeSpent}s on ${currentPageName}`,
          metadata: {
            page_name: currentPageName,
            session_id: sessionId,
            time_spent_seconds: timeSpent,
            timestamp: new Date().toISOString()
          }
        }).catch(console.error);
      }
    };
  }, [currentPageName, user?.email, sessionId]);

  // Get notifications for current partner
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentPartner?.id],
    queryFn: async () => {
      if (!currentPartner?.id) return [];
      const { notificationsService } = await import('@/services/supabaseService');
      return notificationsService.getByPartnerId(currentPartner.id, true); // unread only
    },
    enabled: !!currentPartner?.id,
  });

  // Get unread message count for partner
  const { data: partnerUnreadMessages = 0 } = useQuery({
    queryKey: ['partnerMessagesUnread', currentPartner?.id],
    queryFn: async () => {
      if (!currentPartner?.id) return 0;
      const { partnerMessagesService } = await import('@/services/supabaseService');
      return partnerMessagesService.getUnreadCount(currentPartner.id);
    },
    enabled: !!currentPartner?.id && isPartner,
  });

  // Get unread message count for admin
  const { data: adminUnreadMessages = 0 } = useQuery({
    queryKey: ['adminMessagesUnread'],
    queryFn: async () => {
      const { partnerMessagesService } = await import('@/services/supabaseService');
      return partnerMessagesService.getAdminUnreadCount();
    },
    enabled: isSuperAdmin,
    refetchInterval: 30000,
  });

  // Get unread support messages count for partner
  const { data: partnerSupportUnread = 0 } = useQuery({
    queryKey: ['partnerSupportUnread', currentPartner?.id],
    queryFn: async () => {
      if (!currentPartner?.id) return 0;
      const { supportService } = await import('@/services/supportService');
      return supportService.getUnreadCount(currentPartner.id, 'partner');
    },
    enabled: !!currentPartner?.id && isPartner,
    refetchInterval: 30000,
  });

  // Get unread support messages count for admin
  const { data: adminSupportUnread = 0 } = useQuery({
    queryKey: ['adminSupportUnread'],
    queryFn: async () => {
      const { supportService } = await import('@/services/supportService');
      const partners = await supportService.getPartnersWithUnread();
      return partners.reduce((sum, p) => sum + p.unread_count, 0);
    },
    enabled: isSuperAdmin,
    refetchInterval: 30000,
  });

  const featureMap = {
    "Dashboard": "dashboard",
    "Getting Started": "getting_started",
    "Exhibitor Stand": "exhibitor_stand",
    "My Deliverables": "deliverables",
    "Deliverables": "deliverables",
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
        { title: "My Deliverables", url: createPageUrl("PartnerDeliverables"), icon: FileText, description: "Track & upload files" },
        { title: "Deliverables", url: "/partner/deliverables", icon: FileText, description: "View & submit deliverables" },
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
        { title: "Timeline & Deadlines", url: createPageUrl("Timeline"), icon: CalendarIcon, badge: null, description: "Tasks, reminders & bookings" },
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
        { title: "Support", url: "/support", icon: MessageCircle, description: "Chat with admin support", badge: null }, // Badge will be set dynamically
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
    { title: "Manage Partners", url: "/admin/partners", icon: Users },
    { title: "Invite Partner", url: "/admin/invite-partner", icon: UserPlus },
    { title: "Support Messages", url: "/admin/support", icon: MessageCircle, badge: adminSupportUnread > 0 ? adminSupportUnread : null },
    { title: "Exhibitor Stands", url: "/admin/booths", icon: Building2 },
    { title: "Contracts", url: "/admin/contracts", icon: Briefcase },
    { title: "Review Deliverables", url: "/admin/deliverables-review", icon: ShieldCheck },
    { title: "User Management", url: "/admin/users", icon: Users },
    { title: "Requirements", url: createPageUrl("AdminRequirements"), icon: ClipboardList },
    { title: "Approvals System", url: createPageUrl("AdminApprovals"), icon: CheckSquare },
    { title: "VIP Invitations", url: "/admin/vip-invitations", icon: Users },
    { title: "Send Email", url: createPageUrl("SendEmail"), icon: Mail },
    { title: "Admin Panel", url: createPageUrl("AdminPanel"), icon: Shield },
    { title: "Email Invitations", url: createPageUrl("EmailInvitations"), icon: Mail },
    { title: "Email Test", url: createPageUrl("EmailTest"), icon: Mail },
  ];

  if (isSuperAdmin) {
    adminBaseNavItems.push({
      title: "Admin Partners",
      url: "/admin/partners",
      icon: Users,
    });
    adminBaseNavItems.push({
      title: "Deliverables Review",
      url: "/admin/deliverables",
      icon: FileText,
      
    });
    adminBaseNavItems.push({
      title: "Submissions Review",
      url: "/admin/submissions",
      icon: CheckSquare,
    });
    // Admin Command Center - only show if not impersonating a partner
    if (!viewingAsPartnerId) {
      adminBaseNavItems.push({
        title: "Admin Command Center",
        url: createPageUrl("SuperAdminPanel"),
        icon: Shield,
      });
    }
  }

  const visibleModules = currentPartner?.visible_modules || [];

  const navItems = [];
  const resourcesItems = [];
  const accountItems = [];

  // STRICT: Show partner navigation ONLY if user is a partner
  // Admins/superadmins can view as partner, but that's handled separately
  const shouldShowPartnerNav = isPartner || (isAdmin && !!viewingAsPartnerId);
  
  // Pass isAdmin && viewingAsPartnerId as isAdminViewing flag
  const filteredSections = shouldShowPartnerNav
    ? filterPartnerNavSections(Array.isArray(allPartnerSections) ? allPartnerSections : [], visibleModules, isAdmin && !!viewingAsPartnerId)
    : [];

  // Safely iterate through filtered sections
  if (Array.isArray(filteredSections)) {
    filteredSections.forEach(section => {
      if (section?.targetList === 'navItems' && Array.isArray(section?.items)) {
        section.items.forEach(item => {
          if (item) {
            // Update Support badge with unread count
            if (item.title === 'Support' && partnerSupportUnread > 0) {
              item.badge = partnerSupportUnread;
            }
            navItems.push(item);
          }
        });
      } else if (section?.targetList === 'resourcesItems' && Array.isArray(section?.items)) {
        section.items.forEach(item => {
          if (item) resourcesItems.push(item);
        });
      } else if (section?.targetList === 'accountItems' && Array.isArray(section?.items)) {
        section.items.forEach(item => {
          if (item) accountItems.push(item);
        });
      }
    });
  }

  // STRICT: Show Admin nav ONLY if user is admin/superadmin and NOT viewing as partner
  // "View as Partner" button works without changing actual role - it's just a view mode
  const adminNavItems = (isAdmin && !viewingAsPartnerId) ? adminBaseNavItems : [];

  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      // Force full page reload and redirect to login (clears all state)
      window.location.href = '/Login';
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, redirect to login
      window.location.href = '/Login';
    }
  };

  const handlePartnerSelect = (partnerId) => {
    // Navigate to Deliverables page when switching to partner view
    navigate(`/deliverables?viewAs=${encodeURIComponent(partnerId)}`);
  };

  const handleStopViewing = () => {
    navigate(location.pathname);
  };

  // In dev mode, skip splash screen
  const isDevMode = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  if (showSplash && !isDevMode) {
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
              <PartnerInfoCard 
                partner={viewingAsPartner} 
                onStopViewing={handleStopViewing}
                isViewingAs={true}
                userId={user?.id}
              />
            )}
            {isPartner && currentPartner && (
              <PartnerInfoCard 
                partner={currentPartner}
                isViewingAs={false}
                userId={user?.id}
              />
            )}

            {/* Admin Nav Items - STRICT: Only show for admin/superadmin */}
            {isAdmin && adminNavItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Admin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNavItems.map((item) => {
                      // For admin routes, check if current path matches
                      const isActive = item.url.startsWith('/admin') 
                        ? location.pathname.startsWith(item.url)
                        : currentPageName === item.title;
                      
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link to={item.url}>
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
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Control Room - Superadmin Only */}
            {isSuperAdmin && !viewingAsPartnerId && (
              <SidebarGroup>
                <SidebarGroupLabel>Superadmin</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton 
                        asChild 
                        isActive={location.pathname.startsWith('/superadmin/control-room')}
                      >
                        <Link to="/superadmin/control-room">
                          <BarChart3 />
                          <span className="flex-1">Control Room</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Admin View As Partner Dropdown - STRICT: Only for admin/superadmin */}
            {/* This allows viewing partner UI without changing actual role */}
            {isAdmin && (
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
                    {Array.isArray(allPartners) && allPartners.length > 0 ? (
                      allPartners.map((partner) => (
                        <DropdownMenuItem
                          key={partner?.id || Math.random()}
                          onClick={() => handlePartnerSelect(partner?.id)}
                          className="hover:bg-orange-50 cursor-pointer"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{partner?.name || 'Unknown Partner'}</p>
                            <p className="text-xs text-gray-500">{partner?.tier || 'N/A'} • {partner?.contract_status || 'N/A'}</p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>
                        <p className="text-sm text-gray-500">No partners available</p>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Partner Navigation */}
            {shouldShowPartnerNav && Array.isArray(filteredSections) && filteredSections
              .filter(s => s?.targetList === 'navItems' && Array.isArray(s?.items))
              .map(section => (
                <SidebarGroup key={section?.label || Math.random()}>
                  <SidebarGroupLabel>{section?.label || 'Section'}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item?.title || Math.random()}>
                          <SidebarMenuButton asChild isActive={currentPageName === item?.title}>
                            <Link to={addPartnerViewParam(item?.url || '/Dashboard')}>
                              {item?.icon && <item.icon />}
                              <span className="flex-1">{item?.title || 'Untitled'}</span>
                              {item?.badge && (
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

            {shouldShowPartnerNav && Array.isArray(filteredSections) && filteredSections
              .filter(s => s?.targetList === 'resourcesItems' && Array.isArray(s?.items))
              .map(section => (
                <SidebarGroup key={section?.label || Math.random()}>
                  <SidebarGroupLabel>{section?.label || 'Section'}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item?.title || Math.random()}>
                          <SidebarMenuButton asChild isActive={currentPageName === item?.title}>
                            <Link to={addPartnerViewParam(item?.url || '/Dashboard')}>
                              {item?.icon && <item.icon />}
                              <span>{item?.title || 'Untitled'}</span>
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
            {shouldShowPartnerNav && Array.isArray(filteredSections) && filteredSections
              .filter(s => s?.targetList === 'accountItems' && Array.isArray(s?.items))
              .map(section => (
                <SidebarGroup key={section?.label || Math.random()}>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item?.title || Math.random()}>
                          <SidebarMenuButton asChild isActive={currentPageName === item?.title}>
                            <Link to={addPartnerViewParam(item?.url || '/Dashboard')}>
                              {item?.icon && <item.icon />}
                              <span>{item?.title || 'Untitled'}</span>
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
            <div className="flex items-center justify-between">
              {!user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loginAsTestUser}
                  className="border-orange-200 hover:bg-orange-50 text-orange-700"
                >
                  Login as Test User
                </Button>
              )}
              <div className="flex items-center gap-4 ml-auto">
                <GlobalNotificationBell partnerId={currentPartner?.id} />
                
                {/* Role Switch Dropdown - only show if user is admin/superadmin */}
                {/* Note: This is a view mode, not an actual role change */}
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="border-orange-200 hover:bg-orange-50 text-orange-700">
                        {viewMode === 'partner' ? (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            View as Admin
                          </>
                        ) : (
                          <>
                            <UserCircle className="w-4 h-4 mr-2" />
                            View as Partner
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          if (viewMode === 'partner') {
                            switchViewMode('admin');
                            navigate('/admin/partners');
                          } else {
                            switchViewMode('partner');
                            navigate('/Dashboard');
                          }
                        }}
                      >
                        {viewMode === 'partner' ? (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Switch to Admin View
                          </>
                        ) : (
                          <>
                            <UserCircle className="w-4 h-4 mr-2" />
                            Switch to Partner View
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
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
