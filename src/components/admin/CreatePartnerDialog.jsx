
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
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { config } from "@/config";

const APP_URL = config.appUrl;

export default function CreatePartnerDialog({ onClose }) {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    company_name: "",
    allocated_amount: "",
    package_tier: "",
    account_manager_name: "",
    account_manager_email: "",
    account_manager_phone: "",
    account_manager_calendly_url: ""
  });

  const queryClient = useQueryClient();

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const sendInvitationMutation = useMutation({
    mutationFn: async (data) => {
      // Check if user exists in backend
      const existingUser = allUsers.find(u => u.email === data.email);
      
      if (!existingUser) {
        throw new Error(`User with email ${data.email} not found. Please create the user in Backend first (Dashboard → Data → User → Create).`);
      }

      const fullName = `${data.first_name} ${data.last_name}`.trim();

      // Create partner profile with review_approve included in visible_modules
      await base44.entities.PartnerProfile.create({
        partner_email: data.email,
        allocated_amount: data.allocated_amount ? parseFloat(data.allocated_amount) : 0,
        package_tier: data.package_tier || '',
        account_manager_name: data.account_manager_name || '',
        account_manager_email: data.account_manager_email || '',
        account_manager_phone: data.account_manager_phone || '',
        account_manager_calendly_url: data.account_manager_calendly_url || '',
        visible_modules: [
          "dashboard", "getting_started", "deliverables", "nominations", "partner_hub",
          "calendar", "tasks", "event_schedule", "venue",
          "media_tracker", "brand_assets", "social_media", "press_kit",
          "account_manager", "resources", "documents", "training", "support",
          "passes", "opportunities", "networking", "benefits",
          "messages", "notifications", "contact_directory",
          "profile_page", "activity_log", "settings", "review_approve"
        ],
        visible_hub_sections: [
          "profile", "team", "contacts", "media", "pr", "workshops", "startups",
          "recognition", "vip", "booth", "badges", "vipbox", "testimonial"
        ]
      });

      // Send YOUR custom welcome email
      await base44.integrations.Core.SendEmail({
        from_name: "SEF Team",
        to: data.email,
        subject: "Welcome to SEF 2026 Partnership Portal!",
        body: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to SEF 2026!</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Partnership Portal</p>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${fullName || existingUser.full_name}</strong>,</p>
    
    <p style="margin-bottom: 20px;">Welcome to the Sharjah Entrepreneurship Festival 2026 Partnership Portal!</p>
    
    <p style="margin-bottom: 25px;">We're excited to have <strong style="color: #10b981;">${data.company_name}</strong> as a partner for SEF 2026.</p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0;">
      <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">🔐 Your Login Details</h2>
      <p style="margin: 8px 0;"><strong>Email:</strong> ${data.email}</p>
      <p style="margin: 8px 0;"><strong>Company:</strong> ${data.company_name}</p>
      <p style="margin: 8px 0;"><strong>Portal:</strong> <a href="${APP_URL}" style="color: #10b981; text-decoration: none; font-weight: bold;">${APP_URL}</a></p>
    </div>
    
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0;">
      <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px;">🚀 How to Get Started</h2>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin: 8px 0;">Visit the portal: <a href="${APP_URL}" style="color: #3b82f6; text-decoration: none;">${APP_URL}</a></li>
        <li style="margin: 8px 0;">Click "Login"</li>
        <li style="margin: 8px 0;">Enter your email: <strong>${data.email}</strong></li>
        <li style="margin: 8px 0;">Check your inbox - we'll send you a secure login link instantly</li>
        <li style="margin: 8px 0;">Click the link to access your dashboard (no password needed!)</li>
      </ol>
    </div>
    
    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 25px 0;">
      <h2 style="color: #f97316; margin: 0 0 15px 0; font-size: 18px;">📋 What's Next</h2>
      <p style="margin: 0 0 10px 0;">Once logged in, you can:</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin: 8px 0;">✓ Complete your partner profile</li>
        <li style="margin: 8px 0;">✓ Upload required deliverables</li>
        <li style="margin: 8px 0;">✓ Submit nominations for speakers and startups</li>
        <li style="margin: 8px 0;">✓ Book Day Zero tours and event sessions</li>
        <li style="margin: 8px 0;">✓ Access partnership resources</li>
      </ul>
    </div>
    
    ${data.account_manager_name ? `
    <div style="background: #faf5ff; border-left: 4px solid #7c3aed; padding: 20px; margin: 25px 0;">
      <h2 style="color: #7c3aed; margin: 0 0 15px 0; font-size: 18px;">👤 Your Account Manager</h2>
      <p style="margin: 8px 0;"><strong>${data.account_manager_name}</strong></p>
      ${data.account_manager_email ? `<p style="margin: 8px 0;">📧 <a href="mailto:${data.account_manager_email}" style="color: #7c3aed; text-decoration: none;">${data.account_manager_email}</a></p>` : ''}
      ${data.account_manager_phone ? `<p style="margin: 8px 0;">📱 ${data.account_manager_phone}</p>` : ''}
      ${data.account_manager_calendly_url ? `<p style="margin: 8px 0;">🗓️ <a href="${data.account_manager_calendly_url}" style="color: #7c3aed; text-decoration: none;">Schedule a meeting</a></p>` : ''}
      <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 14px;">Feel free to reach out if you need any assistance!</p>
    </div>
    ` : ''}
    
    <p style="margin: 30px 0 10px 0; font-size: 16px;">We look forward to working with you for an amazing SEF 2026!</p>
    
    <p style="margin: 25px 0 0 0;">Best regards,<br><strong>The SEF Partnership Team</strong></p>
  </div>
  
  <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0; color: #6b7280; font-size: 12px;">Sharjah Entrepreneurship Festival 2026</p>
    <p style="margin: 5px 0 0 0; color: #f97316; font-weight: bold; font-size: 14px;">"Where We Belong"</p>
  </div>
</body>
</html>`
      });

      // Log activity
      if (currentUser?.email) {
        await base44.entities.ActivityLog.create({
          activity_type: "user_created",
          user_email: currentUser.email,
          target_user_email: data.email,
          description: `Partner invitation sent to ${fullName} (${data.company_name}) at ${data.email}`,
          metadata: {
            email_type: "partner_invitation",
            company_name: data.company_name,
            account_manager: data.account_manager_name,
            portal_url: APP_URL
          }
        });
      }

      return existingUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPartners'] });
      queryClient.invalidateQueries({ queryKey: ['allProfiles'] });
      queryClient.invalidateQueries({ queryKey: ['emailInvitations'] });
      toast.success('✅ Partner profile created and custom invitation email sent!');
      onClose();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    sendInvitationMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Partner Invitation</DialogTitle>
        </DialogHeader>

        <Card className="border-red-300 bg-red-50 mb-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-bold mb-2 text-base">🚫 CRITICAL: Do NOT Use Backend Invitation!</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <strong>First:</strong> Create user in Backend (Dashboard → Data → User → Create)
                    <ul className="list-disc list-inside ml-5 mt-1 space-y-1 text-xs">
                      <li>Fill in email, name, company, set role to "user"</li>
                      <li className="font-bold text-red-700 underline">DO NOT check "Send Invitation"</li>
                      <li>Just click Save (no email will be sent)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Then:</strong> Enter their email below and submit THIS form
                    <ul className="list-disc list-inside ml-5 mt-1 space-y-1 text-xs">
                      <li>This creates their partner profile</li>
                      <li className="font-bold text-green-700">Sends OUR custom email with correct URL</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 mb-4">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">✅ What This Form Does:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Creates partner profile with settings</li>
                  <li>Sends beautifully formatted HTML email</li>
                  <li>Uses correct portal URL: <strong className="font-mono">https://partners.sharjahef.com</strong></li>
                  <li>Includes company name and account manager info</li>
                  <li>Logs the activity for tracking</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Partner Email (must exist in backend) *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="john@company.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                User must be created in Backend first
              </p>
            </div>

            <div>
              <Label>Company Name *</Label>
              <Input
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="ABC Company"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="John"
                required
              />
            </div>

            <div>
              <Label>Last Name *</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Allocated Amount</Label>
              <Input
                type="number"
                value={formData.allocated_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, allocated_amount: e.target.value }))}
                placeholder="50000"
              />
            </div>

            <div>
              <Label>Package Tier</Label>
              <Input
                value={formData.package_tier}
                onChange={(e) => setFormData(prev => ({ ...prev, package_tier: e.target.value }))}
                placeholder="Gold, Silver, etc."
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Account Manager Details</h3>
            <div className="space-y-3">
              <div>
                <Label>Account Manager Name</Label>
                <Input
                  value={formData.account_manager_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_manager_name: e.target.value }))}
                  placeholder="Sarah Johnson"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Manager Email</Label>
                  <Input
                    type="email"
                    value={formData.account_manager_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_manager_email: e.target.value }))}
                    placeholder="sarah@sheraa.ae"
                  />
                </div>

                <div>
                  <Label>Account Manager Phone</Label>
                  <Input
                    type="tel"
                    value={formData.account_manager_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_manager_phone: e.target.value }))}
                    placeholder="+971 XX XXX XXXX"
                  />
                </div>
              </div>

              <div>
                <Label>Account Manager Calendly URL</Label>
                <Input
                  type="url"
                  value={formData.account_manager_calendly_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_manager_calendly_url: e.target.value }))}
                  placeholder="https://calendly.com/sarah-johnson/30min"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Partners will use this to schedule meetings
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendInvitationMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-700"
            >
              {sendInvitationMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Send Custom Invitation Email
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
