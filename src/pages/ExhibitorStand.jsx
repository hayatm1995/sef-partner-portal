import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Settings } from "lucide-react";

import AdminStandConfig from "../components/exhibitor/AdminStandConfig";
import AdminStandManager from "../components/exhibitor/AdminStandManager";
import PartnerStandView from "../components/exhibitor/PartnerStandView";

export default function ExhibitorStand() {
  const [showConfig, setShowConfig] = useState(false);
  const location = useLocation();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const urlParams = new URLSearchParams(location.search);
  const viewAsEmail = urlParams.get('viewAs');
  const effectivePartnerEmail = viewAsEmail || user?.email;
  const isAdmin = user?.role === 'admin' || user?.is_super_admin;
  const isSuperAdmin = user?.is_super_admin;
  const isAdminGlobalView = isAdmin && !viewAsEmail;

  // Fetch stands
  const { data: stands = [] } = useQuery({
    queryKey: ['exhibitorStands', effectivePartnerEmail, isAdminGlobalView],
    queryFn: async () => {
      if (isAdminGlobalView) {
        return await base44.entities.ExhibitorStand.list('-created_date');
      }
      return await base44.entities.ExhibitorStand.filter({ partner_email: effectivePartnerEmail });
    },
    enabled: !!effectivePartnerEmail || isAdminGlobalView,
  });

  // Fetch all partners for admin view
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdminGlobalView,
  });

  const currentStand = !isAdminGlobalView && stands.length > 0 ? stands[0] : null;

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

          {showConfig && (
            <AdminStandConfig onClose={() => setShowConfig(false)} />
          )}
        </div>
      </div>
    );
  }

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

        {currentStand ? (
          <PartnerStandView 
            currentStand={currentStand} 
            partnerEmail={effectivePartnerEmail}
            currentUser={user}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}