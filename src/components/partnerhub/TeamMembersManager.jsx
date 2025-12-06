import React, { useState } from "react";
import { activityLogService } from "@/services/supabaseService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Mail, Trash2, UserPlus, Loader2, CheckCircle, XCircle, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { config } from "@/config";

const APP_URL = config.appUrl;

export default function TeamMembersManager({ partnerEmail, partnerName, showAllPartners }) {
  const [showAddForm, setShowAddForm] = useState(false);
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
    staleTime: Infinity,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: partnerProfiles = [] } = useQuery({
    queryKey: ['partnerProfiles'],
    queryFn: () => base44.entities.PartnerProfile.list(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', partnerEmail],
    queryFn: () => base44.entities.PartnerLogin.filter({
      partner_email: partnerEmail,
      status: 'active'
    }),
    enabled: !!partnerEmail,
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async ({ loginRecord, isReminder = false }) => {
      const loginUser = allUsers.find(u => u.email === loginRecord.login_email);
      const partnerUser = allUsers.find(u => u.email === loginRecord.partner_email);
      const profile = partnerProfiles.find(p => p.partner_email === loginRecord.partner_email);

      const subject = isReminder
        ? `Reminder: Your SEF Partner Portal Access - ${partnerUser?.company_name || partnerName || 'Partner Account'}`
        : `Welcome to SEF Partner Portal - ${partnerUser?.company_name || partnerName || 'Partner Account'}`;

      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Sharjah Entrepreneurship Festival</h1>
            <p style="color: #d1fae5; margin: 10px 0 0 0;">Partner Portal</p>
          </div>
          
          <div style="padding: 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
            <h2 style="color: #374151; margin: 0 0 20px 0;">Hello ${loginUser?.full_name || loginRecord.login_email}!</h2>
            
            <p style="margin: 10px 0; color: #374151; line-height: 1.6;">
              ${isReminder
                ? 'This is a reminder that you have been granted access to the SEF Partner Portal but haven\'t logged in yet.'
                : 'You have been granted access to the SEF Partner Portal as a team member.'}
            </p>
            
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1e40af;"><strong>Partner Organization:</strong> ${partnerUser?.company_name || partnerName || loginRecord.partner_email}</p>
              ${loginRecord.role_label ? `<p style="margin: 5px 0 0 0; color: #1e40af;"><strong>Your Role:</strong> ${loginRecord.role_label}</p>` : ''}
              ${loginRecord.notes ? `<p style="margin: 5px 0 0 0; color: #1e40af;">${loginRecord.notes}</p>` : ''}
            </div>
            
            <p style="margin: 10px 0; color: #374151; line-height: 1.6;">
              Through the portal, you can:
            </p>
            
            <ul style="margin: 15px 0; padding-left: 25px; color: #374151; line-height: 1.8;">
              <li>Access partnership resources and materials</li>
              <li>Submit deliverables and nominations</li>
              <li>Track deadlines and requirements</li>
              <li>View event schedules and information</li>
              <li>Communicate with the SEF team</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Access Partner Portal
              </a>
            </div>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Best regards,</p>
            <p style="margin: 0 0 20px 0; color: #374151; font-weight: bold;">SEF Team</p>
            
            <div style="border-top: 2px solid #10b981; padding-top: 20px; margin-top: 20px;">
              <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;"><strong>How to Login:</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px; color: #6b7280; font-size: 13px; line-height: 1.8;">
                <li><strong>Option 1 (Recommended):</strong> Login with <strong>Microsoft</strong> or <strong>Google</strong>
                  <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Visit: <a href="${APP_URL}" style="color: #10b981; text-decoration: none;">${APP_URL}</a></li>
                    <li>Click the Microsoft or Google login button</li>
                    <li>Use the email: <strong>${loginRecord.login_email}</strong></li>
                    <li>Authorize the connection</li>
                  </ul>
                </li>
                <li><strong>Option 2:</strong> Set up email & password:
                  <ol style="margin: 5px 0; padding-left: 20px;">
                    <li>Visit: <a href="${APP_URL}" style="color: #10b981; text-decoration: none;">${APP_URL}</a></li>
                    <li>Enter your email: <strong>${loginRecord.login_email}</strong></li>
                    <li>Click <strong>"Forgot Password"</strong></li>
                    <li>Check your inbox for the password reset email</li>
                    <li>Create a new password</li>
                    <li>Login with your email and password</li>
                  </ol>
                </li>
              </ul>
              <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
                <strong>Note:</strong> If you don't receive the password reset email, check your spam folder.
              </p>
            </div>
            
            ${profile?.account_manager_name ? `
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">Partnership Account Manager:</p>
                <p style="margin: 0; color: #374151; font-weight: bold;">${profile.account_manager_name}</p>
                ${profile.account_manager_email ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px;">${profile.account_manager_email}</p>` : ''}
              </div>
            ` : ''}
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Sharjah Entrepreneurship Festival. All rights reserved.
              </p>
              <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                Portal: ${APP_URL}
              </p>
            </div>
          </div>
        </div>
      `;

      await base44.integrations.Core.SendEmail({
        from_name: 'SEF Team',
        to: loginRecord.login_email,
        subject,
        body
      });

      await base44.entities.ActivityLog.create({
        activity_type: 'email_sent',
        user_email: currentUser?.email,
        target_user_email: loginRecord.login_email,
        description: `${isReminder ? 'Login reminder' : 'Team member invitation'} sent to ${loginUser?.full_name || loginRecord.login_email}`,
        metadata: {
          email_type: isReminder ? 'team_member_login_reminder' : 'team_member_invitation',
          partner_email: loginRecord.partner_email,
          partner_name: partnerUser?.full_name || partnerUser?.company_name || partnerName,
          role_label: loginRecord.role_label,
          subject
        }
      });

      return { success: true };
    },
    onSuccess: (_, { isReminder }) => {
      toast.success(isReminder ? 'Reminder sent successfully' : 'Invitation sent successfully');
      queryClient.invalidateQueries({ queryKey: ['emailInvitations'] });
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`);
    },
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async (data) => {
      let userExists = allUsers.find(u => u.email === data.login_email);

      if (!userExists) {
        throw new Error(`User with email ${data.login_email} not found. Please ask your admin to create the user in Backend first.`);
      }

      const login = await base44.entities.PartnerLogin.create({
        login_email: data.login_email,
        partner_email: partnerEmail,
        role_label: data.role_label,
        notes: data.notes,
        is_admin_access: false,
        status: "active"
      });

      return login;
    },
    onSuccess: (newLoginRecord) => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setShowAddForm(false);
      setFormData({ login_email: "", full_name: "", role_label: "", notes: "" });
      sendInvitationMutation.mutate({ loginRecord: newLoginRecord, isReminder: false });
      toast.success('✅ Team member added! Invitation email being sent.');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const deleteTeamMemberMutation = useMutation({
    mutationFn: async (login) => {
      await base44.entities.PartnerLogin.delete(login.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      setLoginToDelete(null);
      toast.success('Team member access removed');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.login_email || !formData.full_name) {
      toast.error('Please enter email and full name');
      return;
    }
    addTeamMemberMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-gray-600">Manage your team's access to the partnership portal</p>
        </div>
        {!showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        )}
      </div>

      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About Team Access</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Add team members who need access to your partnership dashboard</li>
                <li>They'll receive automatic email invitations with login instructions</li>
                <li>All team members share the same dashboard and can view/manage your partnership data</li>
                <li>You can remove team member access at any time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle>Add New Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
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
                        They'll receive login instructions at this email
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
                  </div>

                  <div>
                    <Label>Department/Role (Optional)</Label>
                    <Input
                      value={formData.role_label}
                      onChange={(e) => setFormData(prev => ({ ...prev, role_label: e.target.value }))}
                      placeholder="e.g., Marketing Manager, Production Lead"
                    />
                  </div>

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Input
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Any notes about this team member..."
                    />
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddForm(false);
                        setFormData({ login_email: "", full_name: "", role_label: "", notes: "" });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={addTeamMemberMutation.isPending}
                      className="bg-gradient-to-r from-green-600 to-emerald-700"
                    >
                      {addTeamMemberMutation.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Member & Send Invite
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle>Current Team Members ({teamMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length > 0 ? (
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
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{member.login_email}</span>
                      </div>
                      {member.notes && (
                        <p className="text-xs text-gray-500 mt-1">{member.notes}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {member.role_label ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {member.role_label}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendInvitationMutation.mutate({ loginRecord: member, isReminder: true })}
                          disabled={sendInvitationMutation.isPending}
                          title="Resend invitation"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLoginToDelete(member)}
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
              <User className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-600 mb-6">Add team members to give them access to your partnership dashboard</p>
              <Button onClick={() => setShowAddForm(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add First Team Member
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!loginToDelete} onOpenChange={() => setLoginToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member Access?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove login access for <strong>{loginToDelete?.login_email}</strong>.
              They will no longer be able to access your partnership dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTeamMemberMutation.mutate(loginToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}