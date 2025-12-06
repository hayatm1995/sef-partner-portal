
import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function RequirementDialog({ requirement, allPartners, onClose }) {
  const [formData, setFormData] = useState(requirement || {
    requirement_name: "",
    requirement_type: "deliverable_upload",
    associated_entity: "",
    specific_config: {},
    instructions: "",
    deadline: "",
    is_mandatory: false,
    applies_to_partner_emails: [],
    is_active: true,
    display_order: 0
  });

  const [selectAllPartners, setSelectAllPartners] = useState(false);

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let savedRequirement;
      if (requirement) {
        savedRequirement = await base44.entities.PartnerRequirement.update(requirement.id, data);
      } else {
        savedRequirement = await base44.entities.PartnerRequirement.create(data);
      }
      
      // Send notifications to affected partners
      const partnersToNotify = data.applies_to_partner_emails?.length > 0 
        ? data.applies_to_partner_emails 
        : allPartners.filter(p => p.role === 'user').map(p => p.email);
      
      const notificationPromises = partnersToNotify.map(partnerEmail => 
        base44.entities.StatusUpdate.create({
          partner_email: partnerEmail,
          title: requirement ? "Requirement Updated" : "New Requirement Added",
          message: `${data.requirement_name}: ${data.instructions}${data.deadline ? ` Deadline: ${new Date(data.deadline).toLocaleDateString()}` : ''}`,
          type: data.is_mandatory ? "action_required" : "info",
          read: false
        })
      );
      
      await Promise.all(notificationPromises);
      
      return savedRequirement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(requirement ? 'Requirement updated and partners notified' : 'Requirement created and partners notified');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to save requirement: ' + error.message);
    }
  });

  const handlePartnerToggle = (email) => {
    const current = formData.applies_to_partner_emails || [];
    if (current.includes(email)) {
      setFormData(prev => ({
        ...prev,
        applies_to_partner_emails: current.filter(e => e !== email)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        applies_to_partner_emails: [...current, email]
      }));
    }
  };

  const handleSelectAllPartners = (checked) => {
    setSelectAllPartners(checked);
    setFormData(prev => ({
      ...prev,
      applies_to_partner_emails: checked ? allPartners.map(p => p.email) : []
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {requirement ? 'Edit Requirement' : 'Create New Requirement'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Requirement Name *</Label>
              <Input
                value={formData.requirement_name}
                onChange={(e) => setFormData(prev => ({ ...prev, requirement_name: e.target.value }))}
                placeholder="e.g., Upload Company Logo"
                required
              />
            </div>

            <div>
              <Label>Type *</Label>
              <Select
                value={formData.requirement_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, requirement_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deliverable_upload">Deliverable Upload</SelectItem>
                  <SelectItem value="nomination_submission">Nomination Submission</SelectItem>
                  <SelectItem value="form_completion">Form Completion</SelectItem>
                  <SelectItem value="profile_update">Profile Update</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Associated Entity</Label>
              <Input
                value={formData.associated_entity}
                onChange={(e) => setFormData(prev => ({ ...prev, associated_entity: e.target.value }))}
                placeholder="e.g., MediaBranding"
              />
            </div>

            <div>
              <Label>Deadline</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Instructions *</Label>
            <Textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              placeholder="Detailed instructions for partners..."
              rows={4}
              required
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_mandatory}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_mandatory: checked }))}
              />
              <Label>Mandatory</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label>Active</Label>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">Apply To Specific Partners</h3>
            <p className="text-sm text-gray-600 mb-3">
              Leave empty to apply to all partners, or select specific partners below
            </p>
            <div className="flex items-center gap-2 mb-3">
              <Checkbox
                checked={selectAllPartners}
                onCheckedChange={handleSelectAllPartners}
              />
              <Label>Select All Partners</Label>
            </div>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
              {allPartners.map((partner) => (
                <div key={partner.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={(formData.applies_to_partner_emails || []).includes(partner.email)}
                    onCheckedChange={() => handlePartnerToggle(partner.email)}
                  />
                  <Label className="flex-1">
                    <span className="font-medium">{partner.full_name}</span>
                    <span className="text-xs text-gray-500 ml-2">({partner.company_name})</span>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {requirement ? 'Update' : 'Create'} Requirement
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
