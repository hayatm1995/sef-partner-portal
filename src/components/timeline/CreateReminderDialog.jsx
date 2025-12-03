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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function CreateReminderDialog({ onClose, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    reminder_type: "profile_incomplete",
    priority: "medium",
    due_date: "",
    selectedPartners: [],
    sendToAll: false
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
  });

  const partners = allPartners.filter(p => p.role !== 'admin');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
          <DialogTitle>Create Custom Reminder</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Complete Your Profile"
              required
            />
          </div>

          <div>
            <Label>Message *</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              placeholder="Enter reminder details..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reminder Type *</Label>
              <Select
                value={formData.reminder_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reminder_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deliverable_deadline">Deliverable Deadline</SelectItem>
                  <SelectItem value="nomination_deadline">Nomination Deadline</SelectItem>
                  <SelectItem value="profile_incomplete">Profile Incomplete</SelectItem>
                  <SelectItem value="booking_reminder">Booking Reminder</SelectItem>
                  <SelectItem value="contract_expiry">Contract Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🔵 Low</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Due Date *</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              required
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="sendToAll"
                checked={formData.sendToAll}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sendToAll: checked }))}
              />
              <label
                htmlFor="sendToAll"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Send to All Partners ({partners.length})
              </label>
            </div>

            {!formData.sendToAll && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Select Recipients</Label>
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

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (!formData.sendToAll && formData.selectedPartners.length === 0)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Reminder
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}