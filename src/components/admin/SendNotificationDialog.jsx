import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Bell, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function SendNotificationDialog({ onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    selectedPartners: [],
    sendToAll: false
  });

  const queryClient = useQueryClient();

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
  });

  const partners = allPartners.filter(p => p.role !== 'admin');

  const sendNotificationMutation = useMutation({
    mutationFn: async (data) => {
      const targetPartners = data.sendToAll 
        ? partners 
        : partners.filter(p => data.selectedPartners.includes(p.id));

      const notifications = targetPartners.map(partner => ({
        partner_email: partner.email,
        title: data.title,
        message: data.message,
        type: data.type,
        read: false
      }));

      await base44.entities.StatusUpdate.bulkCreate(notifications);

      // Log activity
      await base44.entities.ActivityLog.create({
        activity_type: 'notification_sent',
        user_email: (await base44.auth.me()).email,
        description: `Sent notification "${data.title}" to ${targetPartners.length} partner(s)`,
        metadata: {
          notification_type: data.type,
          recipient_count: targetPartners.length,
          send_to_all: data.sendToAll
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notifications sent successfully!');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to send notifications: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.sendToAll && formData.selectedPartners.length === 0) {
      toast.error('Please select at least one partner or choose "Send to All"');
      return;
    }

    sendNotificationMutation.mutate(formData);
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
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Send In-App Notification
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label>Notification Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., New Deadline Reminder, Important Announcement"
              required
            />
          </div>

          <div>
            <Label>Message *</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              placeholder="Enter your notification message..."
              required
            />
          </div>

          <div>
            <Label>Notification Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ Information</SelectItem>
                <SelectItem value="success">✅ Success</SelectItem>
                <SelectItem value="warning">⚠️ Warning</SelectItem>
                <SelectItem value="action_required">🚨 Action Required</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={sendNotificationMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {sendNotificationMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Notification
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}