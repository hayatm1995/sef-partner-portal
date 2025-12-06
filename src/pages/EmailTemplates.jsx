
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { config } from "@/config";
// TODO: Email templates migration to Supabase pending
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Save, Eye, RefreshCw, Copy, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function EmailTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState("partner_invitation");
  const [formData, setFormData] = useState({
    subject: "",
    body: ""
  });

  const queryClient = useQueryClient();

  const { user } = useAuth();

  // TODO: Email templates migration to Supabase pending
  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: async () => {
      // Return empty array until Supabase migration is complete
      console.warn('Email templates migration to Supabase pending');
      return [];
    },
    enabled: user?.role === 'admin' || user?.is_super_admin,
  });

  const { data: currentTemplate } = useQuery({
    queryKey: ['emailTemplate', selectedTemplate],
    queryFn: async () => {
      // Return null until Supabase migration is complete
      const defaultTemplate = defaultTemplates[selectedTemplate];
      if (defaultTemplate) {
        setFormData(defaultTemplate);
      }
      return null;
    },
    enabled: (user?.role === 'admin' || user?.is_super_admin) && !!selectedTemplate,
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (data) => {
      // TODO: Implement Supabase email templates service
      console.warn('Email template save - Supabase migration pending');
      throw new Error('Email templates migration to Supabase pending');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] });
      queryClient.invalidateQueries({ queryKey: ['emailTemplate'] });
      toast.success('Email template saved successfully');
    },
  });

  const availableVariables = {
    partner_invitation: [
      "{{partner_name}}",
      "{{login_url}}",
      "{{account_manager_name}}",
      "{{account_manager_email}}",
      "{{event_date}}",
      "{{support_email}}"
    ],
    nomination_approved: [
      "{{partner_name}}",
      "{{nomination_type}}",
      "{{nominee_name}}",
      "{{approval_date}}"
    ],
    deliverable_approved: [
      "{{partner_name}}",
      "{{deliverable_title}}",
      "{{approval_date}}"
    ],
    reminder: [
      "{{partner_name}}",
      "{{reminder_title}}",
      "{{due_date}}",
      "{{action_url}}"
    ]
  };

  const defaultTemplates = {
    partner_invitation: {
      subject: "Welcome to SEF 2025 Partnership Portal",
      body: `Dear {{partner_name}},

Welcome to the Sharjah Entrepreneurship Festival 2026 Partnership Portal!

We're thrilled to have you as a partner for SEF 2026. This portal is your central hub for managing all aspects of your partnership with us.

**Getting Started:**
1. Access your portal: {{login_url}}
2. Complete your profile information
3. Upload required deliverables
4. Submit nominations for speakers, workshops, and startups
5. Book your Day Zero tour and other event slots

**Your Account Manager:**
Your dedicated contact is {{account_manager_name}}.
Feel free to reach out at {{account_manager_email}} for any questions or support.

**Important Dates:**
- Deliverables Deadline: January 5, 2026
- Nominations Close: January 20, 2026
- Day Zero Tours: January 29th, 2026
- SEF Main Event: {{event_date}}

We're excited to work with you and create an amazing SEF 2026 experience together!

If you have any questions or need assistance, please don't hesitate to contact us at {{support_email}}.

Best regards,
The SEF Team

---
Sharjah Entrepreneurship Festival 2026
"Where We Belong"`
    },
    nomination_approved: {
      subject: "Your Nomination Has Been Approved - SEF 2025",
      body: `Dear {{partner_name}},

Great news! Your {{nomination_type}} nomination for {{nominee_name}} has been approved for SEF 2025.

Approval Date: {{approval_date}}

We'll be in touch with next steps and additional details soon.

Thank you for your valuable contribution to SEF 2025!

Best regards,
The SEF Team`
    },
    deliverable_approved: {
      subject: "Deliverable Approved - {{deliverable_title}}",
      body: `Dear {{partner_name}},

Your deliverable "{{deliverable_title}}" has been reviewed and approved.

Approval Date: {{approval_date}}

Thank you for your timely submission!

Best regards,
The SEF Team`
    },
    reminder: {
      subject: "Reminder: {{reminder_title}}",
      body: `Dear {{partner_name}},

This is a friendly reminder about: {{reminder_title}}

Due Date: {{due_date}}

Please take action: {{action_url}}

If you've already completed this, please disregard this message.

Best regards,
The SEF Team`
    }
  };

  const handleSave = () => {
    saveTemplateMutation.mutate(formData);
  };

  const handleReset = () => {
    const defaultTemplate = defaultTemplates[selectedTemplate];
    if (defaultTemplate) {
      setFormData(defaultTemplate);
      toast.info('Template reset to default');
    }
  };

  const handleCopyVariable = (variable) => {
    navigator.clipboard.writeText(variable);
    toast.success(`Copied ${variable}`);
  };

  const getPreviewContent = () => {
    let preview = formData.body;
    const sampleData = {
      "{{partner_name}}": "John Smith",
      "{{login_url}}": config.appUrl,
      "{{account_manager_name}}": "Sarah Johnson",
      "{{account_manager_email}}": "sarah@sheraa.ae",
      "{{event_date}}": "February 10-12, 2025",
      "{{support_email}}": "support@sef.ae",
      "{{nomination_type}}": "Speaker",
      "{{nominee_name}}": "Dr. Ahmed Al-Mansoori",
      "{{approval_date}}": new Date().toLocaleDateString(),
      "{{deliverable_title}}": "Company Logo",
      "{{reminder_title}}": "Upload Required Documents",
      "{{due_date}}": "January 15, 2025",
      "{{action_url}}": `${config.appUrl}/Deliverables`
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      preview = preview.replace(new RegExp(escapedKey, 'g'), `<strong class="text-orange-600">${value}</strong>`);
    });

    return preview;
  };

  if (user?.role !== 'admin') {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
          <p className="text-gray-600">Customize automated email templates sent to partners</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1 border-green-100">
            <CardHeader>
              <CardTitle className="text-lg">Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.keys(defaultTemplates).map((templateKey) => (
                  <button
                    key={templateKey}
                    onClick={() => setSelectedTemplate(templateKey)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedTemplate === templateKey
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium text-sm capitalize">
                        {templateKey.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {currentTemplate && selectedTemplate === templateKey ? 'Custom' : 'Default'}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 border-green-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">
                  {selectedTemplate.replace(/_/g, ' ')} Template
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saveTemplateMutation.isPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="edit">
                <TabsList className="mb-4">
                  <TabsTrigger value="edit">Edit</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="variables">Variables</TabsTrigger>
                </TabsList>

                <TabsContent value="edit" className="space-y-4">
                  <div>
                    <Label>Email Subject</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Enter email subject..."
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Email Body</Label>
                    <Textarea
                      value={formData.body}
                      onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Enter email body..."
                      rows={20}
                      className="mt-2 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Use variables like partner_name, company_name, etc. in your template (with double curly braces). They will be replaced with actual data when the email is sent.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="preview">
                  <Card className="border-orange-100 bg-gray-50">
                    <CardHeader className="border-b bg-white">
                      <div className="text-sm text-gray-600 mb-2">Subject:</div>
                      <div className="font-semibold">{formData.subject}</div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div 
                        className="prose prose-sm max-w-none whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: getPreviewContent() }}
                      />
                    </CardContent>
                  </Card>
                  <p className="text-xs text-gray-500 mt-4">
                    This preview shows sample data. Actual emails will use real partner information.
                  </p>
                </TabsContent>

                <TabsContent value="variables">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">Available Variables for {selectedTemplate.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Click on a variable to copy it to your clipboard
                      </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {availableVariables[selectedTemplate]?.map((variable) => (
                        <button
                          key={variable}
                          onClick={() => handleCopyVariable(variable)}
                          className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all text-left group"
                        >
                          <code className="text-sm font-mono text-gray-700">{variable}</code>
                          <Copy className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-blue-100 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Email Template Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Use variables to personalize emails automatically</li>
                  <li>Keep subject lines clear and under 50 characters</li>
                  <li>Test your templates by previewing them before saving</li>
                  <li>Reset to default if you want to start over</li>
                  <li>Changes take effect immediately for all future emails</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
