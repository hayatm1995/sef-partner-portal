/**
 * Partner Profile Modal
 * 
 * Opens when clicking a row in Operations table.
 * Shows:
 * - Deliverables table with Approve/Reject buttons
 * - Timeline of actions (from activity_log)
 * - Feature visibility toggles
 */

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliverablesService, activityLogService } from '@/services/supabaseService';
import { partnerFeaturesService } from '@/services/partnerFeaturesService';
import { partnersService } from '@/services/supabaseService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CheckCircle2, XCircle, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface PartnerProfileModalProps {
  partnerId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function PartnerProfileModal({ partnerId, open, onClose }: PartnerProfileModalProps) {
  const queryClient = useQueryClient();

  // Fetch partner data
  const { data: partner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: () => partnersService.getById(partnerId!),
    enabled: !!partnerId && open,
  });

  // Fetch deliverables for this partner
  const { data: deliverables = [] } = useQuery({
    queryKey: ['deliverables', partnerId],
    queryFn: () => deliverablesService.getByPartnerId(partnerId!),
    enabled: !!partnerId && open,
  });

  // Fetch all submissions for this partner's deliverables
  const { data: allSubmissions = [] } = useQuery({
    queryKey: ['partnerSubmissions', partnerId],
    queryFn: () => partnerSubmissionsService.getByPartnerId(partnerId!),
    enabled: !!partnerId && open,
  });

  // Fetch activity log for timeline
  const { data: activities = [] } = useQuery({
    queryKey: ['activityLog', partnerId],
    queryFn: async () => {
      const { data, error } = await activityLogService.getByPartnerId(partnerId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!partnerId && open,
  });

  // Fetch partner features
  const { data: partnerFeatures = [] } = useQuery({
    queryKey: ['partnerFeatures', partnerId],
    queryFn: () => partnerFeaturesService.getByPartnerId(partnerId!),
    enabled: !!partnerId && open,
  });

  // Create features map for easy lookup
  const featuresMap = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    partnerFeatures.forEach(f => {
      map[f.feature] = f.enabled;
    });
    // Default all to enabled if not set
    partnerFeaturesService.getDefaultFeatures().forEach(f => {
      if (!(f in map)) {
        map[f] = true;
      }
    });
    return map;
  }, [partnerFeatures]);

  // Update deliverable status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ deliverableId, status, notes }: { deliverableId: string; status: string; notes?: string }) => {
      // Update deliverable status via partner_submissions
      const submissions = allSubmissions.filter(s => s.deliverable_id === deliverableId);
      if (submissions && submissions.length > 0) {
        const latestSubmission = submissions.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        await partnerSubmissionsService.update(latestSubmission.id, {
          status,
          review_notes: notes,
          reviewed_at: new Date().toISOString(),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['deliverables', partnerId]);
      queryClient.invalidateQueries(['partnerSubmissions', partnerId]);
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Update feature mutation
  const updateFeatureMutation = useMutation({
    mutationFn: async ({ feature, enabled }: { feature: string; enabled: boolean }) => {
      await partnerFeaturesService.updateFeature(partnerId!, feature, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['partnerFeatures', partnerId]);
      toast.success('Feature visibility updated');
    },
    onError: (error: any) => {
      toast.error(`Failed to update feature: ${error.message}`);
    },
  });

  const handleApprove = (deliverableId: string) => {
    updateStatusMutation.mutate({ deliverableId, status: 'approved' });
  };

  const handleReject = (deliverableId: string, notes: string) => {
    updateStatusMutation.mutate({ deliverableId, status: 'rejected', notes });
  };

  if (!partnerId || !open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partner?.name || 'Partner Profile'}</DialogTitle>
          <DialogDescription>
            View deliverables, timeline, and manage feature visibility
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="deliverables" className="mt-4">
          <TabsList>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="features">Feature Visibility</TabsTrigger>
          </TabsList>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliverables.map((deliverable) => {
                  // Get latest submission for this deliverable
                  const deliverableSubmissions = allSubmissions.filter(s => s.deliverable_id === deliverable.id);
                  const latestSubmission = deliverableSubmissions.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )[0];
                  const status = latestSubmission?.status || deliverable.status || 'pending';

                  return (
                    <TableRow key={deliverable.id}>
                      <TableCell className="font-medium">{deliverable.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === 'approved' ? 'default' :
                            status === 'rejected' ? 'destructive' :
                            status === 'submitted' ? 'secondary' : 'outline'
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {latestSubmission?.submitted_at ? (
                          format(new Date(latestSubmission.submitted_at), 'MMM d, yyyy')
                        ) : (
                          <span className="text-gray-400">Not submitted</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {status === 'submitted' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApprove(deliverable.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const notes = prompt('Reason for rejection:');
                                  if (notes) {
                                    handleReject(deliverable.id, notes);
                                  }
                                }}
                                disabled={updateStatusMutation.isPending}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {status === 'approved' && (
                            <Badge variant="default" className="bg-green-100 text-green-700">
                              Approved
                            </Badge>
                          )}
                          {status === 'rejected' && (
                            <Badge variant="destructive">Rejected</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No activity recorded</p>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                      {activity.metadata && (
                        <pre className="text-xs text-gray-400 mt-2">
                          {JSON.stringify(activity.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Feature Visibility Tab */}
          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partnerFeaturesService.getDefaultFeatures().map((feature) => (
                <div key={feature} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base font-medium">
                      {partnerFeaturesService.getFeatureDisplayName(feature)}
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">{feature}</p>
                  </div>
                  <Switch
                    checked={featuresMap[feature] ?? true}
                    onCheckedChange={(checked) => {
                      updateFeatureMutation.mutate({ feature, enabled: checked });
                    }}
                    disabled={updateFeatureMutation.isPending}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

