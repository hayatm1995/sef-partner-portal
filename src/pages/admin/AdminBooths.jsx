import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { exhibitorStandsService, partnersService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, Building2, Loader2, ExternalLink, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminBooths() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningBooth, setAssigningBooth] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [allowOverride, setAllowOverride] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'sef_admin' || user?.is_super_admin;

  // Redirect if not admin
  React.useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/Dashboard");
    }
  }, [user, isAdmin, navigate]);

  // Fetch all booths with partner info
  const { data: booths = [], isLoading: boothsLoading } = useQuery({
    queryKey: ['adminBooths'],
    queryFn: async () => {
      const stands = await exhibitorStandsService.getAll();
      // The service already includes partners via join
      return stands;
    },
    enabled: isAdmin,
  });

  // Fetch partners for assignment
  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['adminPartnersForBooths'],
    queryFn: partnersService.getAll,
    enabled: isAdmin,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ boothId, partnerId }) => {
      const updates = {
        partner_id: partnerId || null,
        status: partnerId ? 'Assigned' : 'Assignment Pending',
        updated_at: new Date().toISOString(),
      };
      return exhibitorStandsService.update(boothId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooths'] });
      toast.success('Booth assignment saved');
      setAssigningBooth(null);
      setSelectedPartnerId("");
      setAllowOverride(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign partner');
    },
  });

  const openAssignDialog = (booth) => {
    setAssigningBooth(booth);
    setSelectedPartnerId(booth.partner_id || "");
    setAllowOverride(false);
  };

  const conflictingAssignment = useMemo(() => {
    if (!assigningBooth || !assigningBooth.booth_number) return null;
    return booths.find(
      (b) =>
        b.id !== assigningBooth.id &&
        b.booth_number === assigningBooth.booth_number &&
        b.partner_id
    );
  }, [assigningBooth, booths]);

  const handleAssignSave = () => {
    if (!assigningBooth) return;

    if (conflictingAssignment && !allowOverride) {
      toast.error('Booth already assigned. Enable override to proceed.');
      return;
    }

    assignMutation.mutate({
      boothId: assigningBooth.id,
      partnerId: selectedPartnerId || null,
    });
  };

  // Filter booths based on search
  const filteredBooths = useMemo(() => {
    if (!searchQuery.trim()) return booths;

    const query = searchQuery.toLowerCase();
    return booths.filter((booth) => {
      const partnerName = booth.partners?.name || 'Unassigned';
      const boothNumber = booth.booth_number || '';
      const status = booth.status || '';
      
      return (
        partnerName.toLowerCase().includes(query) ||
        boothNumber.toLowerCase().includes(query) ||
        status.toLowerCase().includes(query)
      );
    });
  }, [booths, searchQuery]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'Assignment Pending': { variant: 'secondary', className: 'bg-gray-100 text-gray-800' },
      'Pending': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      'Assigned': { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      'Approved': { variant: 'default', className: 'bg-green-100 text-green-800' },
      'Revisions Needed': { variant: 'destructive', className: 'bg-red-100 text-red-800' },
    };

    const statusConfig = statusMap[status] || statusMap['Assignment Pending'];
    
    return (
      <Badge className={statusConfig.className}>
        {status || 'Assignment Pending'}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumbs 
              items={[
                { label: 'Admin', href: '/admin/partners' },
                { label: 'Exhibitor Stands', href: '/admin/booths' },
              ]}
            />
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Exhibitor Stands Management</h1>
            <p className="text-gray-600 mt-1">Manage all booth assignments and artwork submissions</p>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by partner name, booth number, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Booths Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              All Booths ({filteredBooths.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {boothsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                <span className="ml-3 text-gray-600">Loading booths...</span>
              </div>
            ) : filteredBooths.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery ? 'No booths found matching your search.' : 'No booths found.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner Name</TableHead>
                      <TableHead>Booth Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBooths.map((booth) => (
                      <TableRow key={booth.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {booth.partners?.name || (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {booth.booth_number || (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booth.status)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(booth.updated_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAssignDialog(booth)}
                            >
                              Assign Partner
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/booths/${booth.id}`)}
                              className="gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!assigningBooth} onOpenChange={(open) => {
        if (!open) {
          setAssigningBooth(null);
          setSelectedPartnerId("");
          setAllowOverride(false);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Partner to Booth</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Booth Number</Label>
              <div className="mt-1 text-sm font-medium text-gray-900">
                {assigningBooth?.booth_number || '—'}
              </div>
            </div>
            <div>
              <Label className="text-sm">Partner</Label>
              <Select
                value={selectedPartnerId}
                onValueChange={setSelectedPartnerId}
                disabled={partnersLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select partner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {conflictingAssignment && (
              <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-sm space-y-2">
                <div className="font-semibold text-amber-900">
                  This booth number is already assigned to another partner.
                </div>
                <div className="text-amber-800">
                  Booth {assigningBooth?.booth_number} is currently assigned to {conflictingAssignment.partners?.name || 'another partner'}.
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allowOverride"
                    checked={allowOverride}
                    onCheckedChange={(val) => setAllowOverride(!!val)}
                  />
                  <Label htmlFor="allowOverride" className="text-sm text-amber-900">
                    Override and reassign
                  </Label>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setAssigningBooth(null);
                setSelectedPartnerId("");
                setAllowOverride(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignSave}
              disabled={assignMutation.isPending || (!allowOverride && !!conflictingAssignment)}
            >
              {assignMutation.isPending ? 'Saving...' : 'Save Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


