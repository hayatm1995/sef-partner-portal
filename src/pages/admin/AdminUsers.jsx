import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { partnersService } from '@/services/supabaseService';
import { createUserViaAPI } from '@/services/userManagementService';
import { supabase } from '@/config/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  Loader2,
  CheckCircle,
  XCircle,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'sef_admin' || user?.is_super_admin;
  const isSuperAdmin = user?.role === 'sef_admin';

  // Fetch all partner users
  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      // Get all partner_users
      const { data, error } = await supabase
        .from('partner_users')
        .select(`
          *,
          partners (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  // Fetch all partners for dropdown
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => partnersService.getAll(),
    enabled: isAdmin,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      // Check if email already exists
      const existingUser = allUsers.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create user via backend API
      const result = await createUserViaAPI({
        email: userData.email,
        fullName: userData.fullName,
        partnerId: userData.partnerId || null,
        role: userData.role,
      });

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      toast.success('User created successfully! Onboarding email sent.');
      setShowCreateDialog(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create user');
    }
  });

  // Filter users
  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return allUsers;
    
    const query = searchQuery.toLowerCase();
    return allUsers.filter(u => 
      u.email?.toLowerCase().includes(query) ||
      u.full_name?.toLowerCase().includes(query) ||
      u.partners?.name?.toLowerCase().includes(query)
    );
  }, [allUsers, searchQuery]);

  const getRoleBadge = (role) => {
    const configs = {
      admin: { color: 'bg-blue-100 text-blue-800', label: 'Admin' },
      sef_admin: { color: 'bg-purple-100 text-purple-800', label: 'Superadmin' },
      viewer: { color: 'bg-gray-100 text-gray-800', label: 'Partner' },
      owner: { color: 'bg-green-100 text-green-800', label: 'Owner' },
    };
    return configs[role] || configs.viewer;
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Create and manage partner portal users</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-600"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by email, name, or partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const roleConfig = getRoleBadge(user.role);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>{user.full_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={roleConfig.color}>
                              {roleConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.partners?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {user.auth_user_id ? (
                              <Badge variant="outline" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No users found</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <CreateUserForm
              partners={allPartners}
              isSuperAdmin={isSuperAdmin}
              onSubmit={(data) => createUserMutation.mutate(data)}
              isLoading={createUserMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}

// Create User Form Component
function CreateUserForm({ partners, isSuperAdmin, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    role: 'partner',
    partnerId: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.fullName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.role === 'partner' && !formData.partnerId) {
      toast.error('Please select a partner for partner users');
      return;
    }

    if (formData.role === 'admin' && !isSuperAdmin) {
      toast.error('Only superadmins can create admin users');
      return;
    }

    onSubmit(formData);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Email *</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="user@example.com"
          required
        />
      </div>
      <div>
        <Label>Full Name *</Label>
        <Input
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          placeholder="John Doe"
          required
        />
      </div>
      <div>
        <Label>Role *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
          required
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="partner">Partner</SelectItem>
            {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
          </SelectContent>
        </Select>
        {formData.role === 'admin' && !isSuperAdmin && (
          <p className="text-sm text-red-600 mt-1">Only superadmins can create admin users</p>
        )}
      </div>
      {formData.role === 'partner' && (
        <div>
          <Label>Assign Partner *</Label>
          <Select
            value={formData.partnerId}
            onValueChange={(value) => setFormData({ ...formData, partnerId: value })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select partner" />
            </SelectTrigger>
            <SelectContent>
              {partners.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

