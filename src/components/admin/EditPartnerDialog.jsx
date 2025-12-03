import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Loader2, Ticket, Percent, Hash, IdCard, Search, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

export default function EditPartnerDialog({ partner, profile, onClose }) {
  const [moduleSearch, setModuleSearch] = useState("");
  const [hubSearch, setHubSearch] = useState("");
  const [formData, setFormData] = useState({
    allocated_amount: profile?.allocated_amount || 0,
    package_tier: profile?.package_tier || "",
    account_manager_name: profile?.account_manager_name || "",
    account_manager_email: profile?.account_manager_email || "",
    account_manager_phone: profile?.account_manager_phone || "",
    account_manager_calendly_url: profile?.account_manager_calendly_url || "",
    promo_code: profile?.promo_code || "",
    promo_discount_percentage: profile?.promo_discount_percentage || 0,
    promo_pass_limit: profile?.promo_pass_limit || 0,
    exhibitor_tickets_allocation: profile?.exhibitor_tickets_allocation || 0,
    belong_passes_allocation: profile?.belong_passes_allocation || 0,
    belong_plus_sef_vault_allocation: profile?.belong_plus_sef_vault_allocation || 0,
    belong_plus_opening_ceremony_allocation: profile?.belong_plus_opening_ceremony_allocation || 0,
    belong_plus_closing_ceremony_allocation: profile?.belong_plus_closing_ceremony_allocation || 0,
    visible_modules: profile?.visible_modules || [
      "dashboard", "getting_started", "exhibitor_stand", "deliverables", "nominations", "partner_hub",
      "timeline", "event_schedule", "venue",
      "media_tracker", "brand_assets", "social_media", "press_kit",
      "account_manager", "resources", "documents", "training", "support",
      "passes", "opportunities", "networking", "benefits",
      "messages", "notifications", "contact_directory",
      "profile_page", "activity_log", "settings", "review_approve"
    ],
    visible_hub_sections: profile?.visible_hub_sections || [
      "profile", "team", "contacts", "media", "pr", "workshops", "speakers", "startups",
      "awards", "pitch_judge", "recognition", "vip", "exhibition", "booth", "badges", "vipbox", "testimonial"
    ],
    show_pitch_competition: profile?.show_pitch_competition || false,
    show_seffy_awards: profile?.show_seffy_awards || false,
    admin_notes: profile?.admin_notes || ""
  });

  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (profile?.id) {
        return base44.entities.PartnerProfile.update(profile.id, data);
      } else {
        return base44.entities.PartnerProfile.create({
          ...data,
          partner_email: partner.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allPartners'] });
      toast.success('Partner profile updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to update profile: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const toggleModule = (module) => {
    setFormData(prev => ({
      ...prev,
      visible_modules: prev.visible_modules.includes(module)
        ? prev.visible_modules.filter(m => m !== module)
        : [...prev.visible_modules, module]
    }));
  };

  const toggleHubSection = (section) => {
    setFormData(prev => ({
      ...prev,
      visible_hub_sections: prev.visible_hub_sections.includes(section)
        ? prev.visible_hub_sections.filter(s => s !== section)
        : [...prev.visible_hub_sections, section]
    }));
  };

  const allModules = [
    { id: "dashboard", label: "Dashboard", category: "Overview" },
    { id: "getting_started", label: "Getting Started", category: "Overview" },
    { id: "exhibitor_stand", label: "Exhibitor Stand", category: "Overview" },
    { id: "deliverables", label: "My Deliverables", category: "Work" },
    { id: "nominations", label: "My Nominations", category: "Work" },
    { id: "contracts", label: "Contracts", category: "Work" },
    { id: "partner_hub", label: "Partner Hub", category: "Work" },
    { id: "review_approve", label: "Review & Approve", category: "Work" },
    { id: "timeline", label: "Timeline & Deadlines", category: "Planning" },
    { id: "event_schedule", label: "Event Schedule", category: "Planning" },
    { id: "venue", label: "Venue Information", category: "Planning" },
    { id: "media_tracker", label: "Media Tracker", category: "Marketing" },
    { id: "brand_assets", label: "Brand Assets", category: "Marketing" },
    { id: "social_media", label: "Social Media Kit", category: "Marketing" },
    { id: "press_kit", label: "PR & Press", category: "Marketing" },
    { id: "passes", label: "SEF Access & Passes", category: "Engagement" },
    { id: "opportunities", label: "Opportunities", category: "Engagement" },
    { id: "networking", label: "Networking", category: "Engagement" },
    { id: "benefits", label: "Benefits & Perks", category: "Engagement" },
    { id: "messages", label: "Messages", category: "Communication" },
    { id: "notifications", label: "Notifications", category: "Communication" },
    { id: "contact_directory", label: "Contact Directory", category: "Communication" },
    { id: "account_manager", label: "My Account Manager", category: "Support" },
    { id: "resources", label: "Resources & Downloads", category: "Support" },
    { id: "documents", label: "Documents Library", category: "Support" },
    { id: "training", label: "Training & Tutorials", category: "Support" },
    { id: "support", label: "Support & FAQs", category: "Support" },
    { id: "profile_page", label: "My Profile", category: "Account" },
    { id: "activity_log", label: "Activity Log", category: "Account" },
    { id: "settings", label: "Settings", category: "Account" }
  ];

  const filteredModules = allModules.filter(module =>
    module.label.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  const modulesByCategory = filteredModules.reduce((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {});

  const allHubSections = [
    { id: "profile", label: "Company Profile", category: "Profile" },
    { id: "team", label: "Team Access", category: "Profile" },
    { id: "contacts", label: "Contact Points", category: "Profile" },
    { id: "media", label: "Media & Branding", category: "Media" },
    { id: "pr", label: "PR & Marketing", category: "Media" },
    { id: "testimonial", label: "Testimonials", category: "Media" },
    { id: "workshops", label: "Workshop Nominations", category: "Nominations" },
    { id: "speakers", label: "Speaker Nominations", category: "Nominations" },
    { id: "startups", label: "Startup Nominations", category: "Nominations" },
    { id: "awards", label: "Sponsor Award Recipients", category: "Recognition" },
    { id: "pitch_judge", label: "Pitch Competition Judge", category: "Recognition" },
    { id: "recognition", label: "Recognition (SEFFY Presenters)", category: "Recognition" },
    { id: "exhibition", label: "Exhibition Stand", category: "Exhibition" },
    { id: "booth", label: "Booth/Activation", category: "Exhibition" },
    { id: "vip", label: "BELONG+", category: "Events" },
    { id: "badges", label: "Badge Registration", category: "Events" },
    { id: "vipbox", label: "VIP Box Tracker", category: "Events" },
    { id: "digital_displays", label: "Digital Displays", category: "Exhibition" }
  ];

  const filteredHubSections = allHubSections.filter(section =>
    section.label.toLowerCase().includes(hubSearch.toLowerCase())
  );

  const hubSectionsByCategory = filteredHubSections.reduce((acc, section) => {
    if (!acc[section.category]) acc[section.category] = [];
    acc[section.category].push(section);
    return acc;
  }, {});

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Edit Partner: {partner.full_name}
            <span className="block text-sm font-normal text-gray-500 mt-1">{partner.email}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="promo">Promo Code</TabsTrigger>
            <TabsTrigger value="manager">Account Manager</TabsTrigger>
            <TabsTrigger value="modules">Sidebar Modules</TabsTrigger>
            <TabsTrigger value="hub">Hub Sections</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="profile" className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <h3 className="font-semibold text-lg mb-4 text-blue-900">Partnership Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Package/Tier</Label>
                    <Input
                      value={formData.package_tier}
                      onChange={(e) => setFormData(prev => ({ ...prev, package_tier: e.target.value }))}
                      placeholder="e.g., Standard, Premium, Enterprise"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-gray-600 mt-1">Partner's sponsorship package level</p>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold">Allocated Amount</Label>
                    <Input
                      type="number"
                      value={formData.allocated_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, allocated_amount: Number(e.target.value) }))}
                      placeholder="0"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-gray-600 mt-1">Partnership value in AED</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Internal Notes</h3>
                <Label className="text-sm font-semibold">Admin Notes (Internal Only)</Label>
                <Textarea
                  value={formData.admin_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  placeholder="Add internal notes about this partner, special requirements, communication history, etc..."
                  rows={5}
                  className="mt-1.5"
                />
                <p className="text-xs text-gray-500 mt-1">These notes are only visible to admins</p>
              </Card>
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-blue-50 border border-orange-200 rounded-lg p-6 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <IdCard className="w-6 h-6 text-orange-600" />
                  <h3 className="font-bold text-lg">Badge Allocations</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Set how many exhibitor passes and sponsor passes this partner can register.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Ticket className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-orange-900">Exhibitor Passes</h4>
                  </div>
                  <Label>Number of Passes Allocated</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.exhibitor_tickets_allocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, exhibitor_tickets_allocation: Number(e.target.value) }))}
                    placeholder="0"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Partners can register up to this many exhibitor passes for their team members.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <IdCard className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Sponsor Passes</h4>
                  </div>
                  <Label>Number of Passes Allocated</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.belong_passes_allocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, belong_passes_allocation: Number(e.target.value) }))}
                    placeholder="0"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Partners can register up to this many sponsor passes for their team members.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">✨</span>
                  <h4 className="font-semibold text-amber-900 text-lg">BELONG+ Premium Access</h4>
                </div>
                <p className="text-sm text-amber-800 mb-4">Exclusive invitations to our most prestigious events</p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="font-semibold text-amber-900">SEF Vault Invites</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.belong_plus_sef_vault_allocation || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, belong_plus_sef_vault_allocation: Number(e.target.value) }))}
                      placeholder="0"
                      className="mt-2 border-amber-300"
                    />
                    <p className="text-xs text-amber-700 mt-1">VIP access to The Vault</p>
                  </div>
                  
                  <div>
                    <Label className="font-semibold text-amber-900">Opening Ceremony Invites</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.belong_plus_opening_ceremony_allocation || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, belong_plus_opening_ceremony_allocation: Number(e.target.value) }))}
                      placeholder="0"
                      className="mt-2 border-amber-300"
                    />
                    <p className="text-xs text-amber-700 mt-1">Exclusive ceremony access</p>
                  </div>

                  <div>
                    <Label className="font-semibold text-amber-900">Closing Ceremony Invites</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.belong_plus_closing_ceremony_allocation || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, belong_plus_closing_ceremony_allocation: Number(e.target.value) }))}
                      placeholder="0"
                      className="mt-2 border-amber-300"
                    />
                    <p className="text-xs text-amber-700 mt-1">Grand finale access</p>
                  </div>
                </div>
              </div>

              {(formData.exhibitor_tickets_allocation > 0 || formData.belong_passes_allocation > 0) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-green-900 mb-2">Summary:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    {formData.exhibitor_tickets_allocation > 0 && (
                      <li>• <span className="font-bold">{formData.exhibitor_tickets_allocation}</span> Exhibitor Passes</li>
                    )}
                    {formData.belong_passes_allocation > 0 && (
                      <li>• <span className="font-bold">{formData.belong_passes_allocation}</span> Sponsor Passes</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Award Presenter Options */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🏆</span>
                  <h4 className="font-semibold text-indigo-900 text-lg">Award Presenter Access</h4>
                </div>
                <p className="text-sm text-indigo-800 mb-4">Control which award presenter nomination options this partner can access in the Partner Hub</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-indigo-200">
                    <div>
                      <p className="font-semibold text-gray-900">Pitch Competition Award Presenter</p>
                      <p className="text-xs text-gray-600">Allow partner to nominate presenters for Pitch Competition awards</p>
                    </div>
                    <Checkbox
                      checked={formData.show_pitch_competition}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_pitch_competition: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-indigo-200">
                    <div>
                      <p className="font-semibold text-gray-900">SEFFY Award Presenter</p>
                      <p className="text-xs text-gray-600">Allow partner to nominate presenters for SEFFY Awards</p>
                    </div>
                    <Checkbox
                      checked={formData.show_seffy_awards}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_seffy_awards: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="promo" className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <Ticket className="w-6 h-6 text-purple-600" />
                  <h3 className="font-bold text-lg">BELONG Pass Promo Code</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Assign a unique promo code for this partner to share with their community for discounted BELONG passes.
                </p>
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Promo Code
                </Label>
                <Input
                  value={formData.promo_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, promo_code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., PARTNER2025"
                  className="font-mono text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use uppercase letters and numbers only. This code will be unique to this partner.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Discount Percentage
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.promo_discount_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, promo_discount_percentage: Number(e.target.value) }))}
                    placeholder="20"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the discount percentage (0-100)
                  </p>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    Maximum Number of Passes
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.promo_pass_limit}
                    onChange={(e) => setFormData(prev => ({ ...prev, promo_pass_limit: Number(e.target.value) }))}
                    placeholder="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many passes can use this code?
                  </p>
                </div>
              </div>

              {formData.promo_code && formData.promo_discount_percentage > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Preview:</h4>
                  <p className="text-sm text-green-800">
                    Code <span className="font-mono font-bold">{formData.promo_code}</span> gives{" "}
                    <span className="font-bold">{formData.promo_discount_percentage}% off</span>{" "}
                    BELONG pass for up to{" "}
                    <span className="font-bold">{formData.promo_pass_limit || 'unlimited'} passes</span>
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="manager" className="space-y-6">
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <h3 className="font-semibold text-lg mb-4 text-green-900">Account Manager Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Full Name *</Label>
                    <Input
                      value={formData.account_manager_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_manager_name: e.target.value }))}
                      placeholder="Ahmed Al-Mansoori"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold">Email Address *</Label>
                      <Input
                        type="email"
                        value={formData.account_manager_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, account_manager_email: e.target.value }))}
                        placeholder="ahmed@sheraa.ae"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-semibold">Phone Number</Label>
                      <Input
                        value={formData.account_manager_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, account_manager_phone: e.target.value }))}
                        placeholder="+971 XX XXX XXXX"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-green-200">
                    <Label className="text-sm font-semibold">Calendly Scheduling URL</Label>
                    <Input
                      type="url"
                      value={formData.account_manager_calendly_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_manager_calendly_url: e.target.value }))}
                      placeholder="https://calendly.com/your-account-manager/30min"
                      className="mt-1.5"
                    />
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Partners can schedule meetings directly via this Calendly link
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="modules" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Sidebar Navigation Modules</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Select which pages this partner can access ({formData.visible_modules.length} selected)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, visible_modules: allModules.map(m => m.id) }))}
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, visible_modules: [] }))}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search modules..."
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                {Object.entries(modulesByCategory).map(([category, modules]) => (
                  <Card key={category} className="p-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">{category}</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {modules.map((module) => (
                        <div key={module.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={module.id}
                            checked={formData.visible_modules.includes(module.id)}
                            onCheckedChange={() => toggleModule(module.id)}
                          />
                          <label
                            htmlFor={module.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {module.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="hub" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Partner Hub Sections</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Control which sections appear in the Partner Hub ({formData.visible_hub_sections.length} selected)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, visible_hub_sections: allHubSections.map(s => s.id) }))}
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, visible_hub_sections: [] }))}
                  >
                    <Square className="w-4 h-4 mr-1" />
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search hub sections..."
                  value={hubSearch}
                  onChange={(e) => setHubSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                {Object.entries(hubSectionsByCategory).map(([category, sections]) => (
                  <Card key={category} className="p-4">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">{category}</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {sections.map((section) => (
                        <div key={section.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`hub-${section.id}`}
                            checked={formData.visible_hub_sections.includes(section.id)}
                            onCheckedChange={() => toggleHubSection(section.id)}
                          />
                          <label
                            htmlFor={`hub-${section.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {section.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-700"
              >
                {updateProfileMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}