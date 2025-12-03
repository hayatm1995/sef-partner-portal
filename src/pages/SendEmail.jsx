import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Send, Users, Plus, Minus, AlertCircle, Eye, Clock, CheckCircle, FileText, Sparkles, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";

const APP_URL = "https://partners.sharjahef.com";

export default function SendEmail() {
  const [selectedPartners, setSelectedPartners] = useState([]);
  const [emailForm, setEmailForm] = useState({
    subject: "",
    body: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartnersForEmail'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role !== 'admin' && !u.is_super_admin);
    },
    enabled: !!user && (user.role === 'admin' || user.is_super_admin),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['partnerProfiles'],
    queryFn: () => base44.entities.PartnerProfile.list(),
    enabled: !!user && (user.role === 'admin' || user.is_super_admin),
  });

  const { data: emailTemplates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.filter({ is_active: true }),
    enabled: !!user && (user.role === 'admin' || user.is_super_admin),
  });

  // Get recent email activity
  const { data: emailHistory = [] } = useQuery({
    queryKey: ['emailHistory'],
    queryFn: async () => {
      const activities = await base44.entities.ActivityLog.list('-created_date', 50);
      return activities.filter(a => a.activity_type === 'email_sent');
    },
    enabled: !!user && (user.role === 'admin' || user.is_super_admin),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ partners, subject, body }) => {
      const results = [];
      
      for (const partner of partners) {
        try {
          // Find partner profile
          const profile = profiles.find(p => p.partner_email === partner.email);
          
          // Personalize email body
          const personalizedBody = body
            .replace(/{{partner_name}}/g, partner.full_name || partner.email)
            .replace(/{{company_name}}/g, partner.company_name || 'your organization')
            .replace(/{{account_manager}}/g, profile?.account_manager_name || 'your account manager')
            .replace(/{{login_url}}/g, APP_URL);

          // Convert plain text to HTML
          const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Sharjah Entrepreneurship Festival</h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0;">Partner Portal</p>
              </div>
              
              <div style="padding: 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                ${personalizedBody.split('\n').map(line => `<p style="margin: 10px 0; color: #374151; line-height: 1.6;">${line}</p>`).join('')}
              </div>
              
              <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Best regards,</p>
                <p style="margin: 0 0 20px 0; color: #374151; font-weight: bold;">SEF Team</p>
                
                <div style="border-top: 2px solid #10b981; padding-top: 20px; margin-top: 20px;">
                  <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;"><strong>Need help logging in?</strong></p>
                  <ul style="margin: 10px 0; padding-left: 20px; color: #6b7280; font-size: 13px; line-height: 1.8;">
                    <li>You can login with your <strong>Microsoft</strong> or <strong>Google</strong> account</li>
                    <li>If you prefer to use a password instead:
                      <ol style="margin: 5px 0; padding-left: 20px;">
                        <li>Visit: <a href="${APP_URL}" style="color: #10b981;">${APP_URL}</a></li>
                        <li>Enter your email address</li>
                        <li>Click "Forgot Password" to set a new password</li>
                        <li>Use your email and new password to login</li>
                      </ol>
                    </li>
                  </ul>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                    © ${new Date().getFullYear()} Sharjah Entrepreneurship Festival. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          `;

          await base44.integrations.Core.SendEmail({
            from_name: 'SEF Team',
            to: partner.email,
            subject: subject,
            body: htmlBody
          });

          // Log the email
          await base44.entities.ActivityLog.create({
            activity_type: 'email_sent',
            user_email: user.email,
            target_user_email: partner.email,
            description: `Email sent: "${subject}"`,
            metadata: {
              subject: subject,
              partner_name: partner.full_name,
              company_name: partner.company_name,
              email_type: 'bulk_email',
              portal_url: APP_URL // Added this line
            }
          });

          results.push({ email: partner.email, success: true });
        } catch (error) {
          console.error(`Failed to send to ${partner.email}:`, error);
          results.push({ email: partner.email, success: false, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      queryClient.invalidateQueries({ queryKey: ['emailHistory'] });
      
      if (failCount === 0) {
        toast.success(`Successfully sent ${successCount} email${successCount > 1 ? 's' : ''}`);
      } else {
        toast.error(`Sent ${successCount} emails, ${failCount} failed`);
      }
      
      // Reset form
      setSelectedPartners([]);
      setEmailForm({ subject: "", body: "" });
    },
    onError: (error) => {
      toast.error(`Failed to send emails: ${error.message}`);
    },
  });

  const handlePartnerToggle = (partnerId) => {
    setSelectedPartners(prev =>
      prev.includes(partnerId)
        ? prev.filter(id => id !== partnerId)
        : [...prev, partnerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPartners.length === allPartners.length) {
      setSelectedPartners([]);
    } else {
      setSelectedPartners(allPartners.map(p => p.id));
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
      setEmailForm({
        subject: template.subject,
        body: template.body
      });
      setSelectedTemplate(templateId);
      toast.success('Template applied');
    }
  };

  const handleSend = () => {
    if (selectedPartners.length === 0) {
      toast.error('Please select at least one partner');
      return;
    }
    if (!emailForm.subject || !emailForm.body) {
      toast.error('Please fill in subject and body');
      return;
    }

    const partners = allPartners.filter(p => selectedPartners.includes(p.id));
    sendEmailMutation.mutate({
      partners,
      subject: emailForm.subject,
      body: emailForm.body
    });
  };

  const handlePreview = () => {
    if (!emailForm.body) {
      toast.error('Please write email content first');
      return;
    }
    
    const previewPartner = allPartners.find(p => selectedPartners.includes(p.id)) || allPartners[0];
    if (!previewPartner) {
      toast.error('No partners available for preview');
      return;
    }
    const profile = profiles.find(p => p.partner_email === previewPartner?.email);
    
    const personalizedBody = emailForm.body
      .replace(/{{partner_name}}/g, previewPartner?.full_name || previewPartner.email)
      .replace(/{{company_name}}/g, previewPartner?.company_name || 'your organization')
      .replace(/{{account_manager}}/g, profile?.account_manager_name || 'your account manager')
      .replace(/{{login_url}}/g, APP_URL);

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Sharjah Entrepreneurship Festival</h1>
          <p style="color: #d1fae5; margin: 10px 0 0 0;">Partner Portal</p>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
          ${personalizedBody.split('\n').map(line => `<p style="margin: 10px 0; color: #374151; line-height: 1.6;">${line}</p>`).join('')}
        </div>
        
        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px;">
          <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Best regards,</p>
          <p style="margin: 0 0 20px 0; color: #374151; font-weight: bold;">SEF Team</p>
          
          <div style="border-top: 2px solid #10b981; padding-top: 20px; margin-top: 20px;">
            <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;"><strong>Need help logging in?</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #6b7280; font-size: 13px; line-height: 1.8;">
              <li>You can login with your <strong>Microsoft</strong> or <strong>Google</strong> account</li>
              <li>If you prefer to use a password instead:
                <ol style="margin: 5px 0; padding-left: 20px;">
                  <li>Visit: <a href="${APP_URL}" style="color: #10b981;">${APP_URL}</a></li>
                  <li>Enter your email address</li>
                  <li>Click "Forgot Password" to set a new password</li>
                  <li>Use your email and new password to login</li>
                </ol>
              </li>
            </ul>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
              © ${new Date().getFullYear()} Sharjah Entrepreneurship Festival. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;
    
    setPreviewHtml(htmlBody);
    setShowPreview(true);
  };

  if (user?.role !== 'admin' && !user?.is_super_admin) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-gray-600">Admin access required</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/40">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Send Email to Partners</h1>
                <p className="text-blue-100 text-lg">Compose and send personalized emails to your partners</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="compose" className="space-y-6">
          <TabsList>
            <TabsTrigger value="compose">Compose Email</TabsTrigger>
            <TabsTrigger value="history">Email History</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Partner Selection */}
              <Card className="lg:col-span-1 border-indigo-200 shadow-xl bg-gradient-to-br from-white to-indigo-50/30">
                <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Select Partners
                    </span>
                    <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300">
                      {selectedPartners.length} selected
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full mb-4"
                    onClick={handleSelectAll}
                  >
                    {selectedPartners.length === allPartners.length ? (
                      <>
                        <Minus className="w-4 h-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Select All
                      </>
                    )}
                  </Button>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allPartners.map((partner) => (
                      <label
                        key={partner.id}
                        className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPartners.includes(partner.id)}
                          onChange={() => handlePartnerToggle(partner.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{partner.full_name}</p>
                          <p className="text-xs text-gray-600">{partner.email}</p>
                          {partner.company_name && (
                            <p className="text-xs text-gray-500">{partner.company_name}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Email Editor */}
              <Card className="lg:col-span-2 border-indigo-200 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
                <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Compose Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Template Selection */}
                  {emailTemplates.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <Label className="flex items-center gap-2 text-indigo-900 font-semibold mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Quick Start with a Template
                      </Label>
                      <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                        <SelectTrigger className="bg-white border-indigo-200 hover:border-indigo-300">
                          <SelectValue placeholder="Choose a template to get started..." />
                        </SelectTrigger>
                        <SelectContent>
                          {emailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-indigo-500" />
                                {template.template_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-indigo-700 mt-2">Templates will auto-fill the subject and body fields</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-gray-700 font-semibold">Subject Line *</Label>
                    <Input
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject..."
                      className="mt-1.5 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 font-semibold flex items-center justify-between">
                      <span>Email Body *</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(emailForm.body);
                          toast.success('Email content copied to clipboard');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        disabled={!emailForm.body}
                      >
                        <Copy className="w-3 h-3" />
                        Copy
                      </button>
                    </Label>
                    <Textarea
                      value={emailForm.body}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Write your email message here..."
                      rows={14}
                      className="mt-1.5 font-mono text-sm border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 resize-y"
                    />
                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Personalization Variables:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <code className="bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs font-semibold">{'{{partner_name}}'}</code>
                        <code className="bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs font-semibold">{'{{company_name}}'}</code>
                        <code className="bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs font-semibold">{'{{account_manager}}'}</code>
                        <code className="bg-white border border-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs font-semibold">{'{{login_url}}'}</code>
                      </div>
                      <p className="text-xs text-indigo-700 mt-2">These will be automatically replaced with each partner's information</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-indigo-100">
                    <Button
                      variant="outline"
                      onClick={handlePreview}
                      disabled={!emailForm.body}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview HTML
                    </Button>
                    <Button
                      onClick={handleSend}
                      disabled={sendEmailMutation.isPending || selectedPartners.length === 0}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendEmailMutation.isPending 
                        ? 'Sending Emails...' 
                        : `Send to ${selectedPartners.length} Partner${selectedPartners.length !== 1 ? 's' : ''}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="border-indigo-200 shadow-xl bg-gradient-to-br from-white to-indigo-50/30">
              <CardHeader className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  Recent Email Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Sent By</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailHistory.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">
                            {format(new Date(activity.created_date), 'MMM d, h:mm a')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{activity.target_user_email}</p>
                              {activity.metadata?.partner_name && (
                                <p className="text-xs text-gray-500">{activity.metadata.partner_name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{activity.metadata?.subject || activity.description}</p>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {activity.user_email}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Sent
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {emailHistory.length === 0 && (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No emails sent yet</h3>
                    <p className="text-gray-600">Email history will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="mt-6 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-indigo-900 mb-3 text-lg">Email Features & Best Practices</h3>
                <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-800">Personalize with dynamic variables for each partner</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-800">All emails automatically logged for tracking</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-800">Use templates to save time on common messages</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-800">Preview full HTML email before sending</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-800">Auto-includes login instructions with SSO options</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <p className="text-sm text-indigo-800">Portal URL: <strong>{APP_URL}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Dialog */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-indigo-900">
                <Eye className="w-5 h-5" />
                Email Preview - HTML Rendered
              </DialogTitle>
            </DialogHeader>
            <div className="border-2 border-indigo-200 rounded-xl bg-white overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-5 py-4 border-b-2 border-indigo-200">
                <p className="text-sm font-semibold text-indigo-900">
                  <strong>Subject:</strong> {emailForm.subject}
                </p>
              </div>
              <div className="p-6 max-h-[600px] overflow-y-auto bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}