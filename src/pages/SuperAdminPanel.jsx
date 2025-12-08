
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { partnerUsersService } from "@/services/supabaseService";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { user: authUser, role } = useAuth();
  const queryClient = useQueryClient();

  // Check for impersonation and redirect if needed
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const viewAsPartnerId = urlParams.get('viewAs');
    if (viewAsPartnerId) {
      navigate('/dashboard', { replace: true });
    }
  }, [location.search, navigate]);

  const { partnerId } = useAuth();

  // Fetch all users from Supabase partner_users table (role-based filtering)
  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError } = useQuery({
    queryKey: ['allUsers', role, partnerId],
    queryFn: async () => {
      try {
        const result = await partnerUsersService.getAll({
          role: role || undefined,
          currentUserAuthId: authUser?.id || undefined,
        });
        console.log('[SuperAdminPanel] Fetched users:', result?.length || 0);
        return result || [];
      } catch (error) {
        console.error('[SuperAdminPanel] Error fetching users:', error);
        toast.error('Failed to load users: ' + error.message);
        return [];
      }
    },
    enabled: role === 'superadmin' || role === 'admin',
    retry: 1,
  });

  // Enhanced debugging
  React.useEffect(() => {
    console.log('[SuperAdminPanel] Debug Info:', {
      role,
      isSuperAdmin: role === 'superadmin',
      queryEnabled: role === 'superadmin',
      allUsersCount: allUsers.length,
      isLoading: isLoadingUsers,
      error: usersError,
      errorMessage: usersError?.message,
      firstUser: allUsers[0] || null,
    });
    
    if (usersError) {
      console.error('[SuperAdminPanel] User fetch error details:', {
        error: usersError,
        message: usersError.message,
        code: usersError.code,
        details: usersError.details,
        hint: usersError.hint,
      });
    }
  }, [role, allUsers.length, isLoadingUsers, usersError]);

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }) => {
      // Map UI roles to database roles
      const dbRole = newRole === 'super_admin' ? 'superadmin' : newRole;
      return partnerUsersService.update(userId, { role: dbRole });
    },
    onSuccess: async (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['allUsersForDropdown'] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role: ' + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId) => partnerUsersService.delete(userId),
    onSuccess: async (result, userId) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['allUsersForDropdown'] });
      setShowDeleteDialog(false);
      setSelectedUser(null);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user: ' + error.message);
    },
  });

  const toggleUserDisabledMutation = useMutation({
    mutationFn: ({ userId, isDisabled }) => {
      return partnerUsersService.update(userId, { is_disabled: isDisabled });
    },
    onSuccess: async (updatedUser, variables) => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success(`User ${variables.isDisabled ? 'disabled' : 'enabled'} successfully`);
    },
    onError: (error) => {
      console.error('Error toggling user disabled status:', error);
      toast.error('Failed to update user status: ' + error.message);
    },
  });

  const resendNotificationMutation = useMutation({
    mutationFn: async (adminUser) => {
      // TODO: Implement email sending via Supabase Edge Function or Resend
      // For now, just show a success message
      const isSuperAdmin = adminUser.role === 'superadmin';
      console.log('Would send email to:', adminUser.email, 'Role:', isSuperAdmin ? 'Super Admin' : 'Admin');
      
      // In production, call your email service here
      // await sendAdminWelcomeEmail(adminUser.email, adminUser.full_name, isSuperAdmin);
    },
    onSuccess: () => {
      toast.success('Welcome email resent successfully');
    },
    onError: (error) => {
      toast.error('Failed to resend email: ' + error.message);
    }
  });

  // Check if user is superadmin - use role from AuthContext
  const isSuperAdmin = role === 'superadmin';
  
  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Superadmin access required. Only users with superadmin role can access Admin Command Center.</p>
      </div>
    );
  }

  // Filter users by search query
  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorize users by role (from Supabase partner_users table)
  const superAdminUsers = filteredUsers.filter(u => u.role === 'superadmin');
  const adminUsers = filteredUsers.filter(u => u.role === 'admin');
  const regularUsers = filteredUsers.filter(u => u.role === 'partner' || !u.role || (u.role !== 'admin' && u.role !== 'superadmin'));

  const getRoleBadge = (role) => {
    const configs = {
      superadmin: { color: "bg-purple-100 text-purple-800", label: "Super Admin" },
      admin: { color: "bg-blue-100 text-blue-800", label: "Admin" },
      partner: { color: "bg-green-100 text-green-800", label: "Partner" }
    };
    return configs[role] || configs.partner;
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Command Center</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className="border-orange-100 hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => navigate('/admin/users')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">User Management</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {allUsers.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total Users</p>
                </div>
                <UserCog className="w-12 h-12 text-orange-400" />
              </div>
            </CardContent>
          </Card>
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

        {/* All Users Table - Unified View */}
        <Card className="mb-6 border-purple-100 shadow-md">
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Manage all users from partner_users table. Hide self from disable actions.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const roleBadge = getRoleBadge(user.role);
                    const isCurrentUser = user.auth_user_id === authUser?.id;
                    const isSuperAdminUser = user.role === 'superadmin';
                    const partnerName = user.partners?.name || 'N/A';
                    const isDisabled = user.is_disabled === true;
                    
                    return (
                      <TableRow key={user.id} className={isDisabled ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.full_name}
                            {isDisabled && (
                              <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                                Disabled
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={roleBadge.color}>{roleBadge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{partnerName}</span>
                        </TableCell>
                        <TableCell>
                          {isDisabled ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Disabled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Enable/Disable Button */}
                            {!isCurrentUser && !isSuperAdminUser && (
                              <Button
                                variant={isDisabled ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  toggleUserDisabledMutation.mutate({ 
                                    userId: user.id, 
                                    isDisabled: !isDisabled 
                                  });
                                }}
                                disabled={toggleUserDisabledMutation.isPending}
                                className={isDisabled ? "bg-green-600 hover:bg-green-700" : "border-red-200 text-red-600 hover:bg-red-50"}
                              >
                                {isDisabled ? 'Enable' : 'Disable'}
                              </Button>
                            )}
                            
                            {/* Role Change - Only superadmin can change roles, and only partner → admin */}
                            {isSuperAdmin && !isCurrentUser && (
                              <Select
                                value={user.role === 'superadmin' ? "superadmin" : user.role || "partner"}
                                onValueChange={(newRole) => {
                                  // Only allow partner → admin for non-superadmin users
                                  if (user.role === 'superadmin') {
                                    toast.error('Cannot change superadmin role');
                                    return;
                                  }
                                  if (newRole === 'superadmin' && user.role !== 'superadmin') {
                                    toast.error('Only superadmins can be assigned superadmin role');
                                    return;
                                  }
                                  updateUserRoleMutation.mutate({ 
                                    userId: user.id, 
                                    newRole: newRole === 'super_admin' ? 'superadmin' : newRole 
                                  });
                                }}
                                disabled={isSuperAdminUser}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {isSuperAdmin && <SelectItem value="superadmin">Super Admin</SelectItem>}
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="partner">Partner</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            {/* Delete Button - Hide for current user and superadmins */}
                            {!isCurrentUser && !isSuperAdminUser && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
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

        {/* Legacy Tables - Keep for reference but hide */}
        {false && superAdminUsers.length > 0 && (
          <Card className="mb-6 border-purple-100 shadow-md">
            <CardHeader>
              <CardTitle>Superadmin Users ({superAdminUsers.length})</CardTitle>
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
                      const roleBadge = getRoleBadge(adminUser.role);
                      const isCurrentUser = adminUser.auth_user_id === authUser?.id;
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
                                value={adminUser.role === 'superadmin' ? "super_admin" : adminUser.role}
                                onValueChange={(newRole) => {
                                  updateUserRoleMutation.mutate({ 
                                    userId: adminUser.id, 
                                    newRole: newRole === 'super_admin' ? 'superadmin' : newRole 
                                  });
                                }}
                                disabled={isCurrentUser}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="partner">Partner</SelectItem>
                                </SelectContent>
                              </Select>
                              {!isCurrentUser && (
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

        {false && adminUsers.length > 0 && (
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
                      const roleBadge = getRoleBadge(adminUser.role);
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
                                value={adminUser.role}
                                onValueChange={(newRole) => {
                                  updateUserRoleMutation.mutate({ 
                                    userId: adminUser.id, 
                                    newRole: newRole === 'super_admin' ? 'superadmin' : newRole 
                                  });
                                }}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="partner">Partner</SelectItem>
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
                  {regularUsers.map((regularUser) => {
                    const partnerName = regularUser.partners?.name || '-';
                    return (
                      <TableRow key={regularUser.id}>
                        <TableCell className="font-medium">{regularUser.full_name}</TableCell>
                        <TableCell>{partnerName}</TableCell>
                        <TableCell>{regularUser.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Select
                              value={regularUser.role || 'partner'}
                              onValueChange={(newRole) => {
                                updateUserRoleMutation.mutate({ 
                                  userId: regularUser.id, 
                                  newRole: newRole === 'super_admin' ? 'superadmin' : (newRole === 'user' ? 'partner' : newRole)
                                });
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="partner">Partner</SelectItem>
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
                    );
                  })}
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
