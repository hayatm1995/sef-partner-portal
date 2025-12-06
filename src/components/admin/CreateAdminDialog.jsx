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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { config } from "@/config";

const APP_URL = config.appUrl;

export default function CreateAdminDialog({ onClose }) {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role_type: "admin"
  });

  const queryClient = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data) => {
      // Check if user exists in backend
      const existingUser = allUsers.find(u => u.email === data.email);
      
      if (!existingUser) {
        throw new Error(`User with email ${data.email} not found. Please create the user in Backend first (Dashboard → Data → User → Create).`);
      }

      const isSuperAdmin = data.role_type === 'super_admin';
      const fullName = `${data.first_name} ${data.last_name}`.trim();

      // Update user to admin role
      await base44.entities.User.update(existingUser.id, {
        is_super_admin: isSuperAdmin
      });

      // Log the activity
      if (currentUser?.email) {
        await base44.entities.ActivityLog.create({
          activity_type: isSuperAdmin ? "admin_promoted" : "user_created",
          user_email: currentUser.email,
          target_user_email: existingUser.email,
          description: `${isSuperAdmin ? 'Super Admin' : 'Admin'} privileges granted: ${fullName} (${existingUser.email})`,
          metadata: {
            user_id: existingUser.id,
            is_super_admin: isSuperAdmin,
            portal_url: APP_URL
          }
        });
      }

      // Send YOUR custom welcome email
      await base44.integrations.Core.SendEmail({
        from_name: "SEF Team",
        to: data.email,
        subject: "Welcome to SEF Partnership Portal - Admin Access",
        body: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ Admin Access Granted</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">SEF Partnership Portal</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${fullName}</strong>,</p>
    
    <p style="margin-bottom: 20px;">You have been granted <strong style="color: #3b82f6;">${isSuperAdmin ? 'Super Admin' : 'Admin'}</strong> access to the Sharjah Entrepreneurship Festival 2026 Partnership Portal.</p>
    
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0;">
      <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px;">🔐 Your Access Details</h2>
      <p style="margin: 8px 0;"><strong>Email:</strong> ${data.email}</p>
      <p style="margin: 8px 0;"><strong>Role:</strong> ${isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
      <p style="margin: 8px 0;"><strong>Portal:</strong> <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none; font-weight: bold;">${APP_URL}</a></p>
    </div>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0;">
      <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">🚀 Getting Started</h2>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Visit: <a href="${APP_URL}" style="color: #10b981; text-decoration: none;">${APP_URL}</a></li>
        <li style="margin: 8px 0;">Click "Login"</li>
        <li style="margin: 8px 0;">Enter your email: <strong>${data.email}</strong></li>
        <li style="margin: 8px 0;">Check your inbox for the secure login link</li>
        <li style="margin: 8px 0;">Click the link to access your admin dashboard</li>
      </ol>
    </div>
    
    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 25px 0;">
      <h2 style="color: #f97316; margin: 0 0 15px 0; font-size: 18px;">📋 Your Responsibilities</h2>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Review partner submissions and deliverables</li>
        <li style="margin: 8px 0;">Manage partner accounts and profiles</li>
        <li style="margin: 8px 0;">Monitor partnership activities and engagement</li>
        <li style="margin: 8px 0;">Communicate with partners via the portal</li>
        ${isSuperAdmin ? '<li style="margin: 8px 0;"><strong>Manage other admin users</strong></li>' : ''}
      </ul>
    </div>
    
    <p style="margin: 25px 0 10px 0;">If you have any questions or need assistance, please contact the SEF Team.</p>
    
    <p style="margin: 25px 0 0 0;">Best regards,<br><strong>The SEF Team</strong></p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0; color: #6b7280; font-size: 12px;">Sharjah Entrepreneurship Festival 2026</p>
    <p style="margin: 5px 0 0 0; color: #f97316; font-weight: bold; font-size: 14px;">"Where We Belong"</p>
  </div>
</body>
</html>`
      });

      return { existingUser, fullName, isSuperAdmin };
    },
    onSuccess: ({ isSuperAdmin }) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['emailInvitations'] });
      toast.success(`✅ ${isSuperAdmin ? 'Super Admin' : 'Admin'} privileges granted and custom welcome email sent!`);
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createAdminMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Grant Admin Access</DialogTitle>
        </DialogHeader>

        <Card className="border-blue-200 bg-blue-50 mb-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">📋 Important: 2-Step Process</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Create user in Backend (Dashboard → Data → User)</li>
                  <li>Enter their email here to grant admin access</li>
                </ol>
                <p className="mt-2 font-medium">✅ Only YOUR custom email will be sent!</p>
                <p className="mt-2 text-xs text-blue-700">🔗 Portal: <strong>{APP_URL}</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Admin Email (must exist in backend) *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="admin@sheraa.ae"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              User must be created in Backend first
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Sarah"
                required
              />
            </div>

            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Johnson"
                required
              />
            </div>
          </div>

          <div>
            <Label>Admin Role *</Label>
            <Select
              value={formData.role_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createAdminMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-purple-700"
            >
              {createAdminMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Grant Access & Send Email
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}