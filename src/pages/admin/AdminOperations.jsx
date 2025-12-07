import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { partnersService, partnerUsersService, deliverablesService, partnerFeaturesService } from "@/services/supabaseService";
import { supabase } from "@/config/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, Filter, TrendingUp, Clock, CheckCircle2, 
  AlertCircle, XCircle, Loader2, Building2, User
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminOperations() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAdminFilter, setSelectedAdminFilter] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState(null);

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Admin access required</p>
      </div>
    );
  }

  // Fetch all partners
  const { data: allPartners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => partnersService.getAll(),
    enabled: isAdmin,
  });

  // Fetch all admin users for filter dropdown
  const { data: allAdmins = [], isLoading: adminsLoading, error: adminsError } = useQuery({
    queryKey: ['allAdmins'],
    queryFn: async () => {
      try {
        console.log('[AdminOperations] Fetching admin users...');
        const { data, error } = await supabase
          .from('partner_users')
          .select('*')
          .in('role', ['admin', 'superadmin'])
          .order('full_name');
        
        if (error) {
          console.error('[AdminOperations] Error fetching admins:', error);
          throw error;
        }
        
        console.log('[AdminOperations] Fetched admins:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('[AdminOperations] Failed to fetch admins:', error);
        toast.error('Failed to load admin users: ' + error.message);
        return [];
      }
    },
    enabled: isAdmin,
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch operations data for each partner
  const { data: operationsData = [], isLoading: operationsLoading } = useQuery({
    queryKey: ['operationsData', allPartners.map(p => p.id)],
    queryFn: async () => {
      const operations = [];
      
      for (const partner of allPartners) {
        try {
          // Get deliverables for this partner
          const deliverables = await deliverablesService.getAll(partner.id);
          const completedDeliverables = deliverables.filter(d => d.status === 'approved' || d.status === 'completed');
          const totalDeliverables = deliverables.length;
          const progress = totalDeliverables > 0 
            ? Math.round((completedDeliverables.length / totalDeliverables) * 100)
            : 0;

          // Get last submission date
          const submissions = deliverables
            .filter(d => d.submitted_at)
            .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
          const lastSubmission = submissions.length > 0 ? submissions[0].submitted_at : null;

          // Count pending approvals
          const pendingApprovals = deliverables.filter(d => 
            d.status === 'submitted' || d.status === 'pending_review'
          ).length;

          // Get assigned admin (from partner.assigned_account_manager_id or partner_users)
          let assignedAdmin = null;
          if (partner.assigned_account_manager_id) {
            const adminUser = allAdmins.find(a => a.id === partner.assigned_account_manager_id);
            if (adminUser) {
              assignedAdmin = adminUser;
            }
          }

          // Determine status
          let status = 'Not Started';
          let statusColor = 'bg-gray-100 text-gray-800';
          if (progress === 100) {
            status = 'Completed';
            statusColor = 'bg-green-100 text-green-800';
          } else if (progress >= 75) {
            status = 'Almost Done';
            statusColor = 'bg-blue-100 text-blue-800';
          } else if (progress > 0) {
            status = 'In Progress';
            statusColor = 'bg-yellow-100 text-yellow-800';
          }

          operations.push({
            partnerId: partner.id,
            partnerName: partner.name,
            progress,
            lastSubmission,
            pendingApprovals,
            assignedAdmin,
            status,
            statusColor,
            totalDeliverables,
            completedDeliverables: completedDeliverables.length,
          });
        } catch (error) {
          console.error(`Error fetching operations for partner ${partner.id}:`, error);
          operations.push({
            partnerId: partner.id,
            partnerName: partner.name,
            progress: 0,
            lastSubmission: null,
            pendingApprovals: 0,
            assignedAdmin: null,
            status: 'Not Started',
            statusColor: 'bg-gray-100 text-gray-800',
            totalDeliverables: 0,
            completedDeliverables: 0,
          });
        }
      }
      
      return operations;
    },
    enabled: allPartners.length > 0 && isAdmin,
  });

  // Update assigned admin mutation
  const updateAssignedAdminMutation = useMutation({
    mutationFn: async ({ partnerId, adminId }) => {
      return partnersService.update(partnerId, {
        assigned_account_manager_id: adminId || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['operationsData']);
      queryClient.invalidateQueries(['allPartners']);
      toast.success('Assigned admin updated');
    },
    onError: (error) => {
      toast.error('Failed to update assigned admin: ' + error.message);
    },
  });

  // Filter operations data
  const filteredOperations = operationsData.filter(op => {
    const matchesSearch = op.partnerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAdmin = selectedAdminFilter === 'all' || 
      (selectedAdminFilter === 'unassigned' && !op.assignedAdmin) ||
      (op.assignedAdmin?.id === selectedAdminFilter);
    return matchesSearch && matchesAdmin;
  });

  const handleRowClick = (partnerId) => {
    navigate(`/admin/partners/${partnerId}`);
  };

  if (partnersLoading || operationsLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations Console</h1>
          <p className="text-gray-600 mt-1">Monitor partner progress and manage assignments</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search partners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <Select value={selectedAdminFilter} onValueChange={setSelectedAdminFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Admins</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {allAdmins.map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.full_name || admin.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Operations ({filteredOperations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Name</TableHead>
                  <TableHead>Assigned Admin</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Submission</TableHead>
                  <TableHead>Pending Approvals</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No partners found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOperations.map((op) => (
                    <TableRow 
                      key={op.partnerId}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(op.partnerId)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          {op.partnerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={op.assignedAdmin?.id || 'unassigned'}
                          onValueChange={(adminId) => {
                            updateAssignedAdminMutation.mutate({
                              partnerId: op.partnerId,
                              adminId: adminId === 'unassigned' ? null : adminId,
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {allAdmins.map(admin => (
                              <SelectItem key={admin.id} value={admin.id}>
                                {admin.full_name || admin.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={op.progress} className="w-24" />
                          <span className="text-sm font-medium">{op.progress}%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {op.completedDeliverables} / {op.totalDeliverables} completed
                        </p>
                      </TableCell>
                      <TableCell>
                        {op.lastSubmission ? (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {format(new Date(op.lastSubmission), 'MMM d, yyyy')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No submissions</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {op.pendingApprovals > 0 ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                            {op.pendingApprovals}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={op.statusColor}>
                          {op.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

