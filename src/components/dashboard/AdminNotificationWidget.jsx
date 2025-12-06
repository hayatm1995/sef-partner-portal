import React from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  FileText,
  Award,
  Image as ImageIcon,
  Users,
  Briefcase,
  Trophy,
  Calendar as CalendarIcon,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminNotificationWidget() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;

  const { data: allPartners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: recentDeliverables = [], isLoading: deliverablesLoading } = useQuery({
    queryKey: ['recentDeliverables'],
    queryFn: async () => {
      const all = await base44.entities.Deliverable.list('-created_date', 10);
      return all;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  const { data: recentNominations = [], isLoading: nominationsLoading } = useQuery({
    queryKey: ['recentNominations'],
    queryFn: async () => {
      const all = await base44.entities.Nomination.list('-created_date', 10);
      return all;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const { data: recentMedia = [], isLoading: mediaLoading } = useQuery({
    queryKey: ['recentMediaBranding'],
    queryFn: async () => {
      const all = await base44.entities.MediaBranding.list('-upload_date', 10);
      return all;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const { data: recentMediaUsage = [], isLoading: usageLoading } = useQuery({
    queryKey: ['recentMediaUsage'],
    queryFn: async () => {
      const all = await base44.entities.MediaUsage.list('-upload_date', 10);
      return all;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const { data: recentWorkshops = [], isLoading: workshopsLoading } = useQuery({
    queryKey: ['recentWorkshops'],
    queryFn: async () => {
      const all = await base44.entities.WorkshopNomination.list('-created_date', 10);
      return all;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const { data: recentSpeakers = [], isLoading: speakersLoading } = useQuery({
    queryKey: ['recentSpeakers'],
    queryFn: async () => {
      const all = await base44.entities.SpeakerNomination.list('-created_date', 10);
      return all;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const { data: recentStartups = [], isLoading: startupsLoading } = useQuery({
    queryKey: ['recentStartups'],
    queryFn: async () => {
      const all = await base44.entities.StartupNomination.list('-created_date', 10);
      return all;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const { data: recentBookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['recentBookings'],
    queryFn: async () => {
      const all = await base44.entities.CalendarBooking.list('-created_date', 10);
      return all;
    },
    enabled: isAdmin,
    staleTime: 60 * 1000,
  });

  const getPartnerName = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.full_name || email;
  };

  const getPartnerCompany = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.company_name || '';
  };

  const formatTimeAgo = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return `Today, ${format(date, 'h:mm a')}`;
      } else if (isYesterday(date)) {
        return `Yesterday, ${format(date, 'h:mm a')}`;
      } else {
        return formatDistanceToNow(date, { addSuffix: true });
      }
    } catch (error) {
      return 'Recently';
    }
  };

  // Combine all recent activities
  const allActivities = [
    ...recentDeliverables.map(d => ({
      type: 'deliverable',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      title: d.title,
      partner: d.partner_email,
      date: d.created_date,
      status: d.status,
      link: createPageUrl("AdminPanel") + "?tab=deliverables"
    })),
    ...recentNominations.map(n => ({
      type: 'nomination',
      icon: Award,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      title: `${n.nomination_type}: ${n.nominee_name}`,
      partner: n.partner_email,
      date: n.created_date,
      status: n.status,
      link: createPageUrl("AdminPanel") + "?tab=nominations"
    })),
    ...recentMedia.map(m => ({
      type: 'media_branding',
      icon: ImageIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      title: `${m.file_type?.replace(/_/g, ' ') || 'File'}: ${m.file_name}`,
      partner: m.partner_email,
      date: m.upload_date,
      status: 'uploaded',
      link: createPageUrl("AdminPanel") + "?tab=media"
    })),
    ...recentMediaUsage.map(m => ({
      type: 'media_usage',
      icon: ImageIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      title: `Media upload: ${m.platform}`,
      partner: m.partner_email,
      date: m.upload_date,
      status: m.status,
      link: createPageUrl("MediaTracker")
    })),
    ...recentWorkshops.map(w => ({
      type: 'workshop',
      icon: Briefcase,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      title: `Workshop: ${w.workshop_title}`,
      partner: w.partner_email,
      date: w.created_date,
      status: w.status,
      link: createPageUrl("AdminPanel") + "?tab=workshops"
    })),
    ...recentSpeakers.map(s => ({
      type: 'speaker',
      icon: Users,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      title: `Speaker: ${s.speaker_name}`,
      partner: s.partner_email,
      date: s.created_date,
      status: s.status,
      link: createPageUrl("AdminPanel") + "?tab=speakers"
    })),
    ...recentStartups.map(s => ({
      type: 'startup',
      icon: Trophy,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      title: `Startup: ${s.startup_name}`,
      partner: s.partner_email,
      date: s.created_date,
      status: s.status,
      link: createPageUrl("AdminPanel") + "?tab=more"
    })),
    ...recentBookings.map(b => ({
      type: 'booking',
      icon: CalendarIcon,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      title: `Booking: ${b.title}`,
      partner: b.partner_email,
      date: b.created_date,
      status: b.status,
      link: createPageUrl("Calendar")
    }))
  ];

  // Sort by date (most recent first) and take top 20
  const sortedActivities = allActivities
    .sort((a, b) => {
      try {
        return new Date(b.date) - new Date(a.date);
      } catch {
        return 0;
      }
    })
    .slice(0, 20);

  // Count pending items
  const pendingCount = sortedActivities.filter(a => 
    a.status === 'pending_review' || 
    a.status === 'submitted' || 
    a.status === 'pending'
  ).length;

  const getStatusBadge = (status) => {
    const badges = {
      pending_review: { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
      submitted: { text: 'Submitted', color: 'bg-blue-100 text-blue-800' },
      pending: { text: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Approved', color: 'bg-green-100 text-green-800' },
      confirmed: { text: 'Confirmed', color: 'bg-green-100 text-green-800' },
      verified: { text: 'Verified', color: 'bg-green-100 text-green-800' },
      uploaded: { text: 'Uploaded', color: 'bg-blue-100 text-blue-800' },
      under_review: { text: 'Under Review', color: 'bg-purple-100 text-purple-800' },
      rejected: { text: 'Rejected', color: 'bg-red-100 text-red-800' },
      declined: { text: 'Declined', color: 'bg-red-100 text-red-800' }
    };
    return badges[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
  };

  const isLoading = partnersLoading || deliverablesLoading || nominationsLoading || 
                    mediaLoading || usageLoading || workshopsLoading || 
                    speakersLoading || startupsLoading || bookingsLoading;

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="border-orange-100 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-5 h-5 text-orange-600" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                  {pendingCount}
                </span>
              )}
            </div>
            Recent Partner Activity
          </CardTitle>
          {pendingCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {pendingCount} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            <span className="ml-3 text-gray-600">Loading activities...</span>
          </div>
        ) : sortedActivities.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {sortedActivities.map((activity, index) => {
                const Icon = activity.icon;
                const badge = getStatusBadge(activity.status);
                const isPending = activity.status === 'pending_review' || 
                                 activity.status === 'submitted' || 
                                 activity.status === 'pending';

                return (
                  <motion.div
                    key={`${activity.type}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.5) }}
                  >
                    <Link to={activity.link}>
                      <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
                        isPending 
                          ? 'border-orange-200 bg-orange-50 hover:border-orange-300' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.bgColor}`}>
                          <Icon className={`w-5 h-5 ${activity.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                              {activity.title}
                            </h4>
                            <Badge variant="outline" className={`${badge.color} text-xs flex-shrink-0`}>
                              {badge.text}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">{getPartnerName(activity.partner)}</span>
                              {getPartnerCompany(activity.partner) && (
                                <span className="text-gray-500 ml-1">
                                  • {getPartnerCompany(activity.partner)}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTimeAgo(activity.date)}
                            </p>
                          </div>
                        </div>

                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Activity</h3>
            <p className="text-gray-600">
              Partner submissions and uploads will appear here
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link to={createPageUrl("AdminPanel")}>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
              View All Submissions
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}