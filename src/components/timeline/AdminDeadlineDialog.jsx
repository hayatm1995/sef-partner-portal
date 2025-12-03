import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function AdminDeadlineDialog({ onClose, onSubmit, isLoading, deadline = null }) {
  const [formData, setFormData] = useState({
    form_name: deadline?.form_name || "",
    form_type: deadline?.form_type || "deliverable",
    deadline: deadline?.deadline || "",
    is_required: deadline?.is_required || false,
    selectedPartners: [],
    applyToAll: !deadline
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
  });

  const partners = allPartners.filter(p => p.role !== 'admin');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, deadline);
  };

  const togglePartner = (partnerId) => {
    setFormData(prev => ({
      ...prev,
      selectedPartners: prev.selectedPartners.includes(partnerId)
        ? prev.selectedPartners.filter(id => id !== partnerId)
        : [...prev.selectedPartners, partnerId]
    }));
  };

  const toggleAllPartners = () => {
    if (formData.selectedPartners.length === partners.length) {
      setFormData(prev => ({ ...prev, selectedPartners: [] }));
    } else {
      setFormData(prev => ({ ...prev, selectedPartners: partners.map(p => p.id) }));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deadline ? 'Edit Deadline' : 'Create New Deadline'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Form/Task Name *</Label>
            <Input
              value={formData.form_name}
              onChange={(e) => setFormData(prev => ({ ...prev, form_name: e.target.value }))}
              placeholder="e.g., Media Assets Upload"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Form Type *</Label>
              <Select
                value={formData.form_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, form_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workshop_nomination">Workshop Nomination</SelectItem>
                  <SelectItem value="speaker_nomination">Speaker Nomination</SelectItem>
                  <SelectItem value="startup_nomination">Startup Nomination</SelectItem>
                  <SelectItem value="award_nomination">Award Nomination</SelectItem>
                  <SelectItem value="profile">Profile Completion</SelectItem>
                  <SelectItem value="contract">Contract Submission</SelectItem>
                  <SelectItem value="deliverable">Deliverable Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Deadline Date *</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
            />
            <label
              htmlFor="is_required"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Mark as Required
            </label>
          </div>

          {!deadline && (
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Checkbox
                  id="applyToAll"
                  checked={formData.applyToAll}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, applyToAll: checked }))}
                />
                <label
                  htmlFor="applyToAll"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Apply to All Partners ({partners.length})
                </label>
              </div>

              {!formData.applyToAll && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Select Partners</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleAllPartners}
                    >
                      {formData.selectedPartners.length === partners.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                    {partners.map((partner) => (
                      <div key={partner.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={partner.id}
                          checked={formData.selectedPartners.includes(partner.id)}
                          onCheckedChange={() => togglePartner(partner.id)}
                        />
                        <label
                          htmlFor={partner.id}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          <span className="font-medium">{partner.full_name}</span>
                          <span className="text-gray-500 ml-2">({partner.email})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.selectedPartners.length} partner(s) selected
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (!deadline && !formData.applyToAll && formData.selectedPartners.length === 0)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {deadline ? 'Update Deadline' : 'Create Deadline'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}