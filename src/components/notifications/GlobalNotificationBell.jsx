import React, { useState, useEffect } from "react";
import { notificationsService, partnerMessagesService, partnerSubmissionsService } from "@/services/supabaseService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, BellRing, AlertCircle, Info, Clock, CheckCircle, RefreshCw, ChevronRight, MessageSquare, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function GlobalNotificationBell({ partnerId, partnerEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'sef_admin' || user?.is_super_admin;

  const { data: notifications = [] } = useQuery({
    queryKey: ['unreadNotifications', partnerId],
    queryFn: async () => {
      if (partnerId) {
        return notificationsService.getByPartnerId(partnerId, true); // unread only
      }
      return [];
    },
    enabled: !!partnerId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { role, partnerId: currentUserPartnerId } = useAuth();

  // Get unread messages count (role-based filtering)
  const { data: unreadMessagesCount = 0 } = useQuery({
    queryKey: ['unreadMessagesCount', partnerId, role, currentUserPartnerId],
    queryFn: async () => {
      if (partnerId) {
        if (isAdmin) {
          return partnerMessagesService.getAdminUnreadCount({
            role: role || undefined,
            currentUserPartnerId: currentUserPartnerId || undefined,
          });
        } else {
          return partnerMessagesService.getUnreadCount(partnerId);
        }
      }
      return 0;
    },
    enabled: !!partnerId,
    refetchInterval: 30000,
  });

  // Get pending submissions count (for admins)
  const { data: pendingSubmissionsCount = 0 } = useQuery({
    queryKey: ['pendingSubmissionsCount'],
    queryFn: async () => {
      if (isAdmin) {
        try {
          const { data, error } = await partnerSubmissionsService.getAll();
          if (error) return 0;
          if (!data || !Array.isArray(data)) return 0;
          return data.filter(s => s.status === 'submitted' || s.status === 'pending_review').length || 0;
        } catch (error) {
          console.error('Error fetching pending submissions:', error);
          return 0;
        }
      }
      return 0;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Show toast when new notifications arrive
  useEffect(() => {
    if (notifications.length > lastNotificationCount && lastNotificationCount > 0) {
      const newCount = notifications.length - lastNotificationCount;
      const latestNotification = notifications[0];
      
      toast(latestNotification?.title || "New Notification", {
        description: latestNotification?.message?.substring(0, 100) || `You have ${newCount} new notification${newCount > 1 ? 's' : ''}`,
        action: {
          label: "View",
          onClick: () => setIsOpen(true),
        },
        icon: <BellRing className="w-4 h-4 text-orange-500" />,
      });
    }
    setLastNotificationCount(notifications.length);
  }, [notifications.length]);

  const getTypeIcon = (type, category) => {
    if (category === "reminders") return Clock;
    if (category === "updates") return RefreshCw;
    const icons = {
      info: Info,
      success: CheckCircle,
      warning: AlertCircle,
      action_required: AlertCircle
    };
    return icons[type] || Info;
  };

  const getTypeColor = (type, category) => {
    if (category === "reminders") return 'text-purple-500 bg-purple-100';
    if (category === "updates") return 'text-teal-500 bg-teal-100';
    const colors = {
      info: 'text-blue-500 bg-blue-100',
      success: 'text-green-500 bg-green-100',
      warning: 'text-yellow-500 bg-yellow-100',
      action_required: 'text-red-500 bg-red-100'
    };
    return colors[type] || 'text-gray-500 bg-gray-100';
  };

  const markAsRead = async (notificationId, e) => {
    e.preventDefault();
    e.stopPropagation();
    await notificationsService.markAsRead(notificationId);
    queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const totalUnread = notifications.length + unreadMessagesCount + pendingSubmissionsCount;
  const hasUnread = totalUnread > 0;
  const actionRequired = notifications.filter(n => n.type === 'action_required' || n.category === 'action_required').length + pendingSubmissionsCount;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-10 w-10 rounded-full transition-all duration-300 ${
            hasUnread 
              ? 'bg-orange-100 hover:bg-orange-200 text-orange-600' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <AnimatePresence mode="wait">
            {hasUnread ? (
              <motion.div
                key="bell-ring"
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0.8, rotate: 15 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <BellRing className="h-5 w-5" />
              </motion.div>
            ) : (
              <motion.div
                key="bell"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
              >
                <Bell className="h-5 w-5" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {hasUnread && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1"
            >
              <Badge 
                className={`h-5 min-w-5 flex items-center justify-center p-0 text-xs font-bold ${
                  actionRequired > 0 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {totalUnread > 99 ? '99+' : totalUnread}
              </Badge>
            </motion.div>
          )}
          
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-400 animate-ping opacity-75" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0 shadow-2xl border-orange-100" 
        align="end"
        sideOffset={8}
      >
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              <h3 className="font-bold text-lg">Notifications</h3>
            </div>
            {hasUnread && (
              <Badge className="bg-white/20 text-white border-white/30">
                {totalUnread} unread
              </Badge>
            )}
          </div>
          {actionRequired > 0 && (
            <p className="text-orange-100 text-sm mt-1">
              ⚠️ {actionRequired} action{actionRequired > 1 ? 's' : ''} required
            </p>
          )}
        </div>
        
        <ScrollArea className="max-h-80">
          {(notifications.length > 0 || unreadMessagesCount > 0 || pendingSubmissionsCount > 0) ? (
            <div className="divide-y divide-gray-100">
              {/* Unread Messages Section */}
              {unreadMessagesCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 hover:bg-orange-50 transition-colors cursor-pointer group"
                  onClick={() => {
                    setIsOpen(false);
                    if (isAdmin) {
                      // Navigate to partner messages or admin messages page
                      navigate('/admin/partners');
                    } else {
                      navigate(createPageUrl("Messages"));
                    }
                  }}
                >
                  <div className="flex gap-3">
                    <div className="p-2 rounded-lg text-blue-500 bg-blue-100 flex-shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">
                        {isAdmin ? 'Unread Partner Messages' : 'Unread Messages'}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {unreadMessagesCount} unread message{unreadMessagesCount > 1 ? 's' : ''} from {isAdmin ? 'partners' : 'admin'}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {unreadMessagesCount}
                    </Badge>
                  </div>
                </motion.div>
              )}

              {/* Pending Submissions Section (Admin only) */}
              {isAdmin && pendingSubmissionsCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 hover:bg-orange-50 transition-colors cursor-pointer group"
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/approvals');
                  }}
                >
                  <div className="flex gap-3">
                    <div className="p-2 rounded-lg text-orange-500 bg-orange-100 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">
                        Pending Submissions
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {pendingSubmissionsCount} submission{pendingSubmissionsCount > 1 ? 's' : ''} awaiting approval
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      {pendingSubmissionsCount}
                    </Badge>
                  </div>
                </motion.div>
              )}

              {/* Regular Notifications */}
              {notifications.slice(0, 5).map((notification) => {
                const Icon = getTypeIcon(notification.type, notification.category);
                const colorClass = getTypeColor(notification.type, notification.category);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 hover:bg-orange-50 transition-colors cursor-pointer group"
                    onClick={(e) => markAsRead(notification.id, e)}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-xs"
                        onClick={(e) => markAsRead(notification.id, e)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Read
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">All caught up!</p>
              <p className="text-gray-400 text-sm">No new notifications</p>
            </div>
          )}
        </ScrollArea>
        
        <div className="border-t p-3 bg-gray-50">
          <Link to={createPageUrl("Notifications")} onClick={() => setIsOpen(false)}>
            <Button variant="outline" className="w-full justify-between hover:bg-orange-50 hover:border-orange-200">
              <span>View All Notifications</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}