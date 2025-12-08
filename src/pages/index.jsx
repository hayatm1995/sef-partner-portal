import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";
import PartnerDashboard from "./PartnerDashboard";

// Updated imports for Deliverables
import PartnerDeliverables from "./partner/Deliverables"; // The new partner page
import DeliverablesReview from "./admin/DeliverablesReview"; // The new admin page

import Nominations from "./Nominations";

import AdminPanel from "./AdminPanel";

import Calendar from "./Calendar";

import MediaTracker from "./MediaTracker";

import AdminNotifications from "./admin/AdminNotifications";
import AdminSupport from "./admin/AdminSupport";
import AdminContracts from "./admin/AdminContracts";
import AdminUsers from "./admin/AdminUsers";
import InvitePartner from "./admin/InvitePartner";
import PartnerSupport from "./PartnerSupport";
import ControlRoom from "./superadmin/ControlRoom";

import PartnerHub from "./PartnerHub";

import AdminRequirements from "./AdminRequirements";

import Messages from "./Messages";

import Documents from "./Documents";

import Training from "./Training";

import Support from "./Support";

import Profile from "./Profile";

import ActivityLog from "./ActivityLog";

import Settings from "./Settings";

import Tasks from "./Tasks";

import Notifications from "./Notifications";

import AccountManager from "./AccountManager";

import Resources from "./Resources";

import Passes from "./Passes";

import Opportunities from "./Opportunities";

import GettingStarted from "./GettingStarted";

import EmailTemplates from "./EmailTemplates";

import SuperAdminPanel from "./SuperAdminPanel";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

import Venue from "./Venue";

import EventSchedule from "./EventSchedule";

import EmailInvitations from "./EmailInvitations";

import SendEmail from "./SendEmail";

import AdminApprovals from "./AdminApprovals";
import Approvals from "./admin/Approvals";

import ApprovalReview from "./ApprovalReview";

import AdminReminders from "./AdminReminders";

import ExhibitorStand from "./ExhibitorStand";

import PageNotFound from "./PageNotFound";
import Unauthorized from "./Unauthorized";

import Timeline from "./Timeline";

import Chat from "./Chat";

import ImagineLab from "./ImagineLab";

import SocialMedia from "./SocialMedia";

import PressKit from "./PressKit";

import Benefits from "./Benefits";

import EmailTest from "./EmailTest";

import Contracts from "./Contracts";

import AdminPartners from "./admin/AdminPartners";
import AdminPartnersAssignment from "./admin/AdminPartnersAssignment";
import EditPartner from "./admin/EditPartner";
import AddPartner from "./admin/AddPartner";
import AdminDeliverables from "./admin/AdminDeliverables";
import AdminSubmissions from "./admin/AdminSubmissions";
import AdminMessages from "./admin/AdminMessages";
import VIPApprovals from "./admin/VIPApprovals";
import AdminBooths from "./admin/AdminBooths";
import AdminBoothDetails from "./admin/AdminBoothDetails";
import AdminControlRoom from "./admin/AdminControlRoom";
import AdminOperations from "./admin/AdminOperations";
import PartnerMessages from "@/components/messages/PartnerMessages";
import ReviewNominations from "./admin/ReviewNominations";

import Login from "./Login";
import Landing from "./Landing";
import SetPassword from "./auth/SetPassword";
import DevModeSelector from "./DevModeSelector";
import AuthGuard from "@/components/auth/AuthGuard";
import RoleGuard from "@/components/auth/RoleGuard";
import RouteGuard from "@/components/auth/RouteGuard";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { SUPERADMIN } from "@/constants/users";
import NoPartnerProfileFound from "@/components/dashboard/NoPartnerProfileFound";
import { DEV_MODE } from "@/config/devMode";
import { useAppRole } from "@/hooks/useAppRole";
import { useDevRole } from "@/contexts/DevRoleContext";
import DemoRoutes from "@/demo/DemoRoutes";

const PAGES = {
    
    Dashboard: Dashboard,
    PartnerDashboard: PartnerDashboard,
    
    AdminPartners: AdminPartners,
    AdminDeliverables: AdminDeliverables,
    AdminSubmissions: AdminSubmissions,
    AdminMessages: AdminMessages,
    VIPApprovals: VIPApprovals,
    PartnerMessages: PartnerMessages,
    ReviewNominations: ReviewNominations,
    
    // Updated Deliverables mapping
    DeliverablesReview: DeliverablesReview,
    PartnerDeliverables: PartnerDeliverables,
    
    Nominations: Nominations,
    
    AdminPanel: AdminPanel,
    
    Calendar: Calendar,
    
    MediaTracker: MediaTracker,
    
    ControlRoom: ControlRoom,
    AdminNotifications: AdminNotifications,
    
    PartnerHub: PartnerHub,
    
    AdminRequirements: AdminRequirements,
    
    Messages: Messages,
    
    Documents: Documents,
    
    Training: Training,
    
    Support: Support,
    
    Profile: Profile,
    
    ActivityLog: ActivityLog,
    
    Settings: Settings,
    
    Tasks: Tasks,
    
    Notifications: Notifications,
    
    AccountManager: AccountManager,
    
    Resources: Resources,
    
    Passes: Passes,
    
    Opportunities: Opportunities,
    
    GettingStarted: GettingStarted,
    
    EmailTemplates: EmailTemplates,
    
    SuperAdminPanel: SuperAdminPanel,
    
    Venue: Venue,
    
    EventSchedule: EventSchedule,
    
    EmailInvitations: EmailInvitations,
    
    SendEmail: SendEmail,
    
    AdminApprovals: AdminApprovals,
    Approvals: Approvals,
    
    ApprovalReview: ApprovalReview,
    
    AdminReminders: AdminReminders,
    
    ExhibitorStand: ExhibitorStand,
    
    PageNotFound: PageNotFound,
    
    Unauthorized: Unauthorized,
    
    Timeline: Timeline,
    
    Chat: Chat,
    
    ImagineLab: ImagineLab,
    
    SocialMedia: SocialMedia,
    
    PressKit: PressKit,
    
    Benefits: Benefits,
    
    EmailTest: EmailTest,
    
    Contracts: Contracts,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    // Handle admin routes
    if (url.startsWith('/admin/dashboard')) {
        return 'Dashboard';
    }
    if (url.startsWith('/admin/partners')) {
        if (url === '/admin/partners' || url === '/admin/partners/') {
            return 'AdminPartners';
        }
        // For edit/new routes, still return AdminPartners for breadcrumb purposes
        return 'AdminPartners';
    }
    if (url.startsWith('/admin/deliverables-review')) {
        return 'DeliverablesReview';
    }
    if (url.startsWith('/admin/deliverables')) {
        return 'AdminDeliverables';
    }
    if (url.startsWith('/admin/submissions')) {
        return 'AdminSubmissions';
    }
    if (url.startsWith('/admin/vip-invitations')) {
        return 'VIPApprovals';
    }
    if (url.startsWith('/superadmin/control-room')) {
        return 'ControlRoom';
    }
    if (url.startsWith('/admin/notifications')) {
        return 'AdminNotifications';
    }
    if (url === '/partner/deliverables' || url === '/partner/deliverables/') {
        return 'PartnerDeliverables';
    }
    if (url === '/deliverables' || url === '/deliverables/') {
        return 'PartnerDeliverables';
    }
    
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Role detection helpers
function isSuperadmin(user) {
    if (!user) return false;
    // Check by UID or email
    if (user.id === SUPERADMIN.uid || user.email?.toLowerCase() === SUPERADMIN.email.toLowerCase()) {
        return true;
    }
    // Check by role
    return user.role === 'superadmin' || user.role === 'sef_admin' || user.is_super_admin === true;
}

function isAdmin(user) {
    if (!user) return false;
    // Superadmin is also admin
    if (isSuperadmin(user)) return true;
    // Check by role
    return user.role === 'admin' || user.is_admin === true;
}

function isPartner(user) {
    if (!user) return false;
    // Only return true if explicitly partner role (not admin/superadmin)
    return user.role === 'partner' || user.is_partner === true;
}

// Dev Mode Route Guard - redirects to /dev if no role selected
function DevModeRouteGuard({ children }) {
    const { role } = useDevRole();
    if (DEV_MODE && role === "unknown") {
        return <Navigate to="/dev" replace />;
    }
    return <>{children}</>;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const { user, session, role, loading } = useAuth();
    
    // Demo Mode routes - always accessible, no auth required
    // This route is checked first to ensure /demo is always reachable
    if (location.pathname.startsWith('/demo')) {
        return (
            <Routes>
                <Route path="/demo/*" element={<DemoRoutes />} />
            </Routes>
        );
    }
    
    // In Dev Mode, show dev selector at /dev and redirect / to /dev
    if (DEV_MODE) {
        return (
            <Routes>
                <Route path="/dev" element={<DevModeSelector />} />
                <Route path="/" element={<Navigate to="/dev" replace />} />
                <Route path="/Login" element={<Navigate to="/dev" replace />} />
                <Route path="*" element={
                    <DevModeRouteGuard>
                        <PagesContentAuthenticated />
                    </DevModeRouteGuard>
                } />
            </Routes>
        );
    }
    
    // TEMPORARY: Always show landing page or authenticated content
    // No auth blocking - allow all routes
    return (
        <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/Login" element={<Landing />} />
            <Route path="*" element={<PagesContentAuthenticated />} />
        </Routes>
    );
}

// Authenticated content (used in both dev and production mode)
function PagesContentAuthenticated() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const { role: appRole } = useAppRole();
    
    // TEMPORARY: Check if role is selected, if not redirect to landing
    // This allows role selection from landing page
    if (!appRole || appRole === 'unknown') {
        // Allow landing page and demo routes
        if (location.pathname === '/' || location.pathname.startsWith('/demo')) {
            return null; // Let the route render
        }
        // Redirect to landing for role selection
        return <Navigate to="/" replace />;
    }
    
    // Use selected role from landing page
    const userRole = appRole;
    const userIsSuperadmin = userRole === 'superadmin';
    const userIsAdmin = userRole === 'admin' || userIsSuperadmin;
    const userIsPartner = userRole === 'partner';
    
    return (
        <AuthGuard>
            <RouteGuard>
                <Layout currentPageName={currentPage}>
                    <Routes>
                        {/* Root route - redirect based on role */}
                        <Route path="/" element={
                            userIsSuperadmin 
                                ? <Navigate to="/Dashboard" replace />
                                : userIsAdmin
                                ? <Navigate to="/Dashboard" replace /> 
                                : userIsPartner
                                ? <Navigate to="/PartnerHub" replace />
                                : <Landing />
                        } />
                        <Route path="/Unauthorized" element={<Unauthorized />} />
                        
                        {/* ALL ROUTES ACCESSIBLE TO EVERYONE - NO ROLE RESTRICTIONS */}
                        {/* Partner Routes */}
                        <Route path="/partner/dashboard" element={<Dashboard />} />
                        <Route path="/partner/profile" element={<Profile />} />
                        <Route path="/partner/deliverables" element={<PartnerDeliverables />} />
                        <Route path="/Deliverables" element={<PartnerDeliverables />} />
                        <Route path="/deliverables" element={<PartnerDeliverables />} />
                        <Route path="/Nominations" element={<Nominations />} />
                        <Route path="/PartnerHub" element={<PartnerHub />} />
                        <Route path="/ExhibitorStand" element={<ExhibitorStand />} />
                        <Route path="/Contracts" element={<Contracts />} />
                        
                        {/* Shared Routes */}
                        <Route path="/Messages" element={<Messages />} />
                        <Route path="/support-chat" element={<PartnerMessages />} />
                        <Route path="/Documents" element={<Documents />} />
                        <Route path="/Training" element={<Training />} />
                        <Route path="/Support" element={<Support />} />
                        <Route path="/Profile" element={<Profile />} />
                        <Route path="/ActivityLog" element={<ActivityLog />} />
                        <Route path="/Settings" element={<Settings />} />
                        <Route path="/Tasks" element={<Tasks />} />
                        <Route path="/Notifications" element={<Notifications />} />
                        <Route path="/support" element={<PartnerSupport />} />
                        <Route path="/AccountManager" element={<AccountManager />} />
                        <Route path="/Resources" element={<Resources />} />
                        <Route path="/Passes" element={<Passes />} />
                        <Route path="/Opportunities" element={<Opportunities />} />
                        <Route path="/GettingStarted" element={<GettingStarted />} />
                        <Route path="/Venue" element={<Venue />} />
                        <Route path="/EventSchedule" element={<EventSchedule />} />
                        <Route path="/Timeline" element={<Timeline />} />
                        <Route path="/Chat" element={<Chat />} />
                        <Route path="/ImagineLab" element={<ImagineLab />} />
                        <Route path="/SocialMedia" element={<SocialMedia />} />
                        <Route path="/PressKit" element={<PressKit />} />
                        <Route path="/Benefits" element={<Benefits />} />
                        <Route path="/MediaTracker" element={<MediaTracker />} />
                        <Route path="/Calendar" element={<Calendar />} />
                        <Route path="/ApprovalReview" element={<ApprovalReview />} />
                        
                        {/* Admin Routes - ALL ACCESSIBLE */}
                        <Route path="/Dashboard" element={<Dashboard />} />
                        <Route path="/admin/dashboard" element={<Dashboard />} />
                        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/AdminPanel" element={<AdminPanel />} />
                        <Route path="/AdminRequirements" element={<AdminRequirements />} />
                        <Route path="/SuperAdminPanel" element={<SuperAdminPanel />} />
                        <Route path="/EmailInvitations" element={<EmailInvitations />} />
                        <Route path="/SendEmail" element={<SendEmail />} />
                        <Route path="/AdminApprovals" element={<AdminApprovals />} />
                        <Route path="/AdminReminders" element={<AdminReminders />} />
                        <Route path="/EmailTemplates" element={<EmailTemplates />} />
                        <Route path="/EmailTest" element={<EmailTest />} />
                        
                        {/* Admin Routes - nested under /admin */}
                        <Route path="/admin/*" element={
                            <Routes>
                                <Route path="partners" element={<AdminPartners />} />
                                <Route path="partners/new" element={<AddPartner />} />
                                <Route path="partners/:id/edit" element={<EditPartner />} />
                                <Route path="operations" element={<AdminOperations />} />
                                <Route path="deliverables" element={<AdminDeliverables />} />
                                <Route path="submissions" element={<AdminSubmissions />} />
                                <Route path="deliverables-review" element={<DeliverablesReview />} />
                                <Route path="review-nominations" element={<ReviewNominations />} />
                                <Route path="messages" element={<AdminMessages />} />
                                <Route path="vip-invitations" element={<VIPApprovals />} />
                                <Route path="booths" element={<AdminBooths />} />
                                <Route path="booths/:id" element={<AdminBoothDetails />} />
                                <Route path="control-room" element={<AdminControlRoom />} />
                                <Route path="notifications" element={<AdminNotifications />} />
                                <Route path="support" element={<AdminSupport />} />
                                <Route path="contracts" element={<AdminContracts />} />
                                <Route path="users" element={<AdminUsers />} />
                                <Route path="admin-partners" element={<AdminPartnersAssignment />} />
                                <Route path="invite-partner" element={<InvitePartner />} />
                                <Route path="approvals" element={<Approvals />} />
                            </Routes>
                        } />
                        
                        {/* Superadmin Routes */}
                        <Route path="/superadmin/*" element={
                            <Routes>
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="control-room" element={<ControlRoom />} />
                            </Routes>
                        } />
                    
                    <Route path="/PageNotFound" element={<PageNotFound />} />
                    <Route path="/Login" element={
                        userIsSuperadmin
                            ? <Navigate to="/admin/dashboard" replace /> 
                            : userIsPartner
                            ? <Navigate to="/partner/profile" replace />
                            : <Login />
                    } />
                    </Routes>
                </Layout>
            </RouteGuard>
        </AuthGuard>
    );
}

// SuperAdminPanelGuard - Only allows superadmin access, redirects if impersonating
function SuperAdminPanelGuard() {
    const { user, loading } = useAuth();
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const viewAsPartnerId = urlParams.get('viewAs');
    const isImpersonating = !!viewAsPartnerId;

    // Show loading while checking auth
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
                    <p className="text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    // No user - redirect to login
    if (!user) {
        return <Navigate to="/Login" state={{ from: location }} replace />;
    }

    // Check if user is superadmin using helper function
    const isSuperAdmin = isSuperadmin(user);

    // If impersonating, redirect to dashboard
    if (isImpersonating) {
        return <Navigate to="/dashboard" replace />;
    }

    // Superadmin access granted (or component will show access denied for non-superadmin)
    return <SuperAdminPanel />;
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
