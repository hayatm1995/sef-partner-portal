import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { exhibitorStandsService, boothArtworkService, partnersService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Building2, Loader2, ArrowLeft, ExternalLink, FileImage, MessageSquare
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import BoothChat from "@/components/ExhibitorStand/BoothChat";

export default function AdminBoothDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assignUpdating, setAssignUpdating] = useState(false);
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

  // Fetch booth details
  const { data: booth, isLoading: boothLoading } = useQuery({
    queryKey: ['adminBooth', id],
    queryFn: () => exhibitorStandsService.getById(id),
    enabled: !!id && isAdmin,
  });

  // Fetch artwork for this booth
  const { data: artwork = [], isLoading: artworkLoading } = useQuery({
    queryKey: ['boothArtwork', id],
    queryFn: () => boothArtworkService.getByBoothId(id),
    enabled: !!id && isAdmin,
  });

  // Fetch all booths (for conflict checks)
  const { data: allBooths = [] } = useQuery({
    queryKey: ['adminBoothsForAssignment'],
    queryFn: () => exhibitorStandsService.getAll(),
    enabled: isAdmin,
  });

  // Fetch partners list
  const { data: partners = [] } = useQuery({
    queryKey: ['adminPartnersForBoothDetail'],
    queryFn: () => partnersService.getAll(),
    enabled: isAdmin,
  });

  // Update booth status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      setStatusUpdating(true);
      try {
        const updated = await exhibitorStandsService.update(id, {
          status: newStatus,
          updated_at: new Date().toISOString(),
        });
        
        // Log activity
        if (booth?.partner_id) {
          try {
            const { activityLogService } = await import('@/services/supabaseService');
            await activityLogService.create({
              partner_id: booth.partner_id,
              user_id: user?.partner_user?.id || user?.id,
              activity_type: 'booth_status_updated',
              description: `Booth status updated to "${newStatus}"`,
              metadata: {
                booth_id: id,
                booth_number: booth.booth_number,
                old_status: booth.status,
                new_status: newStatus,
              }
            });
          } catch (error) {
            console.error('Failed to log activity:', error);
          }
        }
        
        return updated;
      } finally {
        setStatusUpdating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooth', id] });
      queryClient.invalidateQueries({ queryKey: ['adminBooths'] });
      queryClient.invalidateQueries({ queryKey: ['exhibitorStands'] });
      toast.success('Booth status updated successfully');
    },
    onError: (error) => {
      console.error('Status update error:', error);
      toast.error('Failed to update status: ' + (error.message || 'Unknown error'));
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async (partnerId) => {
      setAssignUpdating(true);
      try {
        return exhibitorStandsService.update(id, {
          partner_id: partnerId || null,
          status: partnerId ? 'Assigned' : 'Assignment Pending',
          updated_at: new Date().toISOString(),
        });
      } finally {
        setAssignUpdating(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBooth', id] });
      queryClient.invalidateQueries({ queryKey: ['adminBooths'] });
      queryClient.invalidateQueries({ queryKey: ['adminBoothsForAssignment'] });
      toast.success('Booth assignment updated');
    },
    onError: (error) => {
      console.error('Assignment update error:', error);
      toast.error('Failed to update assignment: ' + (error.message || 'Unknown error'));
    },
  });

  const conflictingAssignment = useMemo(() => {
    if (!booth?.booth_number) return null;
    return allBooths.find(
      (b) =>
        b.id !== booth.id &&
        b.booth_number === booth.booth_number &&
        b.partner_id
    );
  }, [allBooths, booth]);

  const handleAssignmentSave = () => {
    if (conflictingAssignment && !allowOverride) {
      toast.error('Booth already assigned. Enable override to proceed.');
      return;
    }
    updateAssignmentMutation.mutate(selectedPartnerId || booth.partner_id || "");
  };

  const handleStatusChange = (newStatus) => {
    updateStatusMutation.mutate(newStatus);
  };

  const getStatusBadge = (status) => {
    // Map database statuses to UI statuses with proper colors
    const statusMap = {
      'Assignment Pending': { label: 'Pending', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'Pending': { label: 'Pending', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'Assigned': { label: 'Assigned', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'Approved': { label: 'Confirmed', className: 'bg-green-100 text-green-800 border-green-200' },
      'Confirmed': { label: 'Confirmed', className: 'bg-green-100 text-green-800 border-green-200' },
      'Completed': { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
      'Revisions Needed': { label: 'Pending', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };

    const statusConfig = statusMap[status] || statusMap['Assignment Pending'];
    
    return (
      <Badge variant="outline" className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  if (!isAdmin) {
    return null; // Will redirect
  }

  if (boothLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booth details...</p>
        </div>
      </div>
    );
  }

  if (!booth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booth Not Found</h2>
              <p className="text-gray-600 mb-6">The booth you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/admin/booths')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Booths
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Breadcrumbs 
              items={[
                { label: 'Admin', href: '/admin/partners' },
                { label: 'Exhibitor Stands', href: '/admin/booths' },
                { label: booth.partners?.name || 'Booth Details', href: `/admin/booths/${id}` },
              ]}
            />
            <div className="flex items-center gap-4 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/booths')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">
                {booth.partners?.name || 'Unassigned Booth'}
              </h1>
            </div>
          </div>
        </div>

        {/* Booth Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Booth Information
              </CardTitle>
              {getStatusBadge(booth.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Partner Name</p>
                <p className="text-sm text-gray-900">
                  {booth.partners?.name || (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Booth Number</p>
                <p className="text-sm text-gray-900">
                  {booth.booth_number || (
                    <span className="text-gray-400">—</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Status</p>
                <Select
                  value={booth.status || 'Assignment Pending'}
                  onValueChange={handleStatusChange}
                  disabled={statusUpdating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assignment Pending">Pending</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="Approved">Confirmed</SelectItem>
                    <SelectItem value="Confirmed">Confirmed</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Revisions Needed">Revisions Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Last Updated</p>
                <p className="text-sm text-gray-600">{formatDate(booth.updated_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label className="text-sm">Assigned Partner</Label>
                <Select
                  value={selectedPartnerId || booth.partner_id || ""}
                  onValueChange={setSelectedPartnerId}
                  disabled={assignUpdating}
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
                {conflictingAssignment && (
                  <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-sm space-y-1">
                    <div className="font-semibold text-amber-900">
                      Booth already assigned to another partner.
                    </div>
                    <div className="text-amber-800">
                      Booth {booth.booth_number} is assigned to {conflictingAssignment.partners?.name || 'another partner'}.
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="overrideAssign"
                        checked={allowOverride}
                        onChange={(e) => setAllowOverride(e.target.checked)}
                      />
                      <Label htmlFor="overrideAssign" className="text-sm text-amber-900">
                        Override and reassign
                      </Label>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPartnerId("");
                      setAllowOverride(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAssignmentSave}
                    disabled={assignUpdating || (!allowOverride && !!conflictingAssignment)}
                  >
                    {assignUpdating ? 'Saving...' : 'Save Assignment'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Build Option</Label>
                <Select
                  value={booth.build_option || 'sef_built'}
                  onValueChange={(value) => {
                    exhibitorStandsService.update(id, {
                      build_option: value,
                      last_updated_by: user?.id,
                    }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ['adminBooth', id] });
                      toast.success('Build option updated');
                    }).catch((error) => {
                      toast.error(error.message || 'Failed to update build option');
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sef_built">SEF Builds Booth</SelectItem>
                    <SelectItem value="custom_build">Self-Build Booth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {booth.admin_comments && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Admin Comments</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                  {booth.admin_comments}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Artwork Submissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              Artwork Submissions ({artwork.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {artworkLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                <span className="ml-3 text-gray-600">Loading artwork...</span>
              </div>
            ) : artwork.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No artwork submissions yet
              </div>
            ) : (
              <div className="space-y-3">
                {artwork.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileImage className="w-5 h-5 text-orange-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.file_url.split('/').pop()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(item.file_url, '_blank')}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booth Chat */}
        <BoothChat boothId={id} />
      </div>
    </div>
  );
}


