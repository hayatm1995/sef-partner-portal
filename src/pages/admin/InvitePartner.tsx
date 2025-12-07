import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Mail, CheckCircle } from 'lucide-react';
import { sendMagicLinkInvite } from '@/services/emailService';
import { motion } from 'framer-motion';

export default function InvitePartner() {
  const { user, role, loading } = useAuth();
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');

  // Wait for role to be loaded before checking access
  if (loading || !role) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is admin - use role from context (already resolved from database)
  const userRole = role || user?.role || 'partner';
  const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'sef_admin' || user?.is_super_admin;

  const invitePartnerMutation = useMutation({
    mutationFn: async (data) => {
      const { name, email } = data;
      
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('invite-partner', {
        body: { name, email },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        console.error('Error inviting partner:', error);
        toast.error(error.message || 'Failed to send invite');
        throw error;
      } else {
        toast.success('Invite sent!');
      }

      return data;
    },
    onSuccess: () => {
      // Reset form
      setPartnerName('');
      setPartnerEmail('');
    },
    onError: (error) => {
      // Error already handled in mutationFn with toast
      console.error('Error inviting partner:', error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!partnerName.trim()) {
      toast.error('Partner name is required');
      return;
    }

    if (!partnerEmail.trim()) {
      toast.error('Partner email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    invitePartnerMutation.mutate({
      name: partnerName.trim(),
      email: partnerEmail.trim().toLowerCase(),
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">You do not have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">Invite Partner</CardTitle>
                <CardDescription className="mt-1">
                  Send a magic link invitation to a new partner to join the SEF Partner Portal
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="partnerName" className="text-sm font-semibold text-gray-700">
                  Partner Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="partnerName"
                  type="text"
                  placeholder="Enter partner company or individual name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  disabled={invitePartnerMutation.isPending}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerEmail" className="text-sm font-semibold text-gray-700">
                  Partner Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  placeholder="partner@example.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  disabled={invitePartnerMutation.isPending}
                  className="h-11"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  The partner will receive a magic link email to set up their account
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={invitePartnerMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
                >
                  {invitePartnerMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The partner will receive an email with a magic link to access the portal. 
                They can click the link to set up their account and log in. The link expires in 24 hours.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

