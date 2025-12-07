/**
 * Operations Table Component
 * 
 * Displays partner operations overview with:
 * - Partner Name
 * - Progress % (based on deliverables completed)
 * - Last Submission Date
 * - Overdue Deliverables Count
 * - Assigned Admin (dropdown)
 * - Status Badge (Not Started / In Progress / Almost Done / Completed)
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersService, partnerProgressService, deliverablesService, partnerUsersService } from '@/services/supabaseService';
import { supabase } from '@/config/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Eye, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface OperationsTableProps {
  onPartnerClick: (partnerId: string) => void;
}

export default function OperationsTable({ onPartnerClick }: OperationsTableProps) {
  const queryClient = useQueryClient();
  const [assignedAdminUpdates, setAssignedAdminUpdates] = useState<Record<string, string>>({});

  // Fetch all partners
  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => partnersService.getAll(),
  });

  // Fetch all partner progress
  const { data: allProgress = [] } = useQuery({
    queryKey: ['allPartnerProgress'],
    queryFn: async () => {
      const progressData = [];
      for (const partner of partners) {
        try {
          const progress = await partnerProgressService.getByPartnerId(partner.id);
          progressData.push({ partnerId: partner.id, ...progress });
        } catch {
          progressData.push({ partnerId: partner.id, progress_percentage: 0 });
        }
      }
      return progressData;
    },
    enabled: partners.length > 0,
  });

  // Fetch all deliverables to calculate overdue
  const { data: allDeliverables = [] } = useQuery({
    queryKey: ['allDeliverables'],
    queryFn: () => deliverablesService.getAll(),
    enabled: isAdmin,
  });

  // Fetch all partner submissions to get last submission date
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['allPartnerSubmissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Fetch all admin users for assignment dropdown
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_users')
        .select('*')
        .in('role', ['admin', 'sef_admin', 'superadmin']);
      return data || [];
    },
    enabled: isAdmin,
  });

  // Update assigned admin mutation
  const updateAssignedAdminMutation = useMutation({
    mutationFn: async ({ partnerId, adminId }: { partnerId: string; adminId: string | null }) => {
      const { error } = await supabase
        .from('partners')
        .update({ assigned_account_manager_id: adminId })
        .eq('id', partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allPartners']);
      toast.success('Admin assigned successfully');
    },
    onError: (error) => {
      toast.error(`Failed to assign admin: ${error.message}`);
    },
  });

  // Calculate overdue deliverables for a partner
  const getOverdueCount = (partnerId: string): number => {
    const partnerDeliverables = allDeliverables.filter(d => d.partner_id === partnerId);
    const now = new Date();
    let overdueCount = 0;

    partnerDeliverables.forEach(deliverable => {
      if (deliverable.due_date) {
        const dueDate = new Date(deliverable.due_date);
        if (dueDate < now) {
          // Check if there's an approved submission
          const hasApprovedSubmission = allSubmissions.some(
            s => s.deliverable_id === deliverable.id && s.status === 'approved'
          );
          if (!hasApprovedSubmission) {
            overdueCount++;
          }
        }
      }
    });

    return overdueCount;
  };

  // Get last submission date for a partner
  const getLastSubmissionDate = (partnerId: string): Date | null => {
    const partnerDeliverables = allDeliverables
      .filter(d => d.partner_id === partnerId)
      .map(d => d.id);
    
    const partnerSubmissions = allSubmissions.filter(s => 
      partnerDeliverables.includes(s.deliverable_id)
    );

    if (partnerSubmissions.length === 0) return null;

    const latestSubmission = partnerSubmissions.sort((a, b) => 
      new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    )[0];

    return new Date(latestSubmission.submitted_at);
  };

  // Get status badge based on progress
  const getStatusBadge = (progress: number) => {
    if (progress === 0) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-700">Not Started</Badge>;
    } else if (progress < 30) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700">In Progress</Badge>;
    } else if (progress < 90) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Almost Done</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-700">Completed</Badge>;
    }
  };

  if (partnersLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Partner Name</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Last Submission</TableHead>
            <TableHead>Overdue</TableHead>
            <TableHead>Assigned Admin</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => {
            const progress = allProgress.find(p => p.partnerId === partner.id);
            const progressPercentage = progress?.progress_percentage || 0;
            const overdueCount = getOverdueCount(partner.id);
            const lastSubmissionDate = getLastSubmissionDate(partner.id);
            const assignedAdmin = adminUsers.find(a => a.id === partner.assigned_account_manager_id);

            return (
              <TableRow key={partner.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-600 transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{progressPercentage}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {lastSubmissionDate ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {format(lastSubmissionDate, 'MMM d, yyyy')}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No submissions</span>
                  )}
                </TableCell>
                <TableCell>
                  {overdueCount > 0 ? (
                    <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                      <AlertCircle className="w-3 h-3" />
                      {overdueCount}
                    </Badge>
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    value={assignedAdminUpdates[partner.id] || partner.assigned_account_manager_id || ''}
                    onValueChange={(value) => {
                      setAssignedAdminUpdates(prev => ({ ...prev, [partner.id]: value }));
                      updateAssignedAdminMutation.mutate({
                        partnerId: partner.id,
                        adminId: value || null,
                      });
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {adminUsers.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.full_name || admin.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{getStatusBadge(progressPercentage)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPartnerClick(partner.id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

