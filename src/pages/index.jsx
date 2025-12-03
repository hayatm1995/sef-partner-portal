import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Deliverables from "./Deliverables";

import Nominations from "./Nominations";

import AdminPanel from "./AdminPanel";

import ManagePartners from "./ManagePartners";

import Calendar from "./Calendar";

import MediaTracker from "./MediaTracker";

import AdminAnalytics from "./AdminAnalytics";

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

import Venue from "./Venue";

import EventSchedule from "./EventSchedule";

import EmailInvitations from "./EmailInvitations";

import SendEmail from "./SendEmail";

import AdminApprovals from "./AdminApprovals";

import ApprovalReview from "./ApprovalReview";

import AdminReminders from "./AdminReminders";

import ExhibitorStand from "./ExhibitorStand";

import PageNotFound from "./PageNotFound";

import Timeline from "./Timeline";

import Chat from "./Chat";

import ImagineLab from "./ImagineLab";

import SocialMedia from "./SocialMedia";

import PressKit from "./PressKit";

import Benefits from "./Benefits";

import EmailTest from "./EmailTest";

import Contracts from "./Contracts";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Deliverables: Deliverables,
    
    Nominations: Nominations,
    
    AdminPanel: AdminPanel,
    
    ManagePartners: ManagePartners,
    
    Calendar: Calendar,
    
    MediaTracker: MediaTracker,
    
    AdminAnalytics: AdminAnalytics,
    
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
    
    ApprovalReview: ApprovalReview,
    
    AdminReminders: AdminReminders,
    
    ExhibitorStand: ExhibitorStand,
    
    PageNotFound: PageNotFound,
    
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
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Deliverables" element={<Deliverables />} />
                
                <Route path="/Nominations" element={<Nominations />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
                <Route path="/ManagePartners" element={<ManagePartners />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/MediaTracker" element={<MediaTracker />} />
                
                <Route path="/AdminAnalytics" element={<AdminAnalytics />} />
                
                <Route path="/PartnerHub" element={<PartnerHub />} />
                
                <Route path="/AdminRequirements" element={<AdminRequirements />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Documents" element={<Documents />} />
                
                <Route path="/Training" element={<Training />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/ActivityLog" element={<ActivityLog />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/AccountManager" element={<AccountManager />} />
                
                <Route path="/Resources" element={<Resources />} />
                
                <Route path="/Passes" element={<Passes />} />
                
                <Route path="/Opportunities" element={<Opportunities />} />
                
                <Route path="/GettingStarted" element={<GettingStarted />} />
                
                <Route path="/EmailTemplates" element={<EmailTemplates />} />
                
                <Route path="/SuperAdminPanel" element={<SuperAdminPanel />} />
                
                <Route path="/Venue" element={<Venue />} />
                
                <Route path="/EventSchedule" element={<EventSchedule />} />
                
                <Route path="/EmailInvitations" element={<EmailInvitations />} />
                
                <Route path="/SendEmail" element={<SendEmail />} />
                
                <Route path="/AdminApprovals" element={<AdminApprovals />} />
                
                <Route path="/ApprovalReview" element={<ApprovalReview />} />
                
                <Route path="/AdminReminders" element={<AdminReminders />} />
                
                <Route path="/ExhibitorStand" element={<ExhibitorStand />} />
                
                <Route path="/PageNotFound" element={<PageNotFound />} />
                
                <Route path="/Timeline" element={<Timeline />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/ImagineLab" element={<ImagineLab />} />
                
                <Route path="/SocialMedia" element={<SocialMedia />} />
                
                <Route path="/PressKit" element={<PressKit />} />
                
                <Route path="/Benefits" element={<Benefits />} />
                
                <Route path="/EmailTest" element={<EmailTest />} />
                
                <Route path="/Contracts" element={<Contracts />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}