import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsService } from "@/services/supabaseService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Bell, 
  CheckCircle, 
  Info, 
  AlertCircle, 
  AlertTriangle, 
  Filter, 
  RefreshCw,
  XCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsCenter() {
  const { user, currentPartnerId } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Fetch notifications for current partner
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return [];
      return notificationsService.getByPartnerId(currentPartnerId);
    },
    enabled: !!currentPartnerId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentPartnerId] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', currentPartnerId] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!currentPartnerId) return;
      await notificationsService.markAllAsRead(currentPartnerId);
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ['notifications', currentPartnerId] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', currentPartnerId] });
    },
  });

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;
    
    if (statusFilter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (statusFilter === 'read') {
      filtered = filtered.filter(n => n.read);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }
    
    return filtered;
  }, [notifications, statusFilter, typeFilter]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const actionRequiredCount = notifications.filter(n => n.type === 'action_required' && !n.read).length;

  const getTypeIcon = (type) => {
    const icons = {
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      error: XCircle,
      message: Bell,
      action_required: AlertCircle
    };
    return icons[type] || Info;
  };

  const getTypeColor = (type) => {
    const colors = {
      info: 'from-blue-500 to-blue-600',
      success: 'from-green-500 to-green-600',
      warning: 'from-yellow-500 to-yellow-600',
      error: 'from-red-500 to-red-600',
      message: 'from-purple-500 to-purple-600',
      action_required: 'from-red-500 to-rose-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      message: 'bg-purple-100 text-purple-800',
      action_required: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (!currentPartnerId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No partner associated with your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Action Required Banner */}
        {actionRequiredCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Action Required!</h3>
                  <p className="text-red-100 text-sm">
                    You have {actionRequiredCount} item(s) requiring your attention
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setTypeFilter('action_required')}
                className="bg-white text-red-600 hover:bg-red-50"
              >
                View Now
              </Button>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              Stay updated with important messages and updates
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-amber-600"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unread">Unread Only</SelectItem>
                    <SelectItem value="read">Read Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="action_required">Action Required</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== "all" || typeFilter !== "all") && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setStatusFilter("all"); setTypeFilter("all"); }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.map((notification) => {
                const Icon = getTypeIcon(notification.type);
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <Card className={`transition-all hover:shadow-lg ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200 opacity-70' 
                        : notification.type === 'action_required'
                          ? 'border-red-300 bg-gradient-to-r from-red-50 to-rose-50 shadow-md ring-1 ring-red-200'
                          : 'border-orange-200 bg-white'
                    }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 bg-gradient-to-br ${getTypeColor(notification.type)} rounded-xl shadow-lg flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-lg mb-1">{notification.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={getTypeBadgeColor(notification.type)}>
                                    {notification.type.replace('_', ' ')}
                                  </Badge>
                                  {notification.read && (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                                      Read
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  className="text-gray-600 hover:text-green-600"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Mark Read
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {statusFilter !== "all" || typeFilter !== "all"
                  ? "Try adjusting your filters"
                  : "You'll receive notifications here"}
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
