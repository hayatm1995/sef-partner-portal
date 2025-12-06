import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { vipInvitationsService } from "@/services/vipInvitationsService";
import { partnersService } from "@/services/supabaseService";
import { supabase } from "@/config/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Crown, Sparkles, Lock, AlertCircle, PartyPopper, Edit, Send, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { notifyAdminsGuestListSubmitted, checkAndNotifyLowAllocation } from "../notifications/VIPNotificationHelper";
import { format } from "date-fns";

export default function VIPInvitationsSection({ partnerEmail, isAdmin, showAllPartners }) {
  const { user, partner } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("opening_ceremony");
  const [isAdding, setIsAdding] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    invite_count: 1,
  });

  // Get current partner ID (handles admin view-as functionality)
  const urlParams = new URLSearchParams(location.search);
  const viewAsPartnerId = urlParams.get('viewAs');
  const currentPartnerId = viewAsPartnerId || partner?.id;

  // Fetch partner data with allocations
  const { data: currentPartner, isLoading: loadingPartner } = useQuery({
    queryKey: ['partner', currentPartnerId],
    queryFn: async () => {
      if (!currentPartnerId) return null;
      try {
        return await partnersService.getById(currentPartnerId);
      } catch (error) {
        console.error('Error fetching partner:', error);
        return partner;
      }
    },
    enabled: !!currentPartnerId && !showAllPartners,
    initialData: partner,
    staleTime: 30000,
  });

  // Fetch invitations
  const { data: allInvitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['vipInvitations', currentPartnerId, showAllPartners],
    queryFn: async () => {
      if (showAllPartners) {
        return vipInvitationsService.getAll();
      }
      if (!currentPartnerId) return [];
      return vipInvitationsService.getByPartner(currentPartnerId);
    },
    enabled: !!currentPartnerId || showAllPartners,
  });

  // Calculate allocations and usage
  const allocations = useMemo(() => {
    if (showAllPartners) return { opening: 0, vault: 0, closing: 0 };
    const opening = currentPartner?.belong_plus_opening_ceremony_allocation || 0;
    const vault = currentPartner?.belong_plus_sef_vault_allocation || 0;
    const closing = currentPartner?.belong_plus_closing_ceremony_allocation || 0;
    return { opening, vault, closing };
  }, [currentPartner, showAllPartners]);

  const usage = useMemo(() => {
    const openingUsed = allInvitations
      .filter(inv => inv.event_type === 'opening_ceremony' && inv.status !== 'draft' && inv.status !== 'rejected')
      .reduce((sum, inv) => sum + (inv.invite_count || 0), 0);
    
    const vaultUsed = allInvitations
      .filter(inv => inv.event_type === 'sef_vault' && inv.status !== 'draft' && inv.status !== 'rejected')
      .reduce((sum, inv) => sum + (inv.invite_count || 0), 0);
    
    const closingUsed = allInvitations
      .filter(inv => inv.event_type === 'closing_ceremony' && inv.status !== 'draft' && inv.status !== 'rejected')
      .reduce((sum, inv) => sum + (inv.invite_count || 0), 0);

    return { opening: openingUsed, vault: vaultUsed, closing: closingUsed };
  }, [allInvitations]);

  const remaining = useMemo(() => {
    return {
      opening: Math.max(0, allocations.opening - usage.opening),
      vault: Math.max(0, allocations.vault - usage.vault),
      closing: Math.max(0, allocations.closing - usage.closing),
    };
  }, [allocations, usage]);

  const openingCeremonyInvitations = allInvitations.filter(inv => inv.event_type === 'opening_ceremony');
  const sefVaultInvitations = allInvitations.filter(inv => inv.event_type === 'sef_vault');
  const closingCeremonyInvitations = allInvitations.filter(inv => inv.event_type === 'closing_ceremony');

  // Create invitation mutation
  const createMutation = useMutation({
    mutationFn: (data) => {
      if (!currentPartnerId) throw new Error('No partner ID');
      return vipInvitationsService.createInvitation({
        ...data,
        partner_id: currentPartnerId,
        event_type: activeTab,
        status: 'draft',
      });
    },
    onSuccess: async (newInvitation) => {
      queryClient.invalidateQueries({ queryKey: ['vipInvitations', currentPartnerId] });
      setIsAdding(false);
      setFormData({ full_name: '', email: '', phone: '', invite_count: 1 });
      toast.success("Guest added successfully!");
    },
    onError: (error) => {
      toast.error('Failed to add guest: ' + (error.message || 'Unknown error'));
    },
  });

  // Update invitation mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => vipInvitationsService.updateInvitation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipInvitations', currentPartnerId] });
      setEditingInvitation(null);
      setFormData({ full_name: '', email: '', phone: '', invite_count: 1 });
      toast.success("Guest updated successfully!");
    },
    onError: (error) => {
      toast.error('Failed to update guest: ' + (error.message || 'Unknown error'));
    },
  });

  // Delete invitation mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => vipInvitationsService.deleteInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipInvitations', currentPartnerId] });
      toast.success("Guest removed successfully");
    },
    onError: (error) => {
      toast.error('Failed to remove guest: ' + (error.message || 'Unknown error'));
    },
  });

  // Submit drafts mutation
  const submitMutation = useMutation({
    mutationFn: async (eventType) => {
      if (!currentPartnerId) throw new Error('No partner ID');
      
      // Validate total invites don't exceed allocation
      const eventAllocations = {
        opening_ceremony: allocations.opening,
        sef_vault: allocations.vault,
        closing_ceremony: allocations.closing,
      };
      
      const allocation = eventAllocations[eventType] || 0;
      const draftInvitations = allInvitations.filter(
        inv => inv.event_type === eventType && inv.status === 'draft'
      );
      const totalDraftInvites = draftInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0);
      const currentUsed = usage[eventType === 'opening_ceremony' ? 'opening' : eventType === 'sef_vault' ? 'vault' : 'closing'];
      
      if (currentUsed + totalDraftInvites > allocation) {
        throw new Error(`Total invites (${currentUsed + totalDraftInvites}) exceed allocation (${allocation}) for this event`);
      }

      // Submit drafts
      const submitted = await vipInvitationsService.submitDrafts(currentPartnerId, eventType);
      
      // Notify admins
      const partnerEmailForNotification = user?.email || user?.partner_user?.email || '';
      const totalInvites = draftInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0);
      
      if (partnerEmailForNotification) {
        try {
          await notifyAdminsGuestListSubmitted(partnerEmailForNotification, eventType, totalInvites);
        } catch (error) {
          console.error('Failed to send notification:', error);
        }
      }

      return submitted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipInvitations', currentPartnerId] });
      toast.success('Guest list submitted for review');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit guest list');
    },
  });

  const handleAddClick = () => {
    setEditingInvitation(null);
    setFormData({ full_name: '', email: '', phone: '', invite_count: 1 });
    setIsAdding(true);
  };

  const handleEditClick = (invitation) => {
    if (invitation.status !== 'draft') {
      toast.error('Only draft invitations can be edited');
      return;
    }
    setEditingInvitation(invitation);
    setFormData({
      full_name: invitation.full_name,
      email: invitation.email,
      phone: invitation.phone || '',
      invite_count: invitation.invite_count,
    });
    setIsAdding(true);
  };

  const handleDeleteClick = (invitation) => {
    if (invitation.status !== 'draft') {
      toast.error('Only draft invitations can be deleted');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${invitation.full_name}?`)) {
      deleteMutation.mutate(invitation.id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingInvitation) {
      updateMutation.mutate({
        id: editingInvitation.id,
        updates: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSubmitForReview = (eventType) => {
    const draftCount = allInvitations.filter(
      inv => inv.event_type === eventType && inv.status === 'draft'
    ).length;
    
    if (draftCount === 0) {
      toast.error('No draft invitations to submit for this event');
      return;
    }
    
    submitMutation.mutate(eventType);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800 border-gray-200",
      submitted: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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

  const openingAllocation = allocations.opening;
  const vaultAllocation = allocations.vault;
  const closingAllocation = allocations.closing;

  const openingUsed = usage.opening;
  const vaultUsed = usage.vault;
  const closingUsed = usage.closing;

  const canAddOpening = openingUsed < openingAllocation || showAllPartners;
  const canAddVault = vaultUsed < vaultAllocation || showAllPartners;
  const canAddClosing = closingUsed < closingAllocation || showAllPartners;

  const openingProgress = openingAllocation > 0 ? (openingUsed / openingAllocation) * 100 : 0;
  const vaultProgress = vaultAllocation > 0 ? (vaultUsed / vaultAllocation) * 100 : 0;
  const closingProgress = closingAllocation > 0 ? (closingUsed / closingAllocation) * 100 : 0;

  if (loadingPartner || loadingInvitations) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

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
                <p className="text-3xl font-bold text-amber-600">{openingCeremonyInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">SEF Vault</p>
                <p className="text-3xl font-bold text-amber-600">{sefVaultInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <p className="text-sm text-gray-600 mb-1">Closing Ceremony</p>
                <p className="text-3xl font-bold text-amber-600">{closingCeremonyInvitations.reduce((sum, inv) => sum + (inv.invite_count || 0), 0)}</p>
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
            remaining={remaining.opening}
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
                onClick={handleAddClick}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all text-lg py-6 group"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                Add Guest for Opening Ceremony
              </Button>
            </motion.div>
          )}

          {openingCeremonyInvitations.some(inv => inv.status === 'draft') && (
            <Button
              onClick={() => handleSubmitForReview('opening_ceremony')}
              disabled={submitMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Drafts for Review
                </>
              )}
            </Button>
          )}

          {isAdding && activeTab === 'opening_ceremony' && (
            <GuestForm 
              formData={formData} 
              setFormData={setFormData} 
              handleSubmit={handleSubmit} 
              onCancel={() => {
                setIsAdding(false);
                setEditingInvitation(null);
                setFormData({ full_name: '', email: '', phone: '', invite_count: 1 });
              }} 
              isLoading={createMutation.isPending || updateMutation.isPending}
              eventName="Opening Ceremony"
              isEditing={!!editingInvitation}
            />
          )}

          <InvitationsList 
            invitations={openingCeremonyInvitations} 
            deleteMutation={deleteMutation}
            onEdit={handleEditClick}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="sef_vault" className="space-y-6">
          <AllocationCard
            title="SEF Vault Allocation"
            allocation={vaultAllocation}
            used={vaultUsed}
            remaining={remaining.vault}
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
                onClick={handleAddClick}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all text-lg py-6 group"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                Add Guest for SEF Vault
              </Button>
            </motion.div>
          )}

          {sefVaultInvitations.some(inv => inv.status === 'draft') && (
            <Button
              onClick={() => handleSubmitForReview('sef_vault')}
              disabled={submitMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Drafts for Review
                </>
              )}
            </Button>
          )}

          {isAdding && activeTab === 'sef_vault' && (
            <GuestForm 
              formData={formData} 
              setFormData={setFormData} 
              handleSubmit={handleSubmit} 
              onCancel={() => {
                setIsAdding(false);
                setEditingInvitation(null);
                setFormData({ full_name: '', email: '', phone: '', invite_count: 1 });
              }} 
              isLoading={createMutation.isPending || updateMutation.isPending}
              eventName="SEF Vault"
              isEditing={!!editingInvitation}
            />
          )}

          <InvitationsList 
            invitations={sefVaultInvitations} 
            deleteMutation={deleteMutation}
            onEdit={handleEditClick}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="closing_ceremony" className="space-y-6">
          <AllocationCard
            title="Closing Ceremony Allocation"
            allocation={closingAllocation}
            used={closingUsed}
            remaining={remaining.closing}
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
                onClick={handleAddClick}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg hover:shadow-xl transition-all text-lg py-6 group"
              >
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                Add Guest for Closing Ceremony
              </Button>
            </motion.div>
          )}

          {closingCeremonyInvitations.some(inv => inv.status === 'draft') && (
            <Button
              onClick={() => handleSubmitForReview('closing_ceremony')}
              disabled={submitMutation.isPending}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Drafts for Review
                </>
              )}
            </Button>
          )}

          {isAdding && activeTab === 'closing_ceremony' && (
            <GuestForm 
              formData={formData} 
              setFormData={setFormData} 
              handleSubmit={handleSubmit} 
              onCancel={() => {
                setIsAdding(false);
                setEditingInvitation(null);
                setFormData({ full_name: '', email: '', phone: '', invite_count: 1 });
              }} 
              isLoading={createMutation.isPending || updateMutation.isPending}
              eventName="Closing Ceremony"
              isEditing={!!editingInvitation}
            />
          )}

          <InvitationsList 
            invitations={closingCeremonyInvitations} 
            deleteMutation={deleteMutation}
            onEdit={handleEditClick}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AllocationCard({ title, allocation, used, remaining, progress, icon: Icon }) {
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
            <p className="text-sm font-medium text-gray-700 mt-1">Remaining: {remaining}</p>
          </div>
        </div>
        <Progress value={progress} className="h-3 bg-amber-100" />
      </CardContent>
    </Card>
  );
}

function GuestForm({ formData, setFormData, handleSubmit, onCancel, isLoading, eventName, isEditing }) {
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
            {isEditing ? 'Edit Guest' : 'Add Guest'} - {eventName}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-700 font-semibold">Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
                className="mt-2 border-amber-200 focus:border-amber-400"
                placeholder="Enter guest's full name"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-semibold">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                className="mt-2 border-amber-200 focus:border-amber-400"
                placeholder="guest@example.com"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-semibold">Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-2 border-amber-200 focus:border-amber-400"
                placeholder="+971 XX XXX XXXX"
              />
            </div>

            <div>
              <Label className="text-gray-700 font-semibold">Number of Invites *</Label>
              <Input
                type="number"
                value={formData.invite_count}
                onChange={(e) => setFormData(prev => ({ ...prev, invite_count: Number(e.target.value) || 1 }))}
                min="1"
                required
                className="mt-2 border-amber-200 focus:border-amber-400"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-amber-200">
              <Button type="button" variant="outline" onClick={onCancel} className="border-amber-300" disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.full_name || !formData.email}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    {isEditing ? 'Update Guest' : 'Add Guest'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InvitationsList({ invitations, deleteMutation, showPartnerEmail, onEdit, getStatusBadge }) {
  if (invitations.length === 0) {
    return (
      <Card className="border-dashed border-2 border-amber-200 bg-amber-50/30">
        <CardContent className="p-12 text-center">
          <Crown className="w-16 h-16 mx-auto text-amber-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Guests Added Yet</h3>
          <p className="text-gray-600">Add your exclusive guests using the button above</p>
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
                    <p className="font-semibold text-gray-900">{invitation.full_name}</p>
                    <p className="text-xs text-gray-500">{invitation.email}</p>
                  </div>
                </div>
                {!showPartnerEmail && invitation.status === 'draft' && (
                  <div className="flex gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(invitation)}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(invitation.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {showPartnerEmail && invitation.partner && (
                <div className="mb-3 p-2 bg-amber-50 rounded border border-amber-200">
                  <p className="text-xs text-gray-600">Partner: {invitation.partner?.name || 'Unknown Partner'}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Invite Count</p>
                  <p className="text-3xl font-bold text-amber-600">{invitation.invite_count}</p>
                </div>

                {getStatusBadge && getStatusBadge(invitation.status)}

                {invitation.phone && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-900 mb-1">Phone:</p>
                    <p className="text-sm text-gray-700">{invitation.phone}</p>
                  </div>
                )}

                {invitation.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{invitation.rejection_reason}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  {format(new Date(invitation.updated_at || invitation.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
