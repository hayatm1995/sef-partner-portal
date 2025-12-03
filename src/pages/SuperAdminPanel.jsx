
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Shield, UserCog, AlertCircle, Edit, Trash2, Plus, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import CreateAdminDialog from "../components/admin/CreateAdminDialog";
import RecentActivityFeed from "../components/admin/RecentActivityFeed";

export default function SuperAdminPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.is_super_admin,
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => 
      base44.entities.User.update(userId, { role: newRole }),
    onSuccess: async (updatedUser, variables) => {
      // Log the role change activity
      try {
        if (user) { // Ensure the current user (admin performing the action) is available
          await base44.entities.ActivityLog.create({
            activity_type: "role_changed",
            user_email: user.email,
            target_user_email: updatedUser.email,
            description: `User role changed to "${variables.newRole}" for ${updatedUser.full_name} (${updatedUser.email})`,
            metadata: {
              user_id: updatedUser.id,
              new_role: variables.newRole
            }
          });
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('User role updated successfully');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: async (result, userId) => {
      // Log the deletion activity
      try {
        if (user && selectedUser) { // Ensure the current user and the deleted user are available
          await base44.entities.ActivityLog.create({
            activity_type: "user_deleted",
            user_email: user.email,
            target_user_email: selectedUser.email,
            description: `User account deleted: ${selectedUser.full_name} (${selectedUser.email})`,
            metadata: {
              deleted_user_id: userId
            }
          });
        }
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      toast.success('User deleted successfully');
    },
  });

  const resendNotificationMutation = useMutation({
    mutationFn: async (adminUser) => {
      await base44.integrations.Core.SendEmail({
        from_name: "SEF Team",
        to: adminUser.email,
        subject: "Welcome to SEF Partnership Portal - Admin Access",
        body: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ Admin Access Granted</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">SEF Partnership Portal</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${adminUser.full_name}</strong>,</p>
    
    <p style="margin-bottom: 20px;">You have been granted <strong style="color: #7c3aed;">${adminUser.is_super_admin ? 'Super Admin' : 'Admin'}</strong> access to the Sharjah Entrepreneurship Festival 2026 Partnership Portal.</p>
    
    <div style="background: #f5f3ff; border-left: 4px solid #7c3aed; padding: 20px; margin: 25px 0;">
      <h2 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 18px;">🔐 Your Access Details</h2>
      <p style="margin: 8px 0;"><strong>Email:</strong> ${adminUser.email}</p>
      <p style="margin: 8px 0;"><strong>Role:</strong> ${adminUser.is_super_admin ? 'Super Admin' : 'Admin'}</p>
      <p style="margin: 8px 0;"><strong>Portal:</strong> <a href="${window.location.origin}" style="color: #7c3aed; text-decoration: none;">${window.location.origin}</a></p>
    </div>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0;">
      <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">🚀 Getting Started</h2>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Visit the portal using the link above</li>
        <li style="margin: 8px 0;">Click on "Login" and use your email address</li>
        <li style="margin: 8px 0;">You'll receive a magic link to access your account</li>
        <li style="margin: 8px 0;">Once logged in, you'll have full ${adminUser.is_super_admin ? 'super admin' : 'admin'} privileges</li>
      </ol>
    </div>
    
    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 25px 0;">
      <h2 style="color: #f97316; margin: 0 0 15px 0; font-size: 18px;">📋 Your Responsibilities</h2>
      ${adminUser.is_super_admin ? `
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Manage admin users and permissions</li>
        <li style="margin: 8px 0;">Oversee all partner operations</li>
        <li style="margin: 8px 0;">Configure system settings</li>
      </ul>
      ` : `
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Review partner submissions</li>
        <li style="margin: 8px 0;">Manage partner accounts</li>
        <li style="margin: 8px 0;">Monitor partnership activities</li>
      </ul>
      `}
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

      // Log the email
      if (user?.email) {
        await base44.entities.ActivityLog.create({
          activity_type: "email_sent",
          user_email: user.email,
          target_user_email: adminUser.email,
          description: `Admin welcome email resent to ${adminUser.full_name} (${adminUser.email})`,
          metadata: {
            email_type: "admin_welcome_resend",
            subject: "Welcome to SEF Partnership Portal - Admin Access",
            is_super_admin: adminUser.is_super_admin
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailInvitations'] });
      toast.success('Welcome email resent successfully');
    },
    onError: (error) => {
      toast.error('Failed to resend email: ' + error.message);
    }
  });

  if (!user?.is_super_admin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Super Admin access required</p>
      </div>
    );
  }

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const superAdminUsers = filteredUsers.filter(u => u.is_super_admin);
  const adminUsers = filteredUsers.filter(u => u.role === 'admin' && !u.is_super_admin);
  const regularUsers = filteredUsers.filter(u => u.role === 'user');

  const getRoleBadge = (role, isSuperAdmin) => {
    if (isSuperAdmin) {
      return { color: "bg-purple-100 text-purple-800", label: "Super Admin" };
    }
    const configs = {
      admin: { color: "bg-blue-100 text-blue-800", label: "Admin" },
      user: { color: "bg-green-100 text-green-800", label: "Partner" }
    };
    return configs[role] || configs.user;
  };

  const handleRoleChange = (userId, newRole) => {
    updateUserRoleMutation.mutate({ userId, newRole });
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleResendNotification = (adminUser) => {
    resendNotificationMutation.mutate(adminUser);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Panel</h1>
            <p className="text-gray-600">Manage admin users and permissions</p>
          </div>
          <Button
            onClick={() => setShowCreateAdmin(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Admin
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Super Admins</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {superAdminUsers.length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {adminUsers.length}
                  </p>
                </div>
                <UserCog className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Partners</p>
                  <p className="text-2xl font-bold text-green-700">
                    {regularUsers.length}
                  </p>
                </div>
                <UserCog className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed - PROMINENT DISPLAY */}
        <div className="mb-8">
          <RecentActivityFeed />
        </div>

        {/* Search */}
        <Card className="mb-6 border-purple-100">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Super Admin Users Table */}
        {superAdminUsers.length > 0 && (
          <Card className="mb-6 border-purple-100 shadow-md">
            <CardHeader>
              <CardTitle>Super Admin Users ({superAdminUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {superAdminUsers.map((adminUser) => {
                      const roleBadge = getRoleBadge(adminUser.role, adminUser.is_super_admin);
                      return (
                        <TableRow key={adminUser.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {adminUser.full_name}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleResendNotification(adminUser)}
                                disabled={resendNotificationMutation.isPending}
                                title="Resend welcome email"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{adminUser.email}</TableCell>
                          <TableCell>
                            <Badge className={roleBadge.color}>{roleBadge.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value={adminUser.is_super_admin ? "super_admin" : adminUser.role}
                                onValueChange={(newRole) => {
                                  if (newRole === "super_admin") {
                                    base44.entities.User.update(adminUser.id, { is_super_admin: true, role: 'admin' });
                                  } else {
                                    base44.entities.User.update(adminUser.id, { is_super_admin: false, role: newRole });
                                  }
                                  queryClient.invalidateQueries({ queryKey: ['allUsers'] });
                                }}
                                disabled={adminUser.id === user.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="user">Partner</SelectItem>
                                </SelectContent>
                              </Select>
                              {adminUser.id !== user.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteUser(adminUser)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Users Table */}
        {adminUsers.length > 0 && (
          <Card className="mb-6 border-blue-100 shadow-md">
            <CardHeader>
              <CardTitle>Admin Users ({adminUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((adminUser) => {
                      const roleBadge = getRoleBadge(adminUser.role, adminUser.is_super_admin);
                      return (
                        <TableRow key={adminUser.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {adminUser.full_name}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleResendNotification(adminUser)}
                                disabled={resendNotificationMutation.isPending}
                                title="Resend welcome email"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{adminUser.email}</TableCell>
                          <TableCell>
                            <Badge className={roleBadge.color}>{roleBadge.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Select
                                value="admin"
                                onValueChange={(newRole) => {
                                  if (newRole === "super_admin") {
                                    base44.entities.User.update(adminUser.id, { is_super_admin: true, role: 'admin' });
                                  } else {
                                    handleRoleChange(adminUser.id, newRole);
                                  }
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="user">Partner</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(adminUser)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regular Users Table */}
        <Card className="border-green-100 shadow-md">
          <CardHeader>
            <CardTitle>Partner Users ({regularUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularUsers.map((regularUser) => (
                    <TableRow key={regularUser.id}>
                      <TableCell className="font-medium">{regularUser.full_name}</TableCell>
                      <TableCell>{regularUser.company_name || '-'}</TableCell>
                      <TableCell>{regularUser.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value="user"
                            onValueChange={(newRole) => {
                              if (newRole === "super_admin") {
                                base44.entities.User.update(regularUser.id, { is_super_admin: true, role: 'admin' });
                              } else {
                                handleRoleChange(regularUser.id, newRole);
                              }
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">Partner</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(regularUser)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Admin Dialog */}
      {showCreateAdmin && (
        <CreateAdminDialog onClose={() => setShowCreateAdmin(false)} />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account for{" "}
              <span className="font-semibold">{selectedUser?.full_name}</span> ({selectedUser?.email}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserMutation.mutate(selectedUser?.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
