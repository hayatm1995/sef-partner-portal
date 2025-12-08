import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppRole } from "@/hooks/useAppRole";
import { supabase } from "@/config/supabase";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import OperationsTable from "@/components/admin/OperationsTable";
import PartnerProfileModal from "@/components/admin/PartnerProfileModal";

export default function AdminPartners() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role } = useAppRole();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [activeTab, setActiveTab] = useState("partners");

  // Use unified role hook - superadmin override always wins
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // NO ROLE RESTRICTIONS - Everyone can access

  // Fetch all partners - NO ROLE FILTERING
  const { data: partners = [], isLoading: partnersLoading, error: partnersError } = useQuery({
    queryKey: ['adminPartners'],
    queryFn: async () => {
      console.log('[AdminPartners] Fetching all partners (no role filtering)');
      
      try {
        // Always fetch all partners - no role checks
        const result = await partnersService.getAll();
        
        console.log('[AdminPartners] ✅ Fetched partners:', result?.length || 0);
        
        return result || [];
      } catch (error) {
        console.error('[AdminPartners] ❌ Error fetching partners:', error);
        return []; // Return empty array on error
      }
    },
    enabled: true, // Always enabled
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Enhanced debug logging
  React.useEffect(() => {
    const debugInfo = {
      role,
      isSuperAdmin,
      isAdmin,
      user: user?.email,
      userId: user?.id,
      partnersCount: partners.length,
      isLoading: partnersLoading,
      error: partnersError,
      queryEnabled: isAdmin && !!user,
      partnersList: partners.slice(0, 3).map(p => ({ id: p.id, name: p.name })), // First 3 partners
    };
    
    console.log('[AdminPartners] 📊 Debug Info:', debugInfo);
    
    // If superadmin but no partners, log warning
    if (isSuperAdmin && !partnersLoading && partners.length === 0 && !partnersError) {
      console.warn('[AdminPartners] ⚠️ WARNING: Superadmin but zero partners returned!', {
        role,
        userEmail: user?.email,
        queryEnabled: debugInfo.queryEnabled,
        error: partnersError
      });
    }
  }, [role, isSuperAdmin, isAdmin, user, partners.length, partnersLoading, partnersError]);

  // Fetch all partner users to calculate stats (role-based filtering)
  const { data: allPartnerUsers = [] } = useQuery({
    queryKey: ['allPartnerUsers', role, user?.id],
    queryFn: async () => {
      const { partnerUsersService } = await import('@/services/supabaseService');
      const partners = await partnersService.getAll({
        role: role || undefined,
        currentUserAuthId: user?.id || undefined,
      });
      const allUsers = [];
      for (const p of partners) {
        const users = await partnerUsersService.getByPartnerId(p.id);
        allUsers.push(...users);
      }
      return allUsers;
    },
    enabled: isAdmin,
  });

  // Fetch all deliverables for progress calculation (role-based filtering)
  const { data: allDeliverables = [] } = useQuery({
    queryKey: ['allDeliverables', role, user?.id],
    queryFn: async () => {
      return deliverablesService.getAll({
        role: role || undefined,
        currentUserAuthId: user?.id || undefined,
      });
    },
    enabled: isAdmin,
  });

  // Fetch all nominations for progress calculation (role-based filtering)
  const { data: allNominations = [] } = useQuery({
    queryKey: ['allNominations', role, user?.id],
    queryFn: async () => {
      return nominationsService.getAll({
        role: role || undefined,
        currentUserAuthId: user?.id || undefined,
      });
    },
    enabled: isAdmin,
  });

  // Fetch all partner progress from view
  const { data: allProgress = [] } = useQuery({
    queryKey: ['allPartnerProgress'],
    queryFn: async () => {
      return partnerProgressService.getAll();
    },
    enabled: isAdmin,
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

  // Filter partners by search query (name, email, domain, tier, account manager)
  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return partners;
    
    const query = searchQuery.toLowerCase();
    return partners.filter(partner => {
      const nameMatch = partner.name?.toLowerCase().includes(query);
      const tierMatch = partner.tier?.toLowerCase().includes(query);
      const statusMatch = partner.contract_status?.toLowerCase().includes(query);
      const managerMatch = partner.assigned_account_manager?.toLowerCase().includes(query);
      
      // Check partner users for email match
      const partnerUsers = allPartnerUsers.filter(u => u.partner_id === partner.id);
      const emailMatch = partnerUsers.some(u => u.email?.toLowerCase().includes(query));
      
      // Check domain (extract from email or website)
      const domainMatch = partnerUsers.some(u => {
        const email = u.email?.toLowerCase() || '';
        const domain = email.split('@')[1] || '';
        return domain.includes(query);
      }) || partner.website?.toLowerCase().includes(query);
      
      return nameMatch || tierMatch || statusMatch || managerMatch || emailMatch || domainMatch;
    });
  }, [partners, searchQuery, allPartnerUsers]);

  // Get partner user count
  const getPartnerUserCount = (partnerId) => {
    return allPartnerUsers.filter(u => u.partner_id === partnerId).length;
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
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
          <p className="text-gray-600 mt-1">
            {isSuperAdmin ? 'Manage all partners' : 'Manage assigned partners'} 
            {partners.length > 0 && ` (${partners.length} total)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['adminPartners'] });
              toast.info('Refreshing partners list...');
            }}
            disabled={partnersLoading}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {isSuperAdmin && (
            <Button onClick={() => navigate("/admin/partners/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add Partner
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="partners">Partners</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        {/* Partners Tab */}
        <TabsContent value="partners" className="mt-6">
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
          {partnersError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 font-semibold mb-2">Error loading partners</p>
              <p className="text-sm text-gray-600">{partnersError.message || 'Unknown error'}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['adminPartners'] })}
              >
                Retry
              </Button>
            </div>
          ) : partnersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              <span className="ml-3 text-gray-600">Loading partners...</span>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-semibold mb-2">No partners found</p>
              <p className="text-sm">
                {searchQuery ? 'Try adjusting your search query' : 
                 isSuperAdmin ? 'No partners in database' : 
                 'No partners assigned to you. Contact a superadmin to get assigned partners.'}
              </p>
              {isSuperAdmin && !searchQuery && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['adminPartners'] })}
                >
                  Refresh
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Account Manager</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Status</TableHead>
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
                        {partner.assigned_account_manager || "Unassigned"}
                      </TableCell>
                      <TableCell>
                        {partner.created_at 
                          ? new Date(partner.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })
                          : "N/A"}
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/partners/${partner.id}/edit`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            View / Edit
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
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Operations Console</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Monitor partner progress, overdue deliverables, and manage assignments
              </p>
            </CardHeader>
            <CardContent>
              <OperationsTable onPartnerClick={setSelectedPartnerId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Partner Profile Modal */}
      <PartnerProfileModal
        partnerId={selectedPartnerId}
        open={!!selectedPartnerId}
        onClose={() => setSelectedPartnerId(null)}
      />

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


