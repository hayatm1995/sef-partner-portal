import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { partnerUsersService, partnersService, adminPartnerMapService } from '@/services/supabaseService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, UserCog, Users, Loader2, CheckCircle2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminPartnersAssignment() {
  const { user, role, isSuperadmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
  const [initialPartnerIds, setInitialPartnerIds] = useState([]);
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);

  // Check if we're in dev environment
  const isDevMode = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // Only superadmin can access this page
  if (!isSuperadmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Superadmin access required.</p>
      </div>
    );
  }

  // Fetch all admins (role = 'admin')
  const { data: allAdmins = [], isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['allAdmins'],
    queryFn: async () => {
      try {
        const users = await partnerUsersService.getByRole('admin');
        return users || [];
      } catch (error) {
        console.error('Error fetching admins:', error);
        toast.error('Failed to load admins');
        return [];
      }
    },
  });

  // Fetch all partners (superadmin sees all, admin sees only assigned)
  const { data: allPartners = [], isLoading: isLoadingPartners } = useQuery({
    queryKey: ['allPartnersForAssignment', role],
    queryFn: async () => {
      try {
        // Superadmin sees all partners, no filtering needed
        const partners = await partnersService.getAll({
          role: 'superadmin', // Force superadmin view to see all
        });
        return partners || [];
      } catch (error) {
        console.error('Error fetching partners:', error);
        toast.error('Failed to load partners');
        return [];
      }
    },
    enabled: isSuperadmin, // Only fetch if superadmin
  });

  // Fetch assigned partners for all admins (to show in table)
  const { data: allAssignedPartners = [], isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['allAssignedPartners'],
    queryFn: async () => {
      if (allAdmins.length === 0) return [];
      const allAssignments = [];
      for (const admin of allAdmins) {
        if (admin.auth_user_id) {
          try {
            const assignments = await adminPartnerMapService.getAssignedPartners(admin.auth_user_id);
            allAssignments.push(...assignments.map((ap) => ({
              ...ap,
              admin_user_id: admin.auth_user_id,
              admin_id: admin.id,
            })));
          } catch (error) {
            console.error(`Error fetching assignments for admin ${admin.id}:`, error);
          }
        }
      }
      return allAssignments;
    },
    enabled: allAdmins.length > 0,
  });

  // Seed partners for testing (dev only)
  const seedPartnersMutation = useMutation({
    mutationFn: async () => {
      const seedPartners = [
        { name: 'Cisco', tier: 'Platinum', contract_status: 'Active' },
        { name: 'HSBC', tier: 'Gold', contract_status: 'Active' },
        { name: 'Aramco', tier: 'Platinum', contract_status: 'Active' },
        { name: 'Etisalat', tier: 'Gold', contract_status: 'Active' },
        { name: 'ADNOC', tier: 'Platinum', contract_status: 'Active' },
      ];

      const results = [];
      // First, get all existing partners to check for duplicates
      const allExisting = await partnersService.getAll({ role: 'superadmin' });
      
      for (const partner of seedPartners) {
        try {
          // Check if partner already exists by name
          const existing = allExisting.find(p => p.name === partner.name);
          
          if (existing) {
            // Update existing partner
            await partnersService.update(existing.id, partner);
            results.push({ ...partner, id: existing.id, action: 'updated' });
          } else {
            // Create new partner
            const created = await partnersService.create(partner);
            results.push({ ...partner, id: created.id, action: 'created' });
          }
        } catch (error) {
          console.error(`Error seeding partner ${partner.name}:`, error);
          // Continue with next partner even if one fails
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['allPartnersForAssignment'] });
      toast.success(`Seeded ${results.length} partners successfully`);
      setIsSeeding(false);
    },
    onError: (error) => {
      console.error('Error seeding partners:', error);
      toast.error('Failed to seed partners: ' + (error.message || 'Unknown error'));
      setIsSeeding(false);
    },
  });

  // Assign partners mutation
  const assignPartnersMutation = useMutation({
    mutationFn: async ({ adminUserId, partnerIds }) => {
      return await adminPartnerMapService.assignPartners(adminUserId, partnerIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedPartners'] });
      queryClient.invalidateQueries({ queryKey: ['allAssignedPartners'] });
      queryClient.invalidateQueries({ queryKey: ['allPartners'] });
      queryClient.invalidateQueries({ queryKey: ['allPartnersForAssignment'] });
      toast.success('Partners assigned successfully');
      setIsModalOpen(false);
      setSelectedAdmin(null);
      setSelectedPartnerIds([]);
      setInitialPartnerIds([]);
    },
    onError: (error) => {
      console.error('Error assigning partners:', error);
      toast.error('Failed to assign partners: ' + (error.message || 'Unknown error'));
    },
  });

  // Filter admins by search
  const filteredAdmins = useMemo(() => {
    return allAdmins.filter(admin =>
      admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allAdmins, searchQuery]);

  // Filter partners by search
  const filteredPartners = useMemo(() => {
    return allPartners.filter(partner =>
      partner.name?.toLowerCase().includes(partnerSearchQuery.toLowerCase()) ||
      partner.tier?.toLowerCase().includes(partnerSearchQuery.toLowerCase())
    );
  }, [allPartners, partnerSearchQuery]);

  // Check if there are changes
  const hasChanges = useMemo(() => {
    if (selectedPartnerIds.length !== initialPartnerIds.length) return true;
    const sortedSelected = [...selectedPartnerIds].sort();
    const sortedInitial = [...initialPartnerIds].sort();
    return JSON.stringify(sortedSelected) !== JSON.stringify(sortedInitial);
  }, [selectedPartnerIds, initialPartnerIds]);

  const handleOpenModal = async (admin) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
    setPartnerSearchQuery(''); // Reset search
    // Fetch assigned partners for this admin
    try {
      const assigned = await adminPartnerMapService.getAssignedPartners(admin.auth_user_id);
      const assignedIds = assigned.map((ap) => ap.partner_id);
      setSelectedPartnerIds(assignedIds);
      setInitialPartnerIds(assignedIds); // Store initial state
    } catch (error) {
      console.error('Error fetching assigned partners:', error);
      toast.error('Failed to load assigned partners');
      setSelectedPartnerIds([]);
      setInitialPartnerIds([]);
    }
  };

  const handleTogglePartner = (partnerId) => {
    setSelectedPartnerIds(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const handleSave = () => {
    if (!selectedAdmin?.auth_user_id) return;
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }
    assignPartnersMutation.mutate({
      adminUserId: selectedAdmin.auth_user_id,
      partnerIds: selectedPartnerIds,
    });
  };

  const handleSeedPartners = () => {
    if (!isDevMode) {
      toast.error('Seed functionality is only available in development mode');
      return;
    }
    setIsSeeding(true);
    seedPartnersMutation.mutate();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAdmin(null);
    setSelectedPartnerIds([]);
    setInitialPartnerIds([]);
    setPartnerSearchQuery('');
  };

  const isLoading = isLoadingAdmins || isLoadingPartners || isLoadingAssignments;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin-Partner Assignments</h1>
            <p className="text-gray-600">Assign partners to admins to scope their access</p>
          </div>
          {isDevMode && (
            <Button
              variant="outline"
              onClick={handleSeedPartners}
              disabled={isSeeding}
              className="border-blue-200 hover:bg-blue-50"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Seed Test Partners
                </>
              )}
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search admins by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle>Admins ({filteredAdmins.length})</CardTitle>
            <CardDescription>Click "Assign Partners" to manage partner assignments for each admin</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                <span className="ml-3 text-gray-600">Loading admins...</span>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No admins found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Assigned Partners</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdmins.map((admin) => {
                      const adminAssignedPartners = allAssignedPartners.filter(
                        (ap) => ap.admin_user_id === admin.auth_user_id
                      );
                      const partnerName = admin.partners?.name || 'N/A';

                      return (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">
                            {admin.full_name}
                          </TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{partnerName}</span>
                          </TableCell>
                          <TableCell>
                            {adminAssignedPartners.length > 0 ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {adminAssignedPartners.length} partner{adminAssignedPartners.length !== 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                                None
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenModal(admin)}
                              className="hover:bg-orange-50 hover:border-orange-200"
                            >
                              <UserCog className="w-4 h-4 mr-2" />
                              Assign Partners
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Partners Modal */}
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assign Partners to {selectedAdmin?.full_name}</DialogTitle>
              <DialogDescription>
                Select the partners this admin should have access to. Only assigned partners will be visible to this admin.
              </DialogDescription>
            </DialogHeader>

            {/* Partner Search */}
            <div className="mb-4">
              <Input
                placeholder="Search partners..."
                value={partnerSearchQuery}
                onChange={(e) => setPartnerSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Partner List */}
            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
              {isLoadingPartners ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  <span className="ml-3 text-gray-600">Loading partners...</span>
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No partners found</p>
                  {isDevMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSeedPartners}
                      disabled={isSeeding}
                      className="mt-4"
                    >
                      {isSeeding ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Seeding...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 mr-2" />
                          Seed Test Partners
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ) : (
                filteredPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => handleTogglePartner(partner.id)}
                  >
                    <Checkbox
                      checked={selectedPartnerIds.includes(partner.id)}
                      onCheckedChange={() => handleTogglePartner(partner.id)}
                    />
                    <Label className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-900">{partner.name}</p>
                        <p className="text-sm text-gray-500">{partner.tier || 'No tier'}</p>
                      </div>
                    </Label>
                    {selectedPartnerIds.includes(partner.id) && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                ))
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={assignPartnersMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={assignPartnersMutation.isPending || !hasChanges}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assignPartnersMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Assignments
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
