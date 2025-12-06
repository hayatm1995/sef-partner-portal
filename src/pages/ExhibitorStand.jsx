import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { exhibitorStandsService, partnersService } from "@/services/supabaseService";
import { aiService } from "@/services/aiService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Settings } from "lucide-react";

import AdminStandConfig from "../components/exhibitor/AdminStandConfig";
import AdminStandManager from "../components/exhibitor/AdminStandManager";
import PartnerStandView from "../components/exhibitor/PartnerStandView";
import ArtworkUpload from "@/components/ExhibitorStand/ArtworkUpload";
import BoothChat from "@/components/ExhibitorStand/BoothChat";
import ExhibitorDeliverables from "@/components/exhibitor/ExhibitorDeliverables";
import AdminExhibitorDeliverables from "@/components/exhibitor/AdminExhibitorDeliverables";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ExhibitorStand() {
  const [showConfig, setShowConfig] = useState(false);
  const location = useLocation();
  const { user, partner } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const viewAsPartnerId = urlParams.get('viewAs');
  const currentPartnerId = viewAsPartnerId || partner?.id;
  const userRole = user?.role || 'viewer';
  const isAdmin = ['admin', 'sef_admin', 'superadmin'].includes(userRole) || user?.is_super_admin;
  const isSuperAdmin = userRole === 'sef_admin' || userRole === 'superadmin';
  const isAdminGlobalView = isAdmin && !viewAsPartnerId;

  // Fetch stands
  const { data: stands = [] } = useQuery({
    queryKey: ['exhibitorStands', currentPartnerId, isAdminGlobalView],
    queryFn: async () => {
      if (isAdminGlobalView) {
        return exhibitorStandsService.getAll();
      } else if (currentPartnerId) {
        return exhibitorStandsService.getAll(currentPartnerId);
      }
      return [];
    },
    enabled: !!user && (isAdminGlobalView || !!currentPartnerId),
  });

  // Fetch all partners for admin view
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => partnersService.getAll(),
    enabled: isAdminGlobalView,
  });

  const currentStand = !isAdminGlobalView && stands.length > 0 ? stands[0] : null;
  const queryClient = useQueryClient();
  const [aiCopy, setAiCopy] = useState("");

  // Mutation to update build option
  const updateBuildOptionMutation = useMutation({
    mutationFn: async ({ standId, buildOption }) => {
      return exhibitorStandsService.update(standId, { 
        build_option: buildOption,
        last_updated_by: user?.id 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exhibitorStands'] });
      toast.success('Booth build option updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update build option');
    },
  });

  const aiCopyMutation = useMutation({
    mutationFn: async () => {
      return aiService.generateBoothCopy({
        company: partner?.name,
        product: 'booth presence',
        tone: 'concise and welcoming',
      });
    },
    onSuccess: (copy) => {
      setAiCopy(copy);
      toast.success('Generated booth copy');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate copy');
    },
  });

  // Show message if partner data is not available (for non-admin users)
  if (!isAdmin && !partner && !viewAsPartnerId) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Partner Profile Not Found</h2>
          <p className="text-gray-600 mb-6">
            No partner profile found. Please contact the SEF team to set up your partner account.
          </p>
        </div>
      </div>
    );
  }

  if (isAdminGlobalView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Exhibitor Stands</h1>
                  <p className="text-blue-100 text-lg">Manage booth assignments & artwork</p>
                </div>
              </div>
              <Button
                onClick={() => setShowConfig(true)}
                variant="outline"
                className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25"
              >
                <Settings className="w-5 h-5 mr-2" />
                Configure
              </Button>
            </div>
          </div>

          <AdminStandManager 
            stands={stands} 
            allPartners={allPartners}
            onConfigClick={() => setShowConfig(true)}
            currentUser={user}
          />

          {/* Exhibitor Deliverables Review Section */}
          {stands.length > 0 && (
            <div className="mt-8 space-y-4">
              <h2 className="text-2xl font-bold">Exhibitor Deliverables Review</h2>
              {stands.map((stand) => {
                const partnerInfo = allPartners.find(p => p.id === stand.partner_id);
                return (
                  <div key={stand.id} className="mb-6">
                    <AdminExhibitorDeliverables
                      partnerId={stand.partner_id}
                      partnerName={partnerInfo?.name || 'Unknown Partner'}
                      booth={stand}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {showConfig && (
            <AdminStandConfig onClose={() => setShowConfig(false)} />
          )}
        </div>
      </div>
    );
  }

  // For partner view, show simplified Phase A UI
  if (!isAdminGlobalView && currentStand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Your Exhibitor Stand</h1>
                  <div className="flex items-center gap-3">
                    {currentStand.booth_number && (
                      <Badge className="bg-white/20 text-white border-white/30">
                        Booth {currentStand.booth_number}
                      </Badge>
                    )}
                    <Badge
                      className={
                        currentStand.status === 'Approved'
                          ? 'bg-green-500/20 text-white border-green-300/30'
                          : currentStand.status === 'Assigned'
                          ? 'bg-blue-500/20 text-white border-blue-300/30'
                          : 'bg-yellow-500/20 text-white border-yellow-300/30'
                      }
                    >
                      {currentStand.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booth Build Choice */}
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Booth Build Option</h3>
              <RadioGroup
                value={currentStand.build_option || 'sef_built'}
                onValueChange={(value) => {
                  updateBuildOptionMutation.mutate({
                    standId: currentStand.id,
                    buildOption: value,
                  });
                }}
                disabled={updateBuildOptionMutation.isPending}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="sef_built" id="sef_built" />
                  <Label htmlFor="sef_built" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">SEF Standard Booth</div>
                      <div className="text-sm text-gray-600">
                        SEF will build and provide the standard booth
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <RadioGroupItem value="custom_build" id="custom_build" />
                  <Label htmlFor="custom_build" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">Custom Booth</div>
                      <div className="text-sm text-gray-600">
                        We will build our own custom booth
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* AI Booth Copy Helper */}
          <Card className="border border-dashed border-orange-200 bg-orange-50/40">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Need booth copy?</h3>
                  <p className="text-sm text-gray-600">Generate a quick description for signage or emails.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => aiCopyMutation.mutate()}
                  disabled={aiCopyMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {aiCopyMutation.isPending ? 'Generating...' : 'Suggest copy'}
                </Button>
              </div>
              {aiCopy && (
                <div className="p-3 bg-white rounded border text-sm text-gray-800 whitespace-pre-line">
                  {aiCopy}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booth Details Card */}
          <Card className="border-orange-200">
            <CardContent className="p-6">
              <div className="space-y-2">
                {currentStand.booth_number && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Booth Number: </span>
                    <span className="text-sm text-gray-900">{currentStand.booth_number}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-semibold text-gray-700">Status: </span>
                  <Badge
                    variant="outline"
                    className={
                      currentStand.status === 'Approved'
                        ? 'border-green-500 text-green-700'
                        : currentStand.status === 'Assigned'
                        ? 'border-blue-500 text-blue-700'
                        : 'border-yellow-500 text-yellow-700'
                    }
                  >
                    {currentStand.status}
                  </Badge>
                </div>
                {currentStand.notes && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Notes: </span>
                    <p className="text-sm text-gray-600 mt-1">{currentStand.notes}</p>
                  </div>
                )}
                {currentStand.admin_comments && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Admin Comments: </span>
                    <p className="text-sm text-gray-600 mt-1">{currentStand.admin_comments}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Exhibitor Deliverables */}
          <ExhibitorDeliverables 
            booth={currentStand} 
            partnerId={currentPartnerId}
          />

          {/* Artwork Upload */}
          <ArtworkUpload boothId={currentStand.id} />

          {/* Booth Chat */}
          <BoothChat boothId={currentStand.id} />
        </div>
      </div>
    );
  }

  // Fallback for no stand assigned
  if (!isAdminGlobalView && !currentStand) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">Your Exhibitor Stand</h1>
                  <p className="text-orange-100 text-lg">Booth setup & artwork submission</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-2 border-dashed border-orange-300">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Stand Assignment Pending</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Your exhibitor stand is being set up. You'll be notified once your booth details are ready.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin view (keep existing)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Exhibitor Stands</h1>
                <p className="text-blue-100 text-lg">Manage booth assignments & artwork</p>
              </div>
            </div>
            <Button
              onClick={() => setShowConfig(true)}
              variant="outline"
              className="bg-white/15 backdrop-blur-md border-white/30 text-white hover:bg-white/25"
            >
              <Settings className="w-5 h-5 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        <AdminStandManager 
          stands={stands} 
          allPartners={allPartners}
          onConfigClick={() => setShowConfig(true)}
          currentUser={user}
        />

        {showConfig && (
          <AdminStandConfig onClose={() => setShowConfig(false)} />
        )}
      </div>
    </div>
  );
}