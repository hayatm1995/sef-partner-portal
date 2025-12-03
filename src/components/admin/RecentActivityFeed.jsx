import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  UserMinus,
  UserCog,
  Shield,
  ShieldOff,
  FileText,
  Award,
  Activity,
  LogIn,
  LogOut,
  Edit,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function RecentActivityFeed() {
  const { data: activities = [] } = useQuery({
    queryKey: ['recentActivities'],
    queryFn: async () => {
      const activities = await base44.entities.ActivityLog.list('-created_date', 50);
      return activities.slice(0, 50);
    },
  });

  const getActivityIcon = (type) => {
    const icons = {
      user_created: UserPlus,
      user_deleted: UserMinus,
      role_changed: UserCog,
      admin_promoted: Shield,
      admin_demoted: ShieldOff,
      profile_updated: Edit,
      login: LogIn,
      logout: LogOut,
      deliverable_submitted: FileText,
      nomination_submitted: Award,
      status_changed: CheckCircle
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (type) => {
    const colors = {
      user_created: "text-green-600 bg-green-50",
      user_deleted: "text-red-600 bg-red-50",
      role_changed: "text-blue-600 bg-blue-50",
      admin_promoted: "text-purple-600 bg-purple-50",
      admin_demoted: "text-orange-600 bg-orange-50",
      profile_updated: "text-cyan-600 bg-cyan-50",
      login: "text-emerald-600 bg-emerald-50",
      logout: "text-gray-600 bg-gray-50",
      deliverable_submitted: "text-indigo-600 bg-indigo-50",
      nomination_submitted: "text-pink-600 bg-pink-50",
      status_changed: "text-teal-600 bg-teal-50"
    };
    return colors[type] || "text-gray-600 bg-gray-50";
  };

  const getActivityBadge = (type) => {
    const badges = {
      user_created: { text: "Created", color: "bg-green-100 text-green-800" },
      user_deleted: { text: "Deleted", color: "bg-red-100 text-red-800" },
      role_changed: { text: "Role Change", color: "bg-blue-100 text-blue-800" },
      admin_promoted: { text: "Promoted", color: "bg-purple-100 text-purple-800" },
      admin_demoted: { text: "Demoted", color: "bg-orange-100 text-orange-800" },
      profile_updated: { text: "Updated", color: "bg-cyan-100 text-cyan-800" },
      login: { text: "Login", color: "bg-emerald-100 text-emerald-800" },
      logout: { text: "Logout", color: "bg-gray-100 text-gray-800" },
      deliverable_submitted: { text: "Deliverable", color: "bg-indigo-100 text-indigo-800" },
      nomination_submitted: { text: "Nomination", color: "bg-pink-100 text-pink-800" },
      status_changed: { text: "Status", color: "bg-teal-100 text-teal-800" }
    };
    return badges[type] || { text: "Activity", color: "bg-gray-100 text-gray-800" };
  };

  if (activities.length === 0) {
    return (
      <Card className="border-purple-100 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-100 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-600" />
          Recent Activity
          <Badge variant="secondary" className="ml-auto">{activities.length} events</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.activity_type);
              const colorClass = getActivityColor(activity.activity_type);
              const badge = getActivityBadge(activity.activity_type);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all bg-white"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {activity.description}
                      </p>
                      <Badge variant="outline" className={`${badge.color} text-xs flex-shrink-0`}>
                        {badge.text}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="font-medium">{activity.user_email}</span>
                      {activity.target_user_email && (
                        <>
                          <span>→</span>
                          <span>{activity.target_user_email}</span>
                        </>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(activity.created_date), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}