import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { partnersService, partnerUsersService } from "@/services/supabaseService";
import { partnerFeaturesService, DEFAULT_FEATURES, FEATURE_DISPLAY_NAMES } from "@/services/partnerFeaturesService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Save, ArrowLeft, Loader2, Building2, Users, 
  Mail, Phone, Globe, Image as ImageIcon, CheckSquare, ToggleLeft, ToggleRight
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import DeliverablesManagement from "@/components/admin/DeliverablesManagement";
import PartnerMessages from "@/components/messaging/PartnerMessages";

// All available portal modules
const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "getting_started", label: "Getting Started" },
  { id: "exhibitor_stand", label: "Exhibitor Stand" },
  { id: "deliverables", label: "My Deliverables" },
  { id: "nominations", label: "My Nominations" },
  { id: "contracts", label: "Contracts" },
  { id: "partner_hub", label: "Partner Hub" },
  { id: "calendar", label: "Timeline & Deadlines" },
  { id: "tasks", label: "Tasks & Reminders" },
  { id: "event_schedule", label: "Event Schedule" },
  { id: "venue", label: "Venue Information" },
  { id: "media_tracker", label: "Media Tracker" },
  { id: "brand_assets", label: "Brand Assets" },
  { id: "social_media", label: "Social Media Kit" },
  { id: "press_kit", label: "PR & Press" },
  { id: "passes", label: "SEF Access & Passes" },
  { id: "opportunities", label: "Opportunities" },
  { id: "networking", label: "Networking" },
  { id: "benefits", label: "Benefits & Perks" },
  { id: "imagine_lab", label: "Imagine Lab" },
  { id: "messages", label: "Messages" },
  { id: "notifications", label: "Notifications" },
  { id: "contact_directory", label: "Contact Directory" },
  { id: "account_manager", label: "My Account Manager" },
  { id: "resources", label: "Resources & Downloads" },
  { id: "documents", label: "Documents Library" },
  { id: "training", label: "Training & Tutorials" },
  { id: "support", label: "Support & FAQs" },
  { id: "profile", label: "My Profile" },
  { id: "activity_log", label: "Activity Log" },
  { id: "settings", label: "Settings" },
  { id: "review_approve", label: "Review & Approve" },
];

export default function EditPartner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const { role } = useAuth();
  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  // Redirect if not admin or superadmin
  React.useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Access denied. Admin access required.");
      navigate("/Dashboard");
    }
  }, [user, isAdmin, navigate]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    tier: "",
    contract_status: "Pending",
    website_url: "",
    logo_url: "",
    assigned_account_manager_id: null,
    pr_contact_name: "",
    pr_contact_email: "",
    pr_contact_phone: "",
    operations_contact_name: "",
    operations_contact_email: "",
    operations_contact_phone: "",
    finance_contact_name: "",
    finance_contact_email: "",
    finance_contact_phone: "",
    marketing_contact_name: "",
    marketing_contact_email: "",
    marketing_contact_phone: "",
    visible_modules: [],
    features: {},
    belong_plus_opening_ceremony_allocation: 0,
    belong_plus_sef_vault_allocation: 0,
    belong_plus_closing_ceremony_allocation: 0,
  });

  // Fetch partner data if editing
  const { data: partner, isLoading: partnerLoading } = useQuery({
    queryKey: ['partner', id],
    queryFn: async () => {
      if (isNew) return null;
      return partnersService.getById(id);
    },
    enabled: !isNew && isSuperAdmin,
  });

  // Fetch all admin users for account manager dropdown
  const { data: adminUsers = [] } = useQuery({
    queryKey: ['adminUsers', role],
    queryFn: async () => {
      const allPartners = await partnersService.getAll({
        role: role || undefined,
        currentUserAuthId: user?.id || undefined,
      });
      const allUsers = [];
      for (const p of allPartners) {
        const users = await partnerUsersService.getByPartnerId(p.id);
        const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin');
        allUsers.push(...admins);
      }
      return allUsers;
    },
    enabled: isSuperAdmin,
  });

  // Fetch partner features
  const { data: partnerFeatures = [] } = useQuery({
    queryKey: ['partnerFeatures', id],
    queryFn: async () => {
      if (isNew || !id) return [];
      return partnerFeaturesService.getByPartnerId(id);
    },
    enabled: !isNew && !!id && isSuperAdmin,
  });

  // Update form data when partner loads
  useEffect(() => {
    if (partner) {
      // Initialize features from partner_features or default to all enabled
      const featuresMap = {};
      if (partnerFeatures.length > 0) {
        partnerFeatures.forEach(f => {
          featuresMap[f.feature] = f.enabled;
        });
      } else {
        // Default: all features enabled
        DEFAULT_FEATURES.forEach(f => {
          featuresMap[f] = true;
        });
      }

      setFormData({
        name: partner.name || "",
        tier: partner.tier || "",
        contract_status: partner.contract_status || "Pending",
        website_url: partner.website_url || "",
        logo_url: partner.logo_url || "",
        assigned_account_manager_id: partner.assigned_account_manager_id || null,
        pr_contact_name: partner.pr_contact_name || "",
        pr_contact_email: partner.pr_contact_email || "",
        pr_contact_phone: partner.pr_contact_phone || "",
        operations_contact_name: partner.operations_contact_name || "",
        operations_contact_email: partner.operations_contact_email || "",
        operations_contact_phone: partner.operations_contact_phone || "",
        finance_contact_name: partner.finance_contact_name || "",
        finance_contact_email: partner.finance_contact_email || "",
        finance_contact_phone: partner.finance_contact_phone || "",
        marketing_contact_name: partner.marketing_contact_name || "",
        marketing_contact_email: partner.marketing_contact_email || "",
        marketing_contact_phone: partner.marketing_contact_phone || "",
        visible_modules: partner.visible_modules || [],
        belong_plus_opening_ceremony_allocation: partner.belong_plus_opening_ceremony_allocation || 0,
        belong_plus_sef_vault_allocation: partner.belong_plus_sef_vault_allocation || 0,
        belong_plus_closing_ceremony_allocation: partner.belong_plus_closing_ceremony_allocation || 0,
        internal_notes: partner.internal_notes || "",
        features: featuresMap,
      });
    } else if (isNew) {
      // For new partners, initialize all features as enabled
      const featuresMap = {};
      DEFAULT_FEATURES.forEach(f => {
        featuresMap[f] = true;
      });
      setFormData(prev => ({
        ...prev,
        features: featuresMap,
      }));
    }
  }, [partner, partnerFeatures, isNew]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const { features, ...partnerData } = data;
      let savedPartner;
      
      if (isNew) {
        savedPartner = await partnersService.create(partnerData);
        // Initialize features for new partner (all enabled by default)
        if (savedPartner?.id && features) {
          await partnerFeaturesService.bulkUpdate(savedPartner.id, features);
        }
      } else {
        savedPartner = await partnersService.update(id, partnerData);
        // Update features
        if (id && features) {
          await partnerFeaturesService.bulkUpdate(id, features);
        }
      }
      
      return savedPartner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPartners']);
      queryClient.invalidateQueries(['partner', id]);
      queryClient.invalidateQueries(['partnerFeatures', id]);
      toast.success(isNew ? "Partner created successfully" : "Partner updated successfully");
      navigate("/admin/partners");
    },
    onError: (error) => {
      toast.error(`Failed to save partner: ${error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const toggleModule = (moduleId) => {
    setFormData(prev => ({
      ...prev,
      visible_modules: prev.visible_modules.includes(moduleId)
        ? prev.visible_modules.filter(m => m !== moduleId)
        : [...prev.visible_modules, moduleId]
    }));
  };

  const selectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      visible_modules: ALL_MODULES.map(m => m.id)
    }));
  };

  const deselectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      visible_modules: []
    }));
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600">You need superadmin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isNew && partnerLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/Dashboard" },
        { label: "Admin Partners", href: "/admin/partners" },
        { label: isNew ? "New Partner" : "Edit Partner", href: "#" },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isNew ? "Create Partner" : "Edit Partner"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isNew ? "Add a new partner to the system" : "Update partner information and settings"}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/admin/partners")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="nominations">Nominations</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="belong_plus">BELONG+ Allocations</TabsTrigger>
            <TabsTrigger value="features">Feature Visibility</TabsTrigger>
            <TabsTrigger value="modules">Module Visibility</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Partner Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tier">Tier</Label>
                    <Input
                      id="tier"
                      value={formData.tier}
                      onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value }))}
                      placeholder="e.g., Platinum, Gold, Silver"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contract_status">Contract Status</Label>
                    <Select
                      value={formData.contract_status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, contract_status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Signed">Signed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assigned_account_manager_id">SEF Account Manager</Label>
                    <Select
                      value={formData.assigned_account_manager_id || ""}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_account_manager_id: value || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {adminUsers.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.full_name} ({admin.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* POC Contacts Tab */}
          <TabsContent value="contacts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PR Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">PR Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="pr_contact_name">Name</Label>
                    <Input
                      id="pr_contact_name"
                      value={formData.pr_contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, pr_contact_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pr_contact_email">Email</Label>
                    <Input
                      id="pr_contact_email"
                      type="email"
                      value={formData.pr_contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, pr_contact_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pr_contact_phone">Phone</Label>
                    <Input
                      id="pr_contact_phone"
                      type="tel"
                      value={formData.pr_contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, pr_contact_phone: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Operations Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Operations Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="operations_contact_name">Name</Label>
                    <Input
                      id="operations_contact_name"
                      value={formData.operations_contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, operations_contact_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="operations_contact_email">Email</Label>
                    <Input
                      id="operations_contact_email"
                      type="email"
                      value={formData.operations_contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, operations_contact_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="operations_contact_phone">Phone</Label>
                    <Input
                      id="operations_contact_phone"
                      type="tel"
                      value={formData.operations_contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, operations_contact_phone: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Finance Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Finance Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="finance_contact_name">Name</Label>
                    <Input
                      id="finance_contact_name"
                      value={formData.finance_contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, finance_contact_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="finance_contact_email">Email</Label>
                    <Input
                      id="finance_contact_email"
                      type="email"
                      value={formData.finance_contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, finance_contact_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="finance_contact_phone">Phone</Label>
                    <Input
                      id="finance_contact_phone"
                      type="tel"
                      value={formData.finance_contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, finance_contact_phone: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Marketing Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Marketing Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="marketing_contact_name">Name</Label>
                    <Input
                      id="marketing_contact_name"
                      value={formData.marketing_contact_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, marketing_contact_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketing_contact_email">Email</Label>
                    <Input
                      id="marketing_contact_email"
                      type="email"
                      value={formData.marketing_contact_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, marketing_contact_email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="marketing_contact_phone">Phone</Label>
                    <Input
                      id="marketing_contact_phone"
                      type="tel"
                      value={formData.marketing_contact_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, marketing_contact_phone: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deliverables Tab */}
          <TabsContent value="deliverables">
            {!isNew && id ? (
              <DeliverablesManagement partnerId={id} />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-gray-500">
                    Save the partner first to manage deliverables.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Media</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Manage branding assets and media for this partner.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                {!isNew && id ? (
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(`/PartnerHub?tab=media&viewAs=${id}`, '_blank')}
                    >
                      View Media Hub
                    </Button>
                    <p className="text-sm text-gray-500">
                      Click to view all media and branding assets for this partner in PartnerHub.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nominations Tab */}
          <TabsContent value="nominations">
            <Card>
              <CardHeader>
                <CardTitle>Nominations</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  View and manage nominations submitted by this partner.
                </p>
              </CardHeader>
              <CardContent>
                {!isNew && id ? (
                  <div className="space-y-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => window.open(`/Nominations?partnerId=${id}`, '_blank')}
                    >
                      View All Nominations
                    </Button>
                    <p className="text-sm text-gray-500">
                      Click to view all nominations submitted by this partner in a new tab.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Save the partner first to view nominations.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Internal notes for admin use only. These notes are not visible to partners.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="internal_notes">Notes</Label>
                    <Textarea
                      id="internal_notes"
                      value={formData.internal_notes || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, internal_notes: e.target.value }))}
                      placeholder="Add internal notes about this partner..."
                      rows={10}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Use this space to record important information, reminders, or communication history.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BELONG+ Allocations Tab */}
          <TabsContent value="belong_plus">
            <Card>
              <CardHeader>
                <CardTitle>BELONG+ VIP Invitation Allocations</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Set the maximum number of VIP invitations this partner can submit for each BELONG+ event.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="belong_plus_opening_ceremony_allocation">Opening Ceremony Allocation</Label>
                    <Input
                      id="belong_plus_opening_ceremony_allocation"
                      type="number"
                      min="0"
                      value={formData.belong_plus_opening_ceremony_allocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, belong_plus_opening_ceremony_allocation: Number(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">Maximum invites for Opening Ceremony</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="belong_plus_sef_vault_allocation">SEF Vault Allocation</Label>
                    <Input
                      id="belong_plus_sef_vault_allocation"
                      type="number"
                      min="0"
                      value={formData.belong_plus_sef_vault_allocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, belong_plus_sef_vault_allocation: Number(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">Maximum invites for SEF Vault</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="belong_plus_closing_ceremony_allocation">Closing Ceremony Allocation</Label>
                    <Input
                      id="belong_plus_closing_ceremony_allocation"
                      type="number"
                      min="0"
                      value={formData.belong_plus_closing_ceremony_allocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, belong_plus_closing_ceremony_allocation: Number(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500">Maximum invites for Closing Ceremony</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Visibility Tab - Controls PartnerHub sections */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>PartnerHub Feature Visibility</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Control which sections appear in the PartnerHub for this partner. All features are enabled by default for new partners.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <Label htmlFor={`feature-${feature}`} className="text-base font-medium cursor-pointer">
                          {FEATURE_DISPLAY_NAMES[feature] || feature}
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">
                          {feature === 'Company Profile' && 'Company information and profile details'}
                          {feature === 'Deliverables' && 'Deliverables submission and tracking'}
                          {feature === 'Booth Options' && 'Exhibitor stand and booth options'}
                          {feature === 'VIP Guest List' && 'VIP guest list management'}
                          {feature === 'Media Uploads' && 'Media assets and press materials'}
                          {feature === 'Payments' && 'Payment and billing information'}
                          {feature === 'Legal & Branding' && 'Legal documents and branding guidelines'}
                          {feature === 'Speaker Requests' && 'Speaker nomination requests'}
                          {feature === 'Nominations' && 'Startup and award nominations'}
                        </p>
                      </div>
                      <Switch
                        id={`feature-${feature}`}
                        checked={formData.features?.[feature] ?? true}
                        onCheckedChange={async (checked) => {
                          // Update local state immediately
                          setFormData(prev => ({
                            ...prev,
                            features: {
                              ...prev.features,
                              [feature]: checked,
                            },
                          }));
                          
                          // Update in database instantly (if not new partner)
                          if (!isNew && id) {
                            try {
                              await partnerFeaturesService.updateFeature(id, feature, checked);
                              queryClient.invalidateQueries(['partnerFeatures', id]);
                              toast.success(`${FEATURE_DISPLAY_NAMES[feature] || feature} ${checked ? 'enabled' : 'disabled'}`);
                            } catch (error) {
                              console.error('Error updating feature:', error);
                              toast.error('Failed to update feature');
                              // Revert on error
                              setFormData(prev => ({
                                ...prev,
                                features: {
                                  ...prev.features,
                                  [feature]: !checked,
                                },
                              }));
                            }
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Disabled features will be hidden from the PartnerHub. Partners will see a "Feature not available" message for disabled sections.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Module Visibility Tab */}
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Module Visibility</CardTitle>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllModules}>
                      Select All
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={deselectAllModules}>
                      Deselect All
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Select which portal modules this partner can access. Unchecked modules will be hidden from their users.
                  ({formData.visible_modules.length} of {ALL_MODULES.length} selected)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_MODULES.map((module) => (
                    <div key={module.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={module.id}
                        checked={formData.visible_modules.includes(module.id)}
                        onCheckedChange={() => toggleModule(module.id)}
                      />
                      <Label
                        htmlFor={module.id}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        {module.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/partners")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Partner
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}


