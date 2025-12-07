import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { partnersService, partnerUsersService, deliverablesService, nominationsService, partnerProgressService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Search, Edit, Trash2, Plus, Building2, Users, 
  TrendingUp, AlertCircle, Loader2 
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";

export default function AdminPartners() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerToDelete, setPartnerToDelete] = useState(null);

  // STRICT: Check if user is superadmin - use role from context
  const { role } = useAuth();
  const isSuperAdmin = role === 'superadmin';

  // Redirect if not superadmin
  React.useEffect(() => {
    if (user && !isSuperAdmin) {
      toast.error("Access denied. Superadmin only.");
      navigate("/Dashboard");
    }
  }, [user, isSuperAdmin, navigate]);

  // Fetch all partners
  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['adminPartners'],
    queryFn: async () => {
      return partnersService.getAll();
    },
    enabled: isSuperAdmin,
  });

  // Fetch all partner users to calculate stats
  const { data: allPartnerUsers = [] } = useQuery({
    queryKey: ['allPartnerUsers'],
    queryFn: async () => {
      const { partnerUsersService } = await import('@/services/supabaseService');
      const partners = await partnersService.getAll();
      const allUsers = [];
      for (const p of partners) {
        const users = await partnerUsersService.getByPartnerId(p.id);
        allUsers.push(...users);
      }
      return allUsers;
    },
    enabled: isSuperAdmin,
  });

  // Fetch all deliverables for progress calculation
  const { data: allDeliverables = [] } = useQuery({
    queryKey: ['allDeliverables'],
    queryFn: async () => {
      return deliverablesService.getAll();
    },
    enabled: isSuperAdmin,
  });

  // Fetch all nominations for progress calculation
  const { data: allNominations = [] } = useQuery({
    queryKey: ['allNominations'],
    queryFn: async () => {
      return nominationsService.getAll();
    },
    enabled: isSuperAdmin,
  });

  // Fetch all partner progress from view
  const { data: allProgress = [] } = useQuery({
    queryKey: ['allPartnerProgress'],
    queryFn: async () => {
      return partnerProgressService.getAll();
    },
    enabled: isSuperAdmin,
  });

  // Create a map of partner_id -> progress
  const progressMap = useMemo(() => {
    const map = {};
    if (Array.isArray(allProgress)) {
      allProgress.forEach(p => {
        map[p.partner_id] = p;
      });
    }
    return map;
  }, [allProgress]);

  // Get progress for a partner from view, fallback to 0
  const getPartnerProgress = (partnerId) => {
    const progress = progressMap[partnerId];
    return progress?.progress_percentage ?? 0;
  };

  // Delete partner mutation
  const deletePartnerMutation = useMutation({
    mutationFn: async (partnerId) => {
      await partnersService.delete(partnerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPartners']);
      queryClient.invalidateQueries(['allPartnerUsers']);
      toast.success("Partner deleted successfully");
      setPartnerToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete partner: ${error.message}`);
    },
  });

  // Filter partners by search query
  const filteredPartners = partners.filter(partner =>
    partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.tier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.contract_status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.assigned_account_manager?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get partner user count
  const getPartnerUserCount = (partnerId) => {
    return allPartnerUsers.filter(u => u.partner_id === partnerId).length;
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You need superadmin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/Dashboard" },
        { label: "Admin Partners", href: "/admin/partners" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Partner Management</h1>
          <p className="text-gray-600 mt-1">Manage all partners and their settings</p>
        </div>
        <Button onClick={() => navigate("/admin/partners/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Partners ({filteredPartners.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {partnersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No partners found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Contract Status</TableHead>
                  <TableHead>Account Manager</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.map((partner) => {
                  const progress = getPartnerProgress(partner.id);
                  const userCount = getPartnerUserCount(partner.id);
                  const progressData = progressMap[partner.id];
                  
                  return (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {partner.logo_url && (
                            <img 
                              src={partner.logo_url} 
                              alt={partner.name}
                              className="w-8 h-8 rounded object-contain"
                            />
                          )}
                          <span>{partner.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{partner.tier || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            partner.contract_status === 'Signed' ? 'default' :
                            partner.contract_status === 'In Review' ? 'secondary' :
                            'outline'
                          }
                        >
                          {partner.contract_status || "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {partner.assigned_account_manager || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{userCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                progress >= 75 ? 'bg-green-500' :
                                progress >= 50 ? 'bg-yellow-500' :
                                'bg-orange-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{progress}%</span>
                        </div>
                        {progressData && (
                          <p className="text-xs text-gray-500 mt-1">
                            {progressData.approved_submissions ?? 0} / {progressData.total_deliverables ?? 0} completed
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/partners/${partner.id}/edit`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setPartnerToDelete(partner)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!partnerToDelete} onOpenChange={() => setPartnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{partnerToDelete?.name}</strong>? 
              This action cannot be undone and will delete all associated data including users, deliverables, and nominations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePartnerMutation.mutate(partnerToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePartnerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


