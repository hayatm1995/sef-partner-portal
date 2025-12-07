import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { exhibitorStandsService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, MapPin, Ruler, Package, Image as ImageIcon, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function BoothDashboard() {
  const { user, partner, partnerId } = useAuth();
  const queryClient = useQueryClient();
  const [buildOption, setBuildOption] = useState("");

  // Fetch booth for this partner
  const { data: booth, isLoading, error } = useQuery({
    queryKey: ['partnerBooth', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      const stands = await exhibitorStandsService.getAll(partnerId);
      return stands.length > 0 ? stands[0] : null;
    },
    enabled: !!partnerId,
  });

  // Update build option mutation
  const updateBuildOptionMutation = useMutation({
    mutationFn: async ({ boothId, buildOption: option }) => {
      return exhibitorStandsService.update(boothId, {
        build_option: option,
        updated_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerBooth', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['exhibitorStands'] });
      toast.success('Booth build option updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update build option: ' + error.message);
    },
  });

  // Set initial build option when booth loads
  React.useEffect(() => {
    if (booth && !buildOption) {
      setBuildOption(booth.build_option || 'sef_built');
    }
  }, [booth, buildOption]);

  // Don't show if no booth assigned
  if (!partnerId) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading booth information...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-12 text-center">
          <p className="text-red-600">Error loading booth information</p>
        </CardContent>
      </Card>
    );
  }

  if (!booth) {
    return null; // Don't show booth dashboard if no booth assigned
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'Assignment Pending': { label: 'Pending', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'Pending': { label: 'Pending', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'Assigned': { label: 'Assigned', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'Approved': { label: 'Confirmed', className: 'bg-green-100 text-green-800 border-green-200' },
      'Confirmed': { label: 'Confirmed', className: 'bg-green-100 text-green-800 border-green-200' },
      'Completed': { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-200' },
      'Revisions Needed': { label: 'Pending', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    };
    const config = statusMap[status] || statusMap['Pending'];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleSaveBuildOption = () => {
    if (!booth.id || !buildOption) return;
    updateBuildOptionMutation.mutate({
      boothId: booth.id,
      buildOption: buildOption,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Your Exhibitor Booth</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Booth details and build options</p>
              </div>
            </div>
            {getStatusBadge(booth.status)}
          </div>
        </CardHeader>
      </Card>

      {/* Booth Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-orange-600" />
              Booth Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600">Booth Number</Label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {booth.booth_number || 'Not assigned'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Size
              </Label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {booth.size_sqm ? `${booth.size_sqm} sqm` : 'Not specified'}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Booth Type
              </Label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {booth.booth_type === 'shell' ? 'Shell Booth' : 
                 booth.booth_type === 'raw' ? 'Raw Space' : 
                 'Not specified'}
              </p>
            </div>
            {(booth.map_url || booth.image_url) && (
              <div>
                <Label className="text-sm text-gray-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location Map
                </Label>
                <div className="mt-2">
                  {booth.map_url ? (
                    <a
                      href={booth.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 underline text-sm"
                    >
                      View Map
                    </a>
                  ) : booth.image_url ? (
                    <img
                      src={booth.image_url}
                      alt="Booth location"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                  ) : null}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Build Option Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Build Option</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Choose how your booth will be built
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={buildOption}
              onValueChange={setBuildOption}
              disabled={updateBuildOptionMutation.isPending}
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="sef_built" id="sef_built" />
                <Label htmlFor="sef_built" className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">SEF Build</div>
                    <div className="text-sm text-gray-600">
                      SEF will build and provide the standard booth
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="custom_build" id="custom_build" />
                <Label htmlFor="custom_build" className="flex-1 cursor-pointer">
                  <div>
                    <div className="font-medium">Self Build</div>
                    <div className="text-sm text-gray-600">
                      We will build our own custom booth
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
            <Button
              onClick={handleSaveBuildOption}
              disabled={updateBuildOptionMutation.isPending || buildOption === (booth.build_option || 'sef_built')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
            >
              {updateBuildOptionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Build Option
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin Comments */}
      {booth.admin_comments && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg">Admin Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-line">{booth.admin_comments}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

