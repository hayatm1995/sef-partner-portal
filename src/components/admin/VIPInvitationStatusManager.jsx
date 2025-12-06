import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { notifyPartnerStatusChange, sendVIPEmailNotification } from "../notifications/VIPNotificationHelper";

export default function VIPInvitationStatusManager({ invitation, onUpdate }) {
  const [newStatus, setNewStatus] = useState(invitation.status);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      // Update the invitation status
      await base44.entities.VIPInvitation.update(id, { status });
      
      // Send in-app notification to partner
      await notifyPartnerStatusChange(
        invitation.partner_email, 
        invitation.event_type, 
        invitation.status, 
        status
      );

      // Send email for confirmed status
      if (status === 'confirmed') {
        const eventNames = {
          opening_ceremony: "Opening Ceremony",
          sef_vault: "SEF Vault",
          closing_ceremony: "Closing Ceremony"
        };
        const eventName = eventNames[invitation.event_type] || invitation.event_type;
        
        await sendVIPEmailNotification(
          invitation.partner_email,
          `Your ${eventName} Guest List is Confirmed!`,
          `
            <h2 style="color: #d97706;">Great News!</h2>
            <p>Your guest list for the <strong>${eventName}</strong> has been confirmed.</p>
            <p><strong>Number of Invites:</strong> ${invitation.invite_count}</p>
            <p>Your guests are all set to attend this exclusive BELONG+ event.</p>
            <p style="margin-top: 20px;">
              <a href="https://sharjahef.com" style="background: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Details in Portal
              </a>
            </p>
          `
        );
      }
      
      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vipInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['allVIPInvitations'] });
      toast.success(`Status updated and partner notified`);
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      toast.error("Failed to update status");
      console.error(error);
    }
  });

  const handleStatusUpdate = () => {
    if (newStatus !== invitation.status) {
      updateMutation.mutate({ id: invitation.id, status: newStatus });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800 border-blue-200",
      processing: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border-green-200"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={newStatus} onValueChange={setNewStatus}>
        <SelectTrigger className="w-32 h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="submitted">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Submitted
            </div>
          </SelectItem>
          <SelectItem value="processing">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3" />
              Processing
            </div>
          </SelectItem>
          <SelectItem value="confirmed">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3" />
              Confirmed
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      
      {newStatus !== invitation.status && (
        <Button 
          size="sm" 
          className="h-8 text-xs bg-amber-600 hover:bg-amber-700"
          onClick={handleStatusUpdate}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Update"
          )}
        </Button>
      )}
    </div>
  );
}