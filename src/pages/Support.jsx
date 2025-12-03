import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger } from
"@/components/ui/accordion";
import { HelpCircle, Send, Search, MessageSquare, Mail, Phone, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Support() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    description: ""
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.PartnerProfile.filter({
        partner_email: user?.email
      });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  // FAQ items
  const faqs = [
  {
    question: "How do I upload files and deliverables?",
    answer: "Navigate to the Deliverables page from the sidebar, click 'Upload New File', drag and drop your file or browse to select it, fill in the required information, and submit. All file types are supported with no size limits."
  },
  {
    question: "How do I submit nominations?",
    answer: "Go to the Nominations page, select the type of nomination (Workshop, Speaker, Startup, or Award), fill in the required details including nominee information and description, and submit your nomination for review."
  },
  {
    question: "How can I track my submissions?",
    answer: "Visit your Dashboard to see an overview of all your submissions, their status, and any pending actions. You can also view detailed information on the respective pages (Deliverables or Nominations)."
  },
  {
    question: "Who is my account manager?",
    answer: "Your account manager information is displayed in the sidebar and on your Dashboard. You can contact them directly via the email provided."
  },
  {
    question: "How do I book event sessions?",
    answer: "Navigate to the Calendar page where you can view available slots and book sessions for Day Zero tours, media interviews, and other events. Simply select a date and time, provide details, and submit your booking."
  },
  {
    question: "Can I edit my profile information?",
    answer: "Yes! Go to the Partner Hub and navigate to the Profile tab where you can update your company information, contact details, and other partnership details."
  }];


  const filteredFaqs = searchQuery ?
  faqs.filter((faq) =>
  faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
  faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  ) :
  faqs;

  const submitTicketMutation = useMutation({
    mutationFn: async (ticketData) => {
      const categoryLabels = {
        technical: "Technical Issue",
        account: "Account & Access",
        deliverables: "Deliverables",
        nominations: "Nominations",
        calendar: "Calendar & Events",
        other: "Other"
      };

      // Send email to primary support (s.sohail@sheraa.ae) with CC to sefteam@sheraa.ae
      const emailBody = `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎫 New Support Ticket</h1>
            <p style="color: #fed7aa; margin: 10px 0 0 0; font-size: 14px;">SEF Partnership Portal</p>
          </div>
          
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #f97316; margin: 0 0 15px 0; font-size: 18px;">📋 Ticket Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 120px;">Subject:</td>
                  <td style="padding: 8px 0; color: #374151;">${ticketData.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Category:</td>
                  <td style="padding: 8px 0;">
                    <span style="background: #f97316; color: white; padding: 4px 12px; border-radius: 4px; font-size: 13px;">
                      ${categoryLabels[ticketData.category] || ticketData.category}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Submitted:</td>
                  <td style="padding: 8px 0; color: #374151;">${new Date().toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</td>
                </tr>
              </table>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px;">👤 Partner Information</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold; width: 120px;">Name:</td>
                  <td style="padding: 8px 0; color: #374151;">${user?.full_name || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0;">
                    <a href="mailto:${user?.email}" style="color: #3b82f6; text-decoration: none;">${user?.email}</a>
                  </td>
                </tr>
                ${user?.company_name ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Company:</td>
                  <td style="padding: 8px 0; color: #374151;">${user.company_name}</td>
                </tr>
                ` : ''}
                ${profile?.package_tier ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Package:</td>
                  <td style="padding: 8px 0; color: #374151;">${profile.package_tier}</td>
                </tr>
                ` : ''}
                ${profile?.account_manager_name ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-weight: bold;">Account Mgr:</td>
                  <td style="padding: 8px 0; color: #374151;">${profile.account_manager_name}</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 25px;">
              <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">📝 Issue Description</h2>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #d1fae5;">
                <p style="margin: 0; color: #374151; white-space: pre-wrap; line-height: 1.6;">${ticketData.description}</p>
              </div>
            </div>

            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 25px; border-radius: 4px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚡ Action Required:</strong> Please respond to this support ticket within 24 hours.
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">SEF Partner Portal - Support System</p>
            <p style="margin: 5px 0 0 0; color: #f97316; font-weight: bold; font-size: 14px;">Sharjah Entrepreneurship Festival 2026</p>
          </div>
        </body>
        </html>
      `;

      // Send email to primary recipient
      await base44.integrations.Core.SendEmail({
        from_name: 'SEF Partner Portal',
        to: 's.sohail@sheraa.ae',
        subject: `[Support Ticket] ${ticketData.subject} - ${user?.full_name || user?.email}`,
        body: emailBody
      });

      // Send CC to sefteam
      await base44.integrations.Core.SendEmail({
        from_name: 'SEF Partner Portal',
        to: 'sefteam@sheraa.ae',
        subject: `[Support Ticket] ${ticketData.subject} - ${user?.full_name || user?.email}`,
        body: emailBody
      });

      // Log the activity
      await base44.entities.ActivityLog.create({
        activity_type: 'email_sent',
        user_email: user.email,
        description: `Support ticket submitted: "${ticketData.subject}" (${categoryLabels[ticketData.category]})`,
        metadata: {
          ticket_subject: ticketData.subject,
          ticket_category: ticketData.category,
          ticket_description: ticketData.description,
          sent_to: 's.sohail@sheraa.ae',
          cc_to: 'sefteam@sheraa.ae'
        }
      });

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Support ticket submitted successfully! Our team will respond within 24 hours.');
      setTicketForm({ subject: "", category: "", description: "" });
    },
    onError: (error) => {
      toast.error(`Failed to submit ticket: ${error.message}`);
    }
  });

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!ticketForm.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    
    if (!ticketForm.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!ticketForm.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    submitTicketMutation.mutate(ticketForm);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600">Get help and find answers to your questions</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Contact Card */}
          <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 mb-4">Chat with Amira - AI Support</p>
              <p className="text-xs text-gray-500 mb-4">Click the icon at bottom right</p>
            </CardContent>
          </Card>

          <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 mb-4">sefteam@sheraa.ae</p>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:sefteam@sheraa.ae">Send Email</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Phone Support</h3>
              <p className="text-sm text-gray-600 mb-4">+971 6 509 4000</p>
              <Button variant="outline" className="w-full" asChild>
                <a href="tel:+97165094000">Call Us</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* FAQ Section */}
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10" />

                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq, index) =>
                <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              {filteredFaqs.length === 0 &&
              <p className="text-center text-gray-500 py-8">
                  No FAQs found matching your search
                </p>
              }
            </CardContent>
          </Card>

          {/* Submit Ticket */}
          <Card className="border-orange-100 shadow-md">
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <Label>Subject *</Label>
                  <Input
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your issue"
                    required />

                </div>

                <div>
                  <Label>Category *</Label>
                  <Select
                    value={ticketForm.category}
                    onValueChange={(value) => setTicketForm((prev) => ({ ...prev, category: value }))}
                    required>

                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="account">Account & Access</SelectItem>
                      <SelectItem value="deliverables">Deliverables</SelectItem>
                      <SelectItem value="nominations">Nominations</SelectItem>
                      <SelectItem value="calendar">Calendar & Events</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Description *</Label>
                  <Textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Please provide detailed information about your issue..."
                    rows={6}
                    required />

                </div>

                <Button
                  type="submit"
                  disabled={submitTicketMutation.isPending}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-600">
                  {submitTicketMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Account Manager Contact */}
        {profile?.account_manager_name &&
        <Card className="mt-6 border-blue-100 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Need Direct Assistance?</h3>
                  <p className="text-sm text-blue-700">
                    Contact your account manager {profile.account_manager_name} at{' '}
                    <a href={`mailto:${profile.account_manager_email}`} className="underline">
                      {profile.account_manager_email}
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      </motion.div>
    </div>);

}