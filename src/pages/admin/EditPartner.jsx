import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { partnersService, partnerUsersService } from "@/services/supabaseService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Save, ArrowLeft, Loader2, Building2, Users, 
  Mail, Phone, Globe, Image as ImageIcon, CheckSquare 
} from "lucide-react";
import { toast } from "sonner";
import Breadcrumbs from "@/components/common/Breadcrumbs";

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

  const isSuperAdmin = user?.role === 'sef_admin' || user?.is_super_admin;

  // Redirect if not superadmin
  React.useEffect(() => {
    if (user && !isSuperAdmin) {
      toast.error("Access denied. Superadmin only.");
      navigate("/Dashboard");
    }
  }, [user, isSuperAdmin, navigate]);

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
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const allPartners = await partnersService.getAll();
      const allUsers = [];
      for (const p of allPartners) {
        const users = await partnerUsersService.getByPartnerId(p.id);
        const admins = users.filter(u => u.role === 'admin' || u.role === 'sef_admin');
        allUsers.push(...admins);
      }
      return allUsers;
    },
    enabled: isSuperAdmin,
  });

  // Update form data when partner loads
  useEffect(() => {
    if (partner) {
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
      });
    }
  }, [partner]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (isNew) {
        return partnersService.create(data);
      } else {
        return partnersService.update(id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPartners']);
      queryClient.invalidateQueries(['partner', id]);
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
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="contacts">POC Contacts</TabsTrigger>
            <TabsTrigger value="belong_plus">BELONG+ Allocations</TabsTrigger>
            <TabsTrigger value="modules">Module Visibility</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
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


