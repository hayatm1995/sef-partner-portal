import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { vipInvitationsService } from '@/services/vipInvitationsService';
import { partnersService } from '@/services/supabaseService';
import { supabase } from '@/config/supabase';
import { notifyPartnerStatusChange } from '@/components/notifications/VIPNotificationHelper';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export default function VIPApprovals() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [eventFilter, setEventFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectDialog, setRejectDialog] = useState({ open: false, invitation: null, reason: '' });

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // Redirect if not admin
  React.useEffect(() => {
    if (user && !isAdmin) {
      window.location.href = "/Dashboard";
    }
  }, [user, isAdmin]);

  // Fetch all invitations with filters
  const { data: allInvitations = [], isLoading } = useQuery({
    queryKey: ['allVIPInvitations', eventFilter, statusFilter],
    queryFn: () => {
      const filters = {};
      if (eventFilter !== 'all') filters.event_type = eventFilter;
      if (statusFilter !== 'all') filters.status = statusFilter;
      return vipInvitationsService.getAll(filters);
    },
    enabled: isAdmin,
  });

  // Fetch all partners for lookup (superadmin sees all, admin sees only assigned)
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners', role, user?.id],
    queryFn: () => partnersService.getAll({
      role: role || undefined,
      currentUserAuthId: user?.id || undefined,
    }),
    enabled: isAdmin,
  });

  const partnerMap = useMemo(() => {
    const map = {};
    allPartners.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [allPartners]);

  // Filter invitations by search query
  const filteredInvitations = useMemo(() => {
    let filtered = allInvitations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => {
        const partner = partnerMap[inv.partner_id];
        return (
          inv.full_name?.toLowerCase().includes(query) ||
          inv.email?.toLowerCase().includes(query) ||
          partner?.name?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [allInvitations, searchQuery, partnerMap]);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ invitationId, newStatus, rejectionReason }) => {
      const updates = { status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) {
        updates.rejection_reason = rejectionReason;
      }
      return vipInvitationsService.updateInvitation(invitationId, updates);
    },
    onSuccess: async (updatedInvitation) => {
      queryClient.invalidateQueries({ queryKey: ['allVIPInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['vipInvitations'] });
      
      // Notify partner
      const partner = partnerMap[updatedInvitation.partner_id];
      if (partner) {
        // Get partner email from partner_users table
        try {
          const { data: partnerUser } = await supabase
            .from('partner_users')
            .select('email')
            .eq('partner_id', updatedInvitation.partner_id)
            .limit(1)
            .single();
          
          const partnerEmail = partnerUser?.email || '';
          const oldStatus = allInvitations.find(inv => inv.id === updatedInvitation.id)?.status || 'submitted';
          
          if (partnerEmail) {
            try {
              await notifyPartnerStatusChange(
                partnerEmail,
                updatedInvitation.event_type,
                oldStatus,
                updatedInvitation.status
              );
            } catch (error) {
              console.error('Failed to send notification:', error);
              // Don't fail the update if notification fails
            }
          }
        } catch (error) {
          console.error('Failed to get partner email:', error);
        }
      }

      toast.success(`Status updated to ${updatedInvitation.status}`);
      setRejectDialog({ open: false, invitation: null, reason: '' });
    },
    onError: (error) => {
      toast.error('Failed to update status: ' + (error.message || 'Unknown error'));
    },
  });

  const handleStatusChange = (invitation, newStatus) => {
    if (newStatus === 'rejected') {
      setRejectDialog({ open: true, invitation, reason: '' });
    } else {
      updateStatusMutation.mutate({
        invitationId: invitation.id,
        newStatus,
        rejectionReason: null,
      });
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectDialog.invitation) return;
    if (!rejectDialog.reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    
    updateStatusMutation.mutate({
      invitationId: rejectDialog.invitation.id,
      newStatus: 'rejected',
      rejectionReason: rejectDialog.reason.trim(),
    });
  };

  const getStatusBadge = (status) => {
    const configs = {
      draft: { className: 'bg-gray-100 text-gray-800', label: 'Draft', icon: Edit },
      submitted: { className: 'bg-yellow-100 text-yellow-800', label: 'Submitted', icon: Clock },
      processing: { className: 'bg-blue-100 text-blue-800', label: 'Processing', icon: Loader2 },
      confirmed: { className: 'bg-green-100 text-green-800', label: 'Confirmed', icon: CheckCircle },
      rejected: { className: 'bg-red-100 text-red-800', label: 'Rejected', icon: XCircle },
    };
    const config = configs[status] || { className: 'bg-gray-100 text-gray-800', label: status, icon: AlertCircle };
    const Icon = config.icon;
    
    return (
      <Badge className={config.className} variant="outline">
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getEventName = (eventType) => {
    const names = {
      opening_ceremony: 'Opening Ceremony',
      sef_vault: 'SEF Vault',
      closing_ceremony: 'Closing Ceremony',
    };
    return names[eventType] || eventType;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Breadcrumbs 
            items={[
              { label: 'Admin', href: '/admin/partners' },
              { label: 'VIP Invitations', href: '/admin/vip-invitations' },
            ]}
          />
          <h1 className="text-3xl font-bold text-gray-900 mt-2">VIP Invitations – Approvals</h1>
          <p className="text-gray-600 mt-1">Review and manage partner guest list submissions</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by guest name, email, or partner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="opening_ceremony">Opening Ceremony</SelectItem>
                  <SelectItem value="sef_vault">SEF Vault</SelectItem>
                  <SelectItem value="closing_ceremony">Closing Ceremony</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setEventFilter('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invitations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Guest List Submissions ({filteredInvitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                <span className="ml-3 text-gray-600">Loading invitations...</span>
              </div>
            ) : filteredInvitations.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No invitations found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner Name</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Guest Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Invites</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvitations.map((invitation) => {
                      const partner = partnerMap[invitation.partner_id];
                      const canUpdate = ['submitted', 'processing'].includes(invitation.status);
                      
                      return (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            {partner?.name || 'Unknown Partner'}
                          </TableCell>
                          <TableCell>{getEventName(invitation.event_type)}</TableCell>
                          <TableCell>{invitation.full_name}</TableCell>
                          <TableCell>{invitation.email}</TableCell>
                          <TableCell>{invitation.invite_count}</TableCell>
                          <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                          <TableCell>
                            {invitation.rejection_reason ? (
                              <span className="text-red-600 text-sm">{invitation.rejection_reason}</span>
                            ) : invitation.notes ? (
                              <span className="text-gray-600 text-sm">{invitation.notes}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(invitation.updated_at || invitation.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            {canUpdate ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(invitation, 'processing')}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <Loader2 className="w-4 h-4 mr-1" />
                                  Processing
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(invitation, 'confirmed')}
                                  disabled={updateStatusMutation.isPending}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(invitation, 'rejected')}
                                  disabled={updateStatusMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
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

        {/* Rejection Dialog */}
        <Dialog open={rejectDialog.open} onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, invitation: null, reason: '' });
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <XCircle className="w-5 h-5" />
                Reject Invitation
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this invitation. This will be visible to the partner.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {rejectDialog.invitation && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">
                    Guest: {rejectDialog.invitation.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Event: {getEventName(rejectDialog.invitation.event_type)}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectDialog.reason}
                  onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                  placeholder="e.g., Invalid email format, exceeds allocation, duplicate entry..."
                  rows={4}
                  className="resize-none"
                  disabled={updateStatusMutation.isPending}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRejectDialog({ open: false, invitation: null, reason: '' })}
                disabled={updateStatusMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={updateStatusMutation.isPending || !rejectDialog.reason.trim()}
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

