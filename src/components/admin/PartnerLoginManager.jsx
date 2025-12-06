
import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Mail, Trash2, Key, UserPlus, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PartnerLoginManager({ partnerEmail, partnerName, onClose }) {
  const [showAddLogin, setShowAddLogin] = useState(false);
  const [loginToDelete, setLoginToDelete] = useState(null);
  const [formData, setFormData] = useState({
    login_email: "",
    full_name: "",
    role_label: "",
    notes: ""
  });

  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: logins = [] } = useQuery({
    queryKey: ['partnerLogins', partnerEmail],
    queryFn: () => base44.entities.PartnerLogin.filter({ partner_email: partnerEmail }),
    enabled: !!partnerEmail,
  });

  const createLoginMutation = useMutation({
    mutationFn: async (data) => {
      // Check if user exists in backend
      const allUsers = await base44.entities.User.list();
      const existingUser = allUsers.find(u => u.email === data.login_email);
      
      if (!existingUser) {
        throw new Error(`User with email ${data.login_email} not found. Please create the user in Backend first (Dashboard → Data → User → Create).`);
      }

      // Create the login mapping
      const login = await base44.entities.PartnerLogin.create({
        login_email: data.login_email,
        partner_email: partnerEmail,
        role_label: data.role_label,
        notes: data.notes,
        is_admin_access: false,
        status: "active"
      });

      // Send YOUR custom welcome email
      await base44.integrations.Core.SendEmail({
        from_name: "SEF Team",
        to: data.login_email,
        subject: `Welcome to ${partnerName} Partnership Portal`,
        body: `Dear ${data.full_name || existingUser.full_name || 'Team Member'},

Welcome to the Sharjah Entrepreneurship Festival 2026 Partnership Portal!

You now have access to the ${partnerName} dashboard${data.role_label ? ` as ${data.role_label}` : ''}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 YOUR LOGIN DETAILS

Email: ${data.login_email}
Partner: ${partnerName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 HOW TO ACCESS YOUR DASHBOARD

1. Visit: ${window.location.origin}

2. Click the "Login" button

3. Enter your email: ${data.login_email}

4. Check your email inbox - you'll receive an instant secure login link

5. Click the link and you're in! (No password needed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 WHAT YOU CAN DO

✓ Upload deliverables and documents
✓ Submit nominations for speakers and startups  
✓ Track important deadlines
✓ Access partnership resources
✓ Book event sessions
✓ View your complete dashboard

All team members on this account share the same dashboard and information.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Contact the SEF Team at sefteam@sheraa.ae

Best regards,
The SEF Partnership Team

Sharjah Entrepreneurship Festival 2026
"Where We Belong"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Note: This portal uses secure, passwordless login. You'll receive a new login link via email each time you access the portal - it's faster and more secure than traditional passwords.`
      });

      // Log the email
      if (currentUser?.email) {
        await base44.entities.ActivityLog.create({
          activity_type: "email_sent",
          user_email: currentUser.email,
          target_user_email: data.login_email,
          description: `Team member login access granted: ${data.full_name || existingUser.full_name} (${data.login_email}) for ${partnerName}`,
          metadata: {
            email_type: "team_member_invitation",
            subject: `Welcome to ${partnerName} Partnership Portal`,
            partner_email: partnerEmail,
            partner_name: partnerName,
            role_label: data.role_label
          }
        });
      }

      return login;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerLogins'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['emailInvitations'] });
      setShowAddLogin(false);
      setFormData({ login_email: "", full_name: "", role_label: "", notes: "" });
      toast.success('✅ Login created! Your custom welcome email sent successfully.');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteLoginMutation = useMutation({
    mutationFn: async (login) => {
      // Delete the login mapping
      await base44.entities.PartnerLogin.delete(login.id);
      
      // Optionally delete the user account if they don't have other mappings
      const otherMappings = await base44.entities.PartnerLogin.filter({ 
        login_email: login.login_email 
      });
      
      if (otherMappings.filter(m => m.id !== login.id).length === 0) {
        // This was their only mapping, delete the user account
        const users = await base44.entities.User.list();
        const userToDelete = users.find(u => u.email === login.login_email);
        if (userToDelete) {
          await base44.entities.User.delete(userToDelete.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partnerLogins'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      setLoginToDelete(null);
      toast.success('Login access removed');
    },
  });

  const resendWelcomeEmailMutation = useMutation({
    mutationFn: async (login) => {
      // Get the user's full name
      const users = await base44.entities.User.list();
      const user = users.find(u => u.email === login.login_email);
      
      await base44.integrations.Core.SendEmail({
        from_name: "SEF Team",
        to: login.login_email,
        subject: `${partnerName} Partnership Portal - Login Instructions`,
        body: `Dear ${user?.full_name || 'Team Member'},

Here are your login instructions for the ${partnerName} partnership dashboard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 YOUR LOGIN DETAILS

Email: ${login.login_email}
Partner: ${partnerName}
${login.role_label ? `Role: ${login.role_label}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 HOW TO LOGIN

1. Visit: ${window.location.origin}

2. Click "Login"

3. Enter your email: ${login.login_email}

4. Check your inbox for an instant secure login link

5. Click the link to access your dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

No password needed - just click the link we send you each time!

Best regards,
The SEF Team`
      });

      // Log the email
      if (currentUser?.email) {
        await base44.entities.ActivityLog.create({
          activity_type: "email_sent",
          user_email: currentUser.email,
          target_user_email: login.login_email,
          description: `Login reminder resent to ${user?.full_name || login.login_email} for ${partnerName}`,
          metadata: {
            email_type: "team_member_login_reminder",
            subject: `${partnerName} Partnership Portal - Login Instructions`,
            partner_email: partnerEmail,
            partner_name: partnerName
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailInvitations'] });
      toast.success('✅ Welcome email resent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send email: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.login_email) {
      toast.error('Please enter an email address');
      return;
    }
    createLoginMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Login Access - {partnerName}</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Add multiple email logins for different team members. All logins share the same partner dashboard and data.
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Authentication Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Passwordless Authentication</p>
                  <p>This portal uses magic link authentication. Users receive a secure login link via email - no password needed. This is more secure and easier to manage.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add New Login Button */}
          {!showAddLogin && (
            <Button
              onClick={() => setShowAddLogin(true)}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Team Member Login
            </Button>
          )}

          {/* Add Login Form */}
          {showAddLogin && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      value={formData.login_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, login_email: e.target.value }))}
                      placeholder="john@company.com"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      This person will receive login instructions via email
                    </p>
                  </div>

                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="John Smith"
                      required
                    />
                  </div>

                  <div>
                    <Label>Department/Role (Optional)</Label>
                    <Input
                      value={formData.role_label}
                      onChange={(e) => setFormData(prev => ({ ...prev, role_label: e.target.value }))}
                      placeholder="e.g., Marketing Manager, Production Lead, Events Coordinator"
                    />
                  </div>

                  <div>
                    <Label>Internal Notes (Optional)</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any notes about this team member..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={createLoginMutation.isPending}
                      className="bg-gradient-to-r from-green-600 to-emerald-700"
                    >
                      {createLoginMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Login & Send Instructions
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddLogin(false);
                        setFormData({ login_email: "", full_name: "", role_label: "", notes: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Current Logins */}
          <Card>
            <CardHeader>
              <CardTitle>Team Member Logins ({logins.filter(l => l.status === 'active').length})</CardTitle>
            </CardHeader>
            <CardContent>
              {logins.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role/Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logins.map((login) => (
                      <TableRow key={login.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{login.login_email}</span>
                            {login.is_admin_access && (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                Admin
                              </Badge>
                            )}
                          </div>
                          {login.notes && (
                            <p className="text-xs text-gray-500 mt-1">{login.notes}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {login.role_label ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {login.role_label}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {login.status === 'active' ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendWelcomeEmailMutation.mutate(login)}
                              disabled={resendWelcomeEmailMutation.isPending}
                              title="Resend login instructions"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLoginToDelete(login)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Key className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
                  <p className="text-gray-600">Add email logins to give team members access to this partner dashboard</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Delete Confirmation */}
        <AlertDialog open={!!loginToDelete} onOpenChange={() => setLoginToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Login Access?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove login access for <strong>{loginToDelete?.login_email}</strong>.
                They will no longer be able to access this partner dashboard.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteLoginMutation.mutate(loginToDelete)}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove Access
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
