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
import EditPartner from "./admin/EditPartner";
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
import AuthGuard from "@/components/auth/AuthGuard";
import RoleGuard from "@/components/auth/RoleGuard";
import RouteGuard from "@/components/auth/RouteGuard";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { SUPERADMIN } from "@/constants/users";
import NoPartnerProfileFound from "@/components/dashboard/NoPartnerProfileFound";

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

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const { user, session, role, loading } = useAuth();
    
    // CRITICAL: Show loading state until role is resolved
    // Don't render protected routes until we know the user's role
    if (loading || (session && !role)) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }
    
    // Show public pages if not authenticated
    if (!session && !user) {
        return (
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/Login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        );
    }
    
    // STRICT ROLE CHECKING - No fallback behavior
    // Use resolved role from context (already checked against database)
    const userRole = role;
    
    // Validate role is one of our allowed values (superadmin, admin, or partner)
    if (!userRole || !['superadmin', 'admin', 'partner'].includes(userRole)) {
        console.error('[PagesContent] Invalid role:', userRole);
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
                <NoPartnerProfileFound userEmail={user?.email} />
            </div>
        );
    }
    
    // Strict role checks - no fallback
    const userIsSuperadmin = userRole === 'superadmin';
    const userIsAdmin = userRole === 'admin' || userIsSuperadmin;
    const userIsPartner = userRole === 'partner';
    
    // If role is invalid, redirect to login
    if (!userIsSuperadmin && !userIsAdmin && !userIsPartner) {
        return <Navigate to="/Login" replace />;
    }
    
    return (
        <AuthGuard>
            <RouteGuard>
                <Layout currentPageName={currentPage}>
                    <Routes>
                        {/* Root route - redirect based on role */}
                        <Route path="/" element={
                            userIsSuperadmin 
                                ? <Navigate to="/superadmin/dashboard" replace />
                                : userIsAdmin
                                ? <Navigate to="/admin/dashboard" replace /> 
                                : userIsPartner
                                ? <Navigate to="/PartnerHub" replace />
                                : <Landing />
                        } />
                        <Route path="/Unauthorized" element={<Unauthorized />} />
                        
                        {/* Partner Routes - ONLY accessible to partners */}
                        {userIsPartner && (
                        <>
                            {/* Explicit Partner Routes */}
                            <Route path="/partner/dashboard" element={<Dashboard />} />
                            <Route path="/partner/profile" element={<Profile />} />
                            <Route path="/partner/deliverables" element={<PartnerDeliverables />} />
                            
                            {/* Legacy routes - redirect to new partner routes */}
                            <Route path="/Dashboard" element={<Navigate to="/PartnerHub" replace />} />
                            
                            {/* Legacy/Shared Routes */}
                            {/* Partner-only routes - only accessible when NOT viewing as admin */}
                            {userIsPartner && !userIsSuperadmin && (
                                <>
                                    <Route path="/Deliverables" element={<PartnerDeliverables />} />
                                    <Route path="/deliverables" element={<PartnerDeliverables />} />
                                </>
                            )}
                            
                            <Route path="/Nominations" element={<Nominations />} />
                            <Route path="/PartnerHub" element={<PartnerHub />} />
                            <Route path="/ExhibitorStand" element={<ExhibitorStand />} />
                            <Route path="/Contracts" element={<Contracts />} />
                        </>
                    )}
                    
                    {/* Shared Routes - accessible to both superadmin and partner */}
                    {(userIsPartner || userIsSuperadmin) && (
                        <>
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
                        </>
                    )}
                    
                    {/* Admin Routes - STRICT: Accessible to superadmin and admin */}
                    {(userIsSuperadmin || userIsAdmin) && (
                        <>
                            {/* Admin Dashboard Route - accessible to superadmin and admin */}
                            <Route path="/admin/dashboard" element={<Dashboard />} />
                            
                            {/* Redirect /admin to /admin/dashboard */}
                            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

                            <Route path="/AdminPanel" element={
                                <RoleGuard requireAdmin={true}>
                                    <AdminPanel />
                                </RoleGuard>
                            } />
                            <Route path="/AdminRequirements" element={
                                <RoleGuard requireAdmin={true}>
                                    <AdminRequirements />
                                </RoleGuard>
                            } />
                            <Route path="/SuperAdminPanel" element={<SuperAdminPanelGuard />} />
                            <Route path="/EmailInvitations" element={
                                <RoleGuard requireAdmin={true}>
                                    <EmailInvitations />
                                </RoleGuard>
                            } />
                            <Route path="/SendEmail" element={
                                <RoleGuard requireAdmin={true}>
                                    <SendEmail />
                                </RoleGuard>
                            } />
                            <Route path="/AdminApprovals" element={
                                <RoleGuard requireAdmin={true}>
                                    <AdminApprovals />
                                </RoleGuard>
                            } />
                            <Route path="/AdminReminders" element={
                                <RoleGuard requireAdmin={true}>
                                    <AdminReminders />
                                </RoleGuard>
                            } />
                            <Route path="/EmailTemplates" element={
                                <RoleGuard requireAdmin={true}>
                                    <EmailTemplates />
                                </RoleGuard>
                            } />
                            <Route path="/EmailTest" element={
                                <RoleGuard requireAdmin={true}>
                                    <EmailTest />
                                </RoleGuard>
                            } />
                            
                            {/* Admin Routes - nested under /admin */}
                            <Route path="/admin/*" element={
                                <RoleGuard requireAdmin={true}>
                                    <Routes>
                                        <Route path="partners" element={<AdminPartners />} />
                                        <Route path="partners/new" element={<EditPartner />} />
                                        <Route path="partners/:id/edit" element={<EditPartner />} />
                                        <Route path="operations" element={<AdminOperations />} />
                                        <Route path="deliverables" element={<AdminDeliverables />} />
                                        <Route path="submissions" element={<AdminSubmissions />} />
                                        
                                        {/* New Deliverables Review Route */}
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
                                        <Route path="invite-partner" element={<InvitePartner />} />
                                        <Route path="approvals" element={<Approvals />} />
                                    </Routes>
                                </RoleGuard>
                            } />
                        </>
                    )}
                    
                    {/* Superadmin Routes - require superadmin role */}
                    {userIsSuperadmin && (
                        <Route path="/superadmin/*" element={
                            <Routes>
                                <Route path="dashboard" element={<Dashboard />} />
                                <Route path="control-room" element={<ControlRoom />} />
                            </Routes>
                        } />
                    )}
                    
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
