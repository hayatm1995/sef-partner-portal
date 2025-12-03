
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Search, UserPlus, Users, Shield, CheckCircle, Clock, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function EmailInvitations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Get all email activities
  const { data: emailActivities = [] } = useQuery({
    queryKey: ['emailInvitations'],
    queryFn: async () => {
      const activities = await base44.entities.ActivityLog.list('-created_date');
      // Include all email_sent activities AND user_created with partner_invitation
      return activities.filter(a => 
        a.activity_type === 'email_sent' || 
        (a.activity_type === 'user_created' && a.metadata?.email_type === 'partner_invitation')
      );
    },
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  // Get all users to cross-reference
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const filteredActivities = emailActivities.filter(activity => {
    const matchesSearch = 
      activity.target_user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.metadata?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.metadata?.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.metadata?.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || activity.metadata?.email_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const stats = {
    total: emailActivities.length,
    thisWeek: emailActivities.filter(a => {
      const date = new Date(a.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }).length,
    thisMonth: emailActivities.filter(a => {
      const date = new Date(a.created_date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }).length,
  };

  const emailTypeLabels = {
    partner_invitation: "Partner Invitation",
    login_reminder: "Login Reminder",
    team_member_invitation: "Team Member Invitation",
    team_member_login_reminder: "Team Member Login Reminder",
    admin_welcome: "Admin Welcome",
    admin_welcome_resend: "Admin Welcome (Resend)",
    bulk_email: "Bulk Email",
    // Add other email types here as needed
    unknown: "Unknown Type" // Fallback for types not explicitly listed
  };

  if (user?.role !== 'admin' && !user?.is_super_admin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Activity Tracker</h1>
          <p className="text-gray-600">Track all emails sent from the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Emails Sent</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <Mail className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-green-700">{stats.thisWeek}</p>
                </div>
                <Clock className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.thisMonth}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-blue-100">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search by email, company, subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="All Email Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Email Types</SelectItem>
                  <SelectItem value="partner_invitation">Partner Invitations</SelectItem>
                  <SelectItem value="login_reminder">Login Reminders</SelectItem>
                  <SelectItem value="team_member_invitation">Team Member Invitations</SelectItem>
                  <SelectItem value="admin_welcome">Admin Welcomes</SelectItem>
                  <SelectItem value="bulk_email">Bulk Emails</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Activity Table */}
        <Card className="border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Email History ({filteredActivities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredActivities.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Sent</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Sent By</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => {
                      const recipient = allUsers.find(u => u.email === activity.target_user_email);
                      const hasLoggedIn = recipient?.last_active;
                      const emailType = activity.metadata?.email_type || 'unknown';
                      
                      return (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">
                            {format(new Date(activity.created_date), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {emailTypeLabels[emailType] || emailTypeLabels.unknown}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{activity.target_user_email}</p>
                                {recipient && (
                                  <p className="text-xs text-gray-500">{recipient.full_name}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{activity.metadata?.subject || activity.description}</p>
                            {activity.metadata?.company_name && (
                              <p className="text-xs text-gray-500">{activity.metadata.company_name}</p>
                            )}
                            {activity.metadata?.partner_name && (
                              <p className="text-xs text-gray-500">{activity.metadata.partner_name}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {activity.user_email}
                          </TableCell>
                          <TableCell>
                            {hasLoggedIn ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Activated
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No emails found</h3>
                <p className="text-gray-600">
                  {searchQuery || filterType !== "all"
                    ? 'Try adjusting your search or filters'
                    : 'Email activity will appear here'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 border-blue-100 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Email Tracking</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>All emails sent from the platform are automatically tracked</li>
                  <li>View partner invitations, login reminders, team member invites, and bulk emails</li>
                  <li>"Activated" status means the recipient has logged in at least once</li>
                  <li>"Pending" status means they haven't logged in yet</li>
                  <li>Filter by email type to find specific communications</li>
                  <li>All email activity includes timestamps and sender information</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
