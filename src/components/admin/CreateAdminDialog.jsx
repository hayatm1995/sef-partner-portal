import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { createUserWithAdminAPI } from "@/services/userManagementService";
import { partnerUsersService } from "@/services/supabaseService";
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
import { supabase } from "@/config/supabase";

const APP_URL = config.appUrl;

export default function CreateAdminDialog({ onClose }) {
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role_type: "admin"
  });

  const queryClient = useQueryClient();

  const createAdminMutation = useMutation({
    mutationFn: async (data) => {
      const isSuperAdmin = data.role_type === 'super_admin';
      const fullName = `${data.first_name} ${data.last_name}`.trim();
      const role = isSuperAdmin ? 'superadmin' : 'admin';

      // Check if user already exists in partner_users
      const existingPartnerUser = await partnerUsersService.getByEmail(data.email);
      if (existingPartnerUser) {
        throw new Error(`User with email ${data.email} already exists. Please update their role instead.`);
      }

      // Get or create Sheraa partner (for admins)
      let sheraaPartnerId = null;
      try {
        const { data: partners, error: partnerError } = await supabase
          .from('partners')
          .select('id')
          .or('name.ilike.%sheraa%,name.eq.Sheraa')
          .limit(1)
          .single();

        if (partnerError && partnerError.code !== 'PGRST116') {
          console.warn('Error fetching Sheraa partner:', partnerError);
        } else if (partners) {
          sheraaPartnerId = partners.id;
        } else {
          // Create Sheraa partner if it doesn't exist
          const { data: newPartner, error: createError } = await supabase
            .from('partners')
            .insert({
              name: 'Sheraa',
              tier: 'Organizer',
              assigned_account_manager: 'SEF Team',
              website_url: 'https://sheraa.ae'
            })
            .select('id')
            .single();

          if (createError) {
            console.warn('Error creating Sheraa partner:', createError);
          } else {
            sheraaPartnerId = newPartner.id;
          }
        }
      } catch (error) {
        console.warn('Error handling Sheraa partner:', error);
      }

      // Generate a temporary password
      const tempPassword = 'SEF!' + Math.random().toString(36).slice(-10) + '!';

      try {
        // Create auth user and partner_user record
        const result = await createUserWithAdminAPI({
          email: data.email,
          password: tempPassword,
          fullName: fullName,
          role: role,
          partnerId: sheraaPartnerId,
        });

        // Update the partner_user role to match (in case it was set incorrectly)
        if (result.partnerUser) {
          await partnerUsersService.update(result.partnerUser.id, {
            role: role,
          });
        }

        return {
          ...result,
          fullName,
          isSuperAdmin,
        };
      } catch (error) {
        console.error('Error creating admin user:', error);
        // Provide more helpful error message
        if (error.message?.includes('Service role key')) {
          throw new Error('Admin user creation requires server configuration. Please contact your system administrator or set up an Edge Function for user creation.');
        }
        throw error;
      }
    },
    onSuccess: ({ fullName, isSuperAdmin, magicLink }) => {
      // Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['allUsersForDropdown'] });
      queryClient.invalidateQueries({ queryKey: ['allAdmins'] }); // For AdminOperations dropdown
      queryClient.invalidateQueries({ queryKey: ['allPartnerUsers'] }); // For AdminPanel
      queryClient.invalidateQueries({ queryKey: ['emailInvitations'] });
      
      toast.success(`✅ ${isSuperAdmin ? 'Super Admin' : 'Admin'} created successfully! Welcome email will be sent.`);
      onClose();
    },
    onError: (error) => {
      console.error('Create admin error:', error);
      toast.error(error.message || 'Failed to create admin user');
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
          <DialogTitle>Create Admin User</DialogTitle>
        </DialogHeader>

        <Card className="border-blue-200 bg-blue-50 mb-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">✨ Create Admin Directly</p>
                <p className="mb-2">Enter the admin's details below. A new account will be created automatically.</p>
                <p className="font-medium">✅ A welcome email with login instructions will be sent!</p>
                <p className="mt-2 text-xs text-blue-700">🔗 Portal: <strong>{APP_URL}</strong></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Admin Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="admin@sheraa.ae"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              A new account will be created for this email
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
              Create Admin & Send Email
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
