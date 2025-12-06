import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send } from "lucide-react";

export default function AdminNotifications() {
  const [formData, setFormData] = useState({
    partner_email: "",
    title: "",
    message: "",
    type: "info"
  });

  const queryClient = useQueryClient();

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data) => base44.entities.StatusUpdate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statusUpdates'] });
      setFormData({
        partner_email: "",
        title: "",
        message: "",
        type: "info"
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createNotificationMutation.mutate(formData);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Send Notification to Partner</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="partner">Partner *</Label>
            <Select
              value={formData.partner_email}
              onValueChange={(value) => setFormData(prev => ({ ...prev, partner_email: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a partner" />
              </SelectTrigger>
              <SelectContent>
                {partners
                  .filter(p => p.role === 'user')
                  .map((partner) => (
                    <SelectItem key={partner.id} value={partner.email}>
                      {partner.full_name} ({partner.email})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Information</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="action_required">Action Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Notification title"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Notification message"
              rows={4}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={createNotificationMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-600"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Notification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}