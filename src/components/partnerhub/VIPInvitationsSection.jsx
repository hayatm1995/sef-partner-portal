import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Crown, Sparkles, Lock, AlertCircle, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { notifyAdminsGuestListSubmitted, checkAndNotifyLowAllocation } from "../notifications/VIPNotificationHelper";

export default function VIPInvitationsSection({ partnerEmail, isAdmin, showAllPartners }) {
  const [activeTab, setActiveTab] = useState("opening_ceremony");
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    event_type: "sef_vault",
    guest_list_url: "",
    invite_count: 0,
    special_requirements: ""
  });

  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', partnerEmail],
    queryFn: async () => {
      if (!partnerEmail || showAllPartners) return null;
      const profiles = await base44.entities.PartnerProfile.filter({ partner_email: partnerEmail });
      return profiles[0] || null;
    },
    enabled: !!partnerEmail && !showAllPartners
  });

  const { data: allInvitations = [] } = useQuery({
    queryKey: ['vipInvitations', partnerEmail, showAllPartners],
    queryFn: () => {
      if (showAllPartners) {
        return base44.entities.VIPInvitation.list('-created_date');
      }
      return base44.entities.VIPInvitation.filter({ partner_email: partnerEmail });
    },
    enabled: !!partnerEmail || showAllPartners,
  });

  const openingCeremonyInvitations = allInvitations.filter(inv => inv.event_type === 'opening_ceremony');
  const sefVaultInvitations = allInvitations.filter(inv => inv.event_type === 'sef_vault');
  const closingCeremonyInvitations = allInvitations.filter(inv => inv.event_type === 'closing_ceremony');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VIPInvitation.create({ ...data, partner_email: partnerEmail }),
    onSuccess: async (newInvitation) => {
      queryClient.invalidateQueries({ queryKey: ['vipInvitations'] });
      setIsAdding(false);
      
      // Notify admins about new submission
      try {
        await notifyAdminsGuestListSubmitted(partnerEmail, newInvitation.event_type, newInvitation.invite_count);
      } catch (err) {
        console.error("Failed to send admin notification:", err);
      }

      // Check and notify if allocation is running low
      try {
        const updatedInvitations = await base44.entities.VIPInvitation.filter({ partner_email: partnerEmail });
        await checkAndNotifyLowAllocation(partnerEmail, profile, updatedInvitations);
      } catch (err) {
        console.error("Failed to check allocation:", err);
      }

      setFormData({
        event_type: activeTab,
        guest_list_url: "",
        invite_count: 0,
        special_requirements: ""
      });
      toast.success("Guest list submitted successfully!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.VIPInvitation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipInvitations'] });
      toast.success("Invitation deleted");
    },
  });

  const handleFileUpload = async (file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, guest_list_url: file_url }));
      toast.success("File uploaded successfully!");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...formData, event_type: activeTab });
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border-green-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const openingAllocation = profile?.belong_plus_opening_ceremony_allocation || 0;
  const vaultAllocation = profile?.belong_plus_sef_vault_allocation || 0;
  const closingAllocation = profile?.belong_plus_closing_ceremony_allocation || 0;

  const openingUsed = openingCeremonyInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0);
  const vaultUsed = sefVaultInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0);
  const closingUsed = closingCeremonyInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0);

  const canAddOpening = openingUsed < openingAllocation;
  const canAddVault = vaultUsed < vaultAllocation;
  const canAddClosing = closingUsed < closingAllocation;

  const openingProgress = openingAllocation > 0 ? (openingUsed / openingAllocation) * 100 : 0;
  const vaultProgress = vaultAllocation > 0 ? (vaultUsed / vaultAllocation) * 100 : 0;
  const closingProgress = closingAllocation > 0 ? (closingUsed / closingAllocation) * 100 : 0;

  if (showAllPartners) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 mx-auto text-amber-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Admin View - All BELONG+ Invitations</h3>
            <p className="text-sm text-gray-600 mb-4">Viewing guest lists from all partners</p>
            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Opening Ceremony</p>
                <p className="text-3xl font-bold text-amber-600">{openingCeremonyInvitations.reduce((sum, inv) => sum + inv.invite_count, 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">SEF Vault</p>
                <p className="text-3xl font-bold text-amber-600">{sefVaultInvitations.reduce((sum, inv) => sum + inv.invite_count, 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Closing Ceremony</p>
                <p className="text-3xl font-bold text-amber-600">{closingCeremonyInvitations.reduce((sum, inv) => sum + inv.invite_count, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="opening_ceremony" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-amber-100 to-yellow-100">
            <TabsTrigger value="opening_ceremony" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Opening ({openingCeremonyInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="sef_vault" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              <Lock className="w-4 h-4 mr-2" />
              SEF Vault ({sefVaultInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="closing_ceremony" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white">
              <PartyPopper className="w-4 h-4 mr-2" />
              Closing ({closingCeremonyInvitations.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="opening_ceremony">
            <InvitationsList invitations={openingCeremonyInvitations} deleteMutation={deleteMutation} showPartnerEmail />
          </TabsContent>

          <TabsContent value="sef_vault">
            <InvitationsList invitations={sefVaultInvitations} deleteMutation={deleteMutation} showPartnerEmail />
          </TabsContent>

          <TabsContent value="closing_ceremony">
            <InvitationsList invitations={closingCeremonyInvitations} deleteMutation={deleteMutation} showPartnerEmail />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <motion.div 
                className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/40"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Crown className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <motion.h3 
                  className="text-3xl font-bold text-white mb-2 tracking-tight"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  BELONG<span className="text-amber-200">+</span>
                </motion.h3>
                <p className="text-amber-100 text-sm max-w-2xl leading-relaxed">
                  <span className="font-semibold">Experience exclusivity at its finest.</span> BELONG+ grants you access to our most prestigious events—where industry leaders, visionaries, and change-makers converge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
          <TabsTrigger 
            value="opening_ceremony"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Opening Ceremony
          </TabsTrigger>
          <TabsTrigger 
            value="sef_vault" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <Lock className="w-4 h-4 mr-2" />
            SEF Vault
          </TabsTrigger>
          <TabsTrigger 
            value="closing_ceremony"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
          >
            <PartyPopper className="w-4 h-4 mr-2" />
            Closing Ceremony
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opening_ceremony" className="space-y-6">
          <AllocationCard
            title="Opening Ceremony Allocation"
            allocation={openingAllocation}
            used={openingUsed}
            progress={openingProgress}
            icon={Sparkles}
          />

          {!canAddOpening && !isAdding && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Maximum Opening Ceremony allocation reached. Contact your account manager for more invites.
                </p>
              </CardContent>
            </Card>
          )}

          {canAddOpening && !isAdding && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsAdding(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all text-lg py-6 group"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                Submit Guest List for Opening Ceremony
              </Button>
            </motion.div>
          )}

          {isAdding && <GuestListForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} handleFileUpload={handleFileUpload} uploading={uploading} onCancel={() => setIsAdding(false)} isLoading={createMutation.isPending} eventName="Opening Ceremony" />}

          <InvitationsList invitations={openingCeremonyInvitations} deleteMutation={deleteMutation} />
        </TabsContent>

        <TabsContent value="sef_vault" className="space-y-6">
          <AllocationCard
            title="SEF Vault Allocation"
            allocation={vaultAllocation}
            used={vaultUsed}
            progress={vaultProgress}
            icon={Lock}
          />

          {!canAddVault && !isAdding && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Maximum SEF Vault allocation reached. Contact your account manager for more invites.
                </p>
              </CardContent>
            </Card>
          )}

          {canAddVault && !isAdding && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsAdding(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all text-lg py-6 group"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                Submit Guest List for SEF Vault
              </Button>
            </motion.div>
          )}

          {isAdding && <GuestListForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} handleFileUpload={handleFileUpload} uploading={uploading} onCancel={() => setIsAdding(false)} isLoading={createMutation.isPending} eventName="SEF Vault" />}

          <InvitationsList invitations={sefVaultInvitations} deleteMutation={deleteMutation} />
        </TabsContent>

        <TabsContent value="closing_ceremony" className="space-y-6">
          <AllocationCard
            title="Closing Ceremony Allocation"
            allocation={closingAllocation}
            used={closingUsed}
            progress={closingProgress}
            icon={PartyPopper}
          />

          {!canAddClosing && !isAdding && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Maximum Closing Ceremony allocation reached. Contact your account manager for more invites.
                </p>
              </CardContent>
            </Card>
          )}

          {canAddClosing && !isAdding && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsAdding(true)}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all text-lg py-6 group"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                Submit Guest List for Closing Ceremony
              </Button>
            </motion.div>
          )}

          {isAdding && <GuestListForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} handleFileUpload={handleFileUpload} uploading={uploading} onCancel={() => setIsAdding(false)} isLoading={createMutation.isPending} eventName="Closing Ceremony" />}

          <InvitationsList invitations={closingCeremonyInvitations} deleteMutation={deleteMutation} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AllocationCard({ title, allocation, used, progress, icon: Icon }) {
  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-600">Invites Used: {used} / {allocation}</p>
          </div>
        </div>
        <Progress value={progress} className="h-3 bg-amber-100" />
      </CardContent>
    </Card>
  );
}

function GuestListForm({ formData, setFormData, handleSubmit, handleFileUpload, uploading, onCancel, isLoading, eventName }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
    >
      <Card className="border-2 border-amber-300 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Submit Guest List - {eventName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-700 font-semibold">Guest List File *</Label>
              <Input
                type="file"
                accept=".xlsx,.xls,.csv,.pdf"
                onChange={(e) => handleFileUpload(e.target.files[0])}
                disabled={uploading}
                className="mt-2 border-amber-200 focus:border-amber-400"
              />
              {uploading && <p className="text-sm text-amber-600 mt-2 flex items-center gap-2"><Crown className="w-4 h-4 animate-pulse" /> Uploading...</p>}
              {formData.guest_list_url && (
                <p className="text-sm text-green-600 mt-2 flex items-center gap-2">✓ File uploaded successfully</p>
              )}
            </div>

            <div>
              <Label className="text-gray-700 font-semibold">Number of Invites *</Label>
              <Input
                type="number"
                value={formData.invite_count}
                onChange={(e) => setFormData(prev => ({ ...prev, invite_count: Number(e.target.value) }))}
                min="0"
                required
                className="mt-2 border-amber-200 focus:border-amber-400"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-semibold">Special Requirements</Label>
              <Input
                value={formData.special_requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, special_requirements: e.target.value }))}
                placeholder="e.g., Dietary restrictions, accessibility needs..."
                className="mt-2 border-amber-200 focus:border-amber-400"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-amber-200">
              <Button type="button" variant="outline" onClick={onCancel} className="border-amber-300">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.guest_list_url}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Submit Guest List
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InvitationsList({ invitations, deleteMutation, showPartnerEmail }) {
  if (invitations.length === 0) {
    return (
      <Card className="border-dashed border-2 border-amber-200 bg-amber-50/30">
        <CardContent className="p-12 text-center">
          <Crown className="w-16 h-16 mx-auto text-amber-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guest Lists Submitted Yet</h3>
          <p className="text-gray-600">Submit your exclusive guest list using the button above</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {invitations.map((invitation, index) => (
        <motion.div
          key={invitation.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                      {invitation.event_type === 'sef_vault' ? 'SEF Vault' : invitation.event_type === 'opening_ceremony' ? 'Opening Ceremony' : 'Closing Ceremony'}
                    </Badge>
                  </div>
                </div>
                {!showPartnerEmail && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(invitation.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {showPartnerEmail && (
                <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                  <p className="text-xs text-gray-600">Partner: {invitation.partner_email}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Invite Count</p>
                  <p className="text-3xl font-bold text-amber-600">{invitation.invite_count}</p>
                </div>

                <Badge className={getStatusColor(invitation.status)} variant="outline">
                  {invitation.status.replace(/_/g, ' ').toUpperCase()}
                </Badge>

                {invitation.special_requirements && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Special Requirements:</p>
                    <p className="text-sm text-gray-700">{invitation.special_requirements}</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => window.open(invitation.guest_list_url, '_blank')}
                >
                  View Guest List
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  function getStatusColor(status) {
    const colors = {
      submitted: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border-green-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }
}