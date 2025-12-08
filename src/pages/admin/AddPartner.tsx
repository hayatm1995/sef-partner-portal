import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/config/supabase';
import { partnersService } from '@/services/supabaseService';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Building2, Mail, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AddPartner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  
  const [formData, setFormData] = useState({
    // Partner fields
    name: '',
    tier: 'Standard',
    website: '',
    contract_status: 'Pending',
    
    // Contact fields (optional)
    contactName: '',
    contactEmail: '',
    
    // Invite option
    sendInvite: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check admin access
  const isSuperAdmin = role === 'superadmin' || role === 'sef_admin';
  const isAdmin = role === 'admin' || isSuperAdmin;

  if (!isAdmin) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">Access denied. Admin access required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create partner only (no invite)
  const createPartnerMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      tier: string;
      website?: string;
      contract_status: string;
    }) => {
      return await partnersService.create({
        name: data.name,
        tier: data.tier,
        website_url: data.website || null,
        contract_status: data.contract_status,
      });
    },
    onSuccess: (partner) => {
      queryClient.invalidateQueries({ queryKey: ['adminPartners'] });
      queryClient.invalidateQueries({ queryKey: ['allPartners'] });
      toast.success(`Partner "${partner.name}" created successfully!`);
      navigate('/admin/partners');
    },
    onError: (error: any) => {
      console.error('Error creating partner:', error);
      toast.error(error.message || 'Failed to create partner');
    },
  });

  // Invite partner (creates partner + user + sends invite)
  const invitePartnerMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      tier?: string;
    }) => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data: result, error } = await supabase.functions.invoke('invite-partner', {
        body: {
          name: data.name,
          email: data.email,
          tier: data.tier || 'Standard',
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error inviting partner:', error);
        throw new Error(error.message || 'Failed to send invite');
      }

      if (result?.error) {
        throw new Error(result.error || 'Failed to send invite');
      }

      return result;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminPartners'] });
      queryClient.invalidateQueries({ queryKey: ['allPartners'] });
      toast.success(`Invite sent to ${variables.email}`);
      navigate('/admin/partners');
    },
    onError: (error: any) => {
      console.error('Error inviting partner:', error);
      toast.error(error.message || 'Failed to invite partner');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Partner name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (formData.sendInvite && formData.contactEmail) {
        // Create partner + invite user
        if (!formData.contactEmail.trim()) {
          toast.error('Contact email is required when sending invite');
          setIsSubmitting(false);
          return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.contactEmail)) {
          toast.error('Please enter a valid email address');
          setIsSubmitting(false);
          return;
        }

        // Use contact name if provided, otherwise use partner name
        const contactName = formData.contactName.trim() || formData.name.trim();
        
        await invitePartnerMutation.mutateAsync({
          name: contactName,
          email: formData.contactEmail.trim().toLowerCase(),
          tier: formData.tier,
        });
      } else {
        // Create partner only
        await createPartnerMutation.mutateAsync({
          name: formData.name.trim(),
          tier: formData.tier,
          website: formData.website.trim() || undefined,
          contract_status: formData.contract_status,
        });
      }
    } catch (error) {
      // Error already handled in mutation
      setIsSubmitting(false);
    }
  };

  const isLoading = createPartnerMutation.isPending || invitePartnerMutation.isPending || isSubmitting;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/Dashboard" },
        { label: "Manage Partners", href: "/admin/partners" },
        { label: "Add Partner", href: "/admin/partners/new" },
      ]} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-6"
      >
        <Card className="shadow-xl border-orange-200">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">Add New Partner</CardTitle>
                <CardDescription className="mt-1">
                  Create a new partner and optionally invite a primary contact
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Partner Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Partner Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                    Partner Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter partner company or individual name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={isLoading}
                    className="h-11"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tier" className="text-sm font-semibold text-gray-700">
                      Tier <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.tier}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value }))}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Platinum">Platinum</SelectItem>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Silver">Silver</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Bronze">Bronze</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_status" className="text-sm font-semibold text-gray-700">
                      Contract Status
                    </Label>
                    <Select
                      value={formData.contract_status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, contract_status: value }))}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Signed">Signed</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-semibold text-gray-700">
                    Website (Optional)
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              </div>

              {/* Contact & Invite Section */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Primary Contact (Optional)</h3>
                </div>

                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sendInvite"
                      checked={formData.sendInvite}
                      onChange={(e) => setFormData(prev => ({ ...prev, sendInvite: e.target.checked }))}
                      disabled={isLoading}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <Label htmlFor="sendInvite" className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Send invitation email to primary contact
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600 ml-6">
                    If checked, we'll create a user account and send them a magic link to access the Partner Hub
                  </p>
                </div>

                {formData.sendInvite && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="contactName" className="text-sm font-semibold text-gray-700">
                        Contact Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        type="text"
                        placeholder="John Doe"
                        value={formData.contactName}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                        required={formData.sendInvite}
                      />
                      <p className="text-xs text-gray-500">
                        Leave empty to use partner name
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail" className="text-sm font-semibold text-gray-700">
                        Contact Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="contact@partner.com"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        disabled={isLoading}
                        className="h-11"
                        required={formData.sendInvite}
                      />
                      <p className="text-xs text-gray-500">
                        The contact will receive a magic link email to set up their account
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/partners')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {formData.sendInvite ? 'Creating & Sending Invite...' : 'Creating Partner...'}
                    </>
                  ) : (
                    <>
                      {formData.sendInvite ? (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Create Partner & Send Invite
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Create Partner
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> {
                  formData.sendInvite
                    ? 'The partner will receive an email with a magic link to access the portal. They can click the link to set up their account and log in. The link expires in 24 hours.'
                    : 'You can invite a contact later by editing the partner and adding a user, or by using the "Invite Partner" page.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

