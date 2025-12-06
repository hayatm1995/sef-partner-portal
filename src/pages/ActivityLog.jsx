import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { activityLogService, deliverablesService, nominationsService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, FileText, Award, Calendar, Upload, Search, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

export default function ActivityLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const { user, partner } = useAuth();

  // Fetch activity logs from Supabase
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activityLogs', user?.partner_id],
    queryFn: async () => {
      if (user?.partner_id) {
        // TODO: Add getByPartnerId method to activityLogService if needed
        return activityLogService.getAll ? await activityLogService.getAll() : [];
      }
      return [];
    },
    enabled: !!user?.partner_id,
  });

  const { data: deliverables = [] } = useQuery({
    queryKey: ['userDeliverables', user?.partner_id],
    queryFn: async () => {
      if (user?.partner_id) {
        return deliverablesService.getAll(user.partner_id);
      }
      return [];
    },
    enabled: !!user?.partner_id,
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ['userNominations', user?.partner_id],
    queryFn: async () => {
      if (user?.partner_id) {
        return nominationsService.getAll(user.partner_id);
      }
      return [];
    },
    enabled: !!user?.partner_id,
  });

  // TODO: Calendar bookings migration to Supabase pending
  const bookings = [];

  // Combine all activities
  const activities = [
    ...deliverables.map(d => ({
      id: `deliverable-${d.id}`,
      type: 'deliverable',
      action: 'uploaded',
      title: d.title,
      date: new Date(d.created_date),
      status: d.status
    })),
    ...nominations.map(n => ({
      id: `nomination-${n.id}`,
      type: 'nomination',
      action: 'submitted',
      title: n.nominee_name,
      date: new Date(n.created_date),
      status: n.status
    })),
    ...bookings.map(b => ({
      id: `booking-${b.id}`,
      type: 'booking',
      action: 'booked',
      title: b.title,
      date: new Date(b.created_date),
      status: b.status
    }))
  ].sort((a, b) => b.date - a.date);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesType;
  });

  const getActivityIcon = (type) => {
    const icons = {
      deliverable: FileText,
      nomination: Award,
      booking: Calendar
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (type) => {
    const colors = {
      deliverable: 'from-blue-500 to-blue-600',
      nomination: 'from-purple-500 to-purple-600',
      booking: 'from-green-500 to-green-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  const getStatusColor = (status) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Activity Log</h1>
          <p className="text-gray-600">Track all your actions and submissions</p>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-orange-100">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="deliverable">Deliverables</SelectItem>
                  <SelectItem value="nomination">Nominations</SelectItem>
                  <SelectItem value="booking">Bookings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="border-orange-100 shadow-md">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredActivities.length > 0 ? (
              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all"
                    >
                      <div className={`p-3 bg-gradient-to-br ${getActivityColor(activity.type)} rounded-xl shadow-lg flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}{' '}
                              <span className="text-gray-600 capitalize">{activity.type}</span>
                            </p>
                            <p className="text-sm text-gray-600 truncate">{activity.title}</p>
                          </div>
                          <Badge variant="outline" className={getStatusColor(activity.status)}>
                            {activity.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {format(activity.date, 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-600">
                  {searchQuery || filterType !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Your activity history will appear here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}