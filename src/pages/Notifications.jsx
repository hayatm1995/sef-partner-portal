import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Bell, 
  CheckCircle, 
  Info, 
  AlertCircle, 
  AlertTriangle, 
  Filter, 
  Clock, 
  Mail, 
  Settings,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "all", label: "All Categories", icon: Bell },
  { value: "action_required", label: "Action Required", icon: AlertCircle },
  { value: "information", label: "Information", icon: Info },
  { value: "reminders", label: "Reminders", icon: Clock },
  { value: "updates", label: "Updates", icon: RefreshCw },
];

export default function Notifications() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showPreferences, setShowPreferences] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Handle viewAs parameter for admins viewing as partners
  const urlParams = new URLSearchParams(location.search);
  const viewAsEmail = urlParams.get('viewAs');
  const isAdmin = user?.role === 'admin' || user?.is_super_admin;
  const effectiveEmail = (isAdmin && viewAsEmail) ? viewAsEmail : user?.email;

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', effectiveEmail],
    queryFn: () => base44.entities.StatusUpdate.filter({ partner_email: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  const { data: preferences } = useQuery({
    queryKey: ['notificationPreferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ partner_email: effectiveEmail });
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences?.id) {
        return base44.entities.NotificationPreference.update(preferences.id, data);
      } else {
        return base44.entities.NotificationPreference.create({ ...data, partner_email: effectiveEmail });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
      toast.success("Preferences saved!");
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.StatusUpdate.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => base44.entities.StatusUpdate.update(n.id, { read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success("All notifications marked as read");
    },
  });

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    const categoryMatch = categoryFilter === "all" || n.category === categoryFilter || 
      (categoryFilter === "action_required" && n.type === "action_required");
    const statusMatch = statusFilter === "all" || 
      (statusFilter === "unread" && !n.read) || 
      (statusFilter === "read" && n.read);
    return categoryMatch && statusMatch;
  });

  const unreadNotifications = notifications.filter(n => !n.read);

  // Category counts
  const categoryCounts = {
    action_required: notifications.filter(n => n.category === "action_required" || n.type === "action_required").length,
    information: notifications.filter(n => n.category === "information" || (!n.category && n.type === "info")).length,
    reminders: notifications.filter(n => n.category === "reminders").length,
    updates: notifications.filter(n => n.category === "updates" || (!n.category && n.type === "success")).length,
  };

  const getTypeIcon = (type, category) => {
    if (category === "reminders") return Clock;
    if (category === "updates") return RefreshCw;
    const icons = {
      info: Info,
      success: CheckCircle,
      warning: AlertTriangle,
      action_required: AlertCircle
    };
    return icons[type] || Info;
  };

  const getTypeColor = (type, category) => {
    if (category === "reminders") return 'from-purple-500 to-purple-600';
    if (category === "updates") return 'from-teal-500 to-teal-600';
    const colors = {
      info: 'from-blue-500 to-blue-600',
      success: 'from-green-500 to-green-600',
      warning: 'from-yellow-500 to-yellow-600',
      action_required: 'from-red-500 to-red-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getTypeBadgeColor = (type, category) => {
    if (category === "reminders") return 'bg-purple-100 text-purple-800';
    if (category === "updates") return 'bg-teal-100 text-teal-800';
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      action_required: 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryLabel = (category, type) => {
    if (category) return category.replace(/_/g, ' ');
    if (type === "action_required") return "Action Required";
    if (type === "info") return "Information";
    if (type === "success") return "Updates";
    return type?.replace(/_/g, ' ') || "General";
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Urgent Action Required Banner */}
        {notifications.filter(n => n.type === 'action_required' && !n.read).length > 0 && (
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
                    You have {notifications.filter(n => n.type === 'action_required' && !n.read).length} item(s) requiring your attention
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setCategoryFilter("action_required")}
                className="bg-white text-red-600 hover:bg-red-50"
              >
                View Now
              </Button>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              {isAdmin 
                ? "Admin alerts: new submissions, status changes, and action items" 
                : "Stay updated with important messages"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(!showPreferences)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Preferences
            </Button>
            {unreadNotifications.length > 0 && (
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
        </div>

        {/* Email Preferences Panel */}
        <AnimatePresence>
          {showPreferences && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-blue-200 bg-blue-50 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Email Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Email Digest Frequency</Label>
                      <Select
                        value={preferences?.email_digest || "instant"}
                        onValueChange={(value) => savePreferencesMutation.mutate({ email_digest: value })}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instant (Real-time)</SelectItem>
                          <SelectItem value="daily">Daily Digest</SelectItem>
                          <SelectItem value="weekly">Weekly Digest</SelectItem>
                          <SelectItem value="none">No Emails</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {preferences?.email_digest === "daily" && "Receive a daily summary at 9:00 AM"}
                        {preferences?.email_digest === "weekly" && "Receive a weekly summary every Monday"}
                        {preferences?.email_digest === "none" && "You won't receive email notifications"}
                        {(!preferences?.email_digest || preferences?.email_digest === "instant") && "Get notified immediately"}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-sm font-semibold block">Email by Category</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            Action Required
                          </Label>
                          <Switch
                            checked={preferences?.action_required_email !== false}
                            onCheckedChange={(checked) => savePreferencesMutation.mutate({ action_required_email: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-500" />
                            Information
                          </Label>
                          <Switch
                            checked={preferences?.information_email !== false}
                            onCheckedChange={(checked) => savePreferencesMutation.mutate({ information_email: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-500" />
                            Reminders
                          </Label>
                          <Switch
                            checked={preferences?.reminders_email !== false}
                            onCheckedChange={(checked) => savePreferencesMutation.mutate({ reminders_email: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-teal-500" />
                            Updates
                          </Label>
                          <Switch
                            checked={preferences?.updates_email !== false}
                            onCheckedChange={(checked) => savePreferencesMutation.mutate({ updates_email: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className={`cursor-pointer transition-all duration-300 ${
              categoryCounts.action_required > 0 
                ? 'border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg hover:shadow-xl ring-2 ring-red-200 ring-opacity-50' 
                : 'border-red-100 hover:shadow-md'
            }`} 
            onClick={() => setCategoryFilter("action_required")}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${categoryCounts.action_required > 0 ? 'bg-red-500 animate-pulse' : 'bg-red-100'}`}>
                  <AlertCircle className={`w-5 h-5 ${categoryCounts.action_required > 0 ? 'text-white' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Action Required</p>
                  <p className={`text-2xl font-bold ${categoryCounts.action_required > 0 ? 'text-red-600' : 'text-red-400'}`}>
                    {categoryCounts.action_required}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCategoryFilter("information")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Information</p>
                  <p className="text-xl font-bold text-blue-600">{categoryCounts.information}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCategoryFilter("reminders")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Reminders</p>
                  <p className="text-xl font-bold text-purple-600">{categoryCounts.reminders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-teal-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCategoryFilter("updates")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <RefreshCw className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">Updates</p>
                  <p className="text-xl font-bold text-teal-600">{categoryCounts.updates}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <cat.icon className="w-4 h-4" />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="read">Read Only</SelectItem>
            </SelectContent>
          </Select>

          {(categoryFilter !== "all" || statusFilter !== "all") && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => { setCategoryFilter("all"); setStatusFilter("all"); }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <Card className="border-orange-100 shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {categoryFilter !== "all" ? CATEGORIES.find(c => c.value === categoryFilter)?.label : "All Notifications"}
                {statusFilter !== "all" && ` (${statusFilter})`}
              </CardTitle>
              <Badge variant="outline" className="text-gray-600">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredNotifications.map((notification) => {
                    const Icon = getTypeIcon(notification.type, notification.category);
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className={`p-4 border-2 rounded-xl transition-all hover:shadow-lg ${
                          notification.read 
                            ? 'bg-gray-50 border-gray-200 opacity-70' 
                            : notification.type === 'action_required'
                              ? 'border-red-300 bg-gradient-to-r from-red-50 to-rose-50 shadow-md ring-1 ring-red-200'
                              : notification.priority === 'high'
                                ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md'
                                : 'border-orange-200 bg-orange-50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 bg-gradient-to-br ${getTypeColor(notification.type, notification.category)} rounded-xl shadow-lg flex-shrink-0`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-lg mb-1">{notification.title}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={getTypeBadgeColor(notification.type, notification.category)}>
                                    {getCategoryLabel(notification.category, notification.type)}
                                  </Badge>
                                  {notification.priority === "high" && (
                                    <Badge className="bg-red-500 text-white text-xs">High Priority</Badge>
                                  )}
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
                              {format(new Date(notification.created_date), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-12">
                {categoryFilter !== "all" || statusFilter !== "all" ? (
                  <>
                    <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching notifications</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your filters</p>
                    <Button 
                      variant="outline"
                      onClick={() => { setCategoryFilter("all"); setStatusFilter("all"); }}
                    >
                      Clear Filters
                    </Button>
                  </>
                ) : (
                  <>
                    <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
                    <p className="text-gray-600">You'll receive notifications here</p>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}