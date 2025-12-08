import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsService, partnersService } from "@/services/supabaseService";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Bell, Loader2, CheckCircle, Info, AlertCircle, AlertTriangle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function AdminNotifications() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // Fetch all notifications
  const { data: allNotifications = [], isLoading } = useQuery({
    queryKey: ['adminNotifications', partnerFilter, typeFilter, readFilter],
    queryFn: async () => {
      const filters = {};
      if (partnerFilter !== 'all') filters.partner_id = partnerFilter;
      if (typeFilter !== 'all') filters.type = typeFilter;
      if (readFilter !== 'all') filters.read = readFilter === 'read';
      return notificationsService.getAllForAdmin(filters);
    },
    enabled: isAdmin,
  });

  // Fetch partners for filter (superadmin sees all, admin sees only assigned)
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners', role, user?.id],
    queryFn: async () => partnersService.getAll({
      role: role || undefined,
      currentUserAuthId: user?.id || undefined,
    }),
    enabled: isAdmin,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      toast.success('Notification marked as read');
    },
  });

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    let filtered = allNotifications;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.title?.toLowerCase().includes(query) ||
        n.message?.toLowerCase().includes(query) ||
        n.partners?.name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [allNotifications, searchQuery]);

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

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Notifications</h1>
        <p className="text-gray-600">View and manage notifications across all partners</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by title, message, or partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={partnerFilter} onValueChange={setPartnerFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {allPartners.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
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
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Read Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => {
                    const Icon = getTypeIcon(notification.type);
                    return (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium">
                          {notification.partners?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{notification.title}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {notification.message}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getTypeBadgeColor(notification.type)}>
                            <Icon className="w-3 h-3 mr-1" />
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                        <TableCell>
                          {notification.read ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Read
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              Unread
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No notifications found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


