
import React from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserCircle, Mail, Phone, Calendar, MessageSquare, Video, FileText, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function AccountManager() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profile } = useQuery({
    queryKey: ['partnerProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.PartnerProfile.filter({ 
        partner_email: user?.email 
      });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AM';
  };

  if (!profile?.account_manager_name) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <Card className="border-orange-100">
          <CardContent className="p-12 text-center">
            <UserCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Account Manager Assigned</h3>
            <p className="text-gray-600 mb-6">An account manager will be assigned to you shortly. In the meantime, you can contact general support.</p>
            <Button variant="outline" asChild>
              <a href="mailto:sefteam@sheraa.ae">Contact Support</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Send Email",
      description: "Send a direct email",
      icon: Mail,
      action: () => window.location.href = `mailto:${profile.account_manager_email}`,
      color: "from-blue-500 to-blue-600",
      disabled: !profile.account_manager_email
    },
    {
      title: "Call Now",
      description: "Make a phone call",
      icon: Phone,
      action: () => window.location.href = `tel:${profile.account_manager_phone}`,
      color: "from-green-500 to-green-600",
      disabled: !profile.account_manager_phone
    },
    {
      title: "Schedule Meeting",
      description: "Book a meeting slot",
      icon: Calendar,
      action: () => {},
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Send Message",
      description: "Internal messaging",
      icon: MessageSquare,
      action: () => {},
      color: "from-orange-500 to-amber-600"
    }
  ];

  const supportTopics = [
    {
      title: "Partnership Questions",
      description: "Requirements, deadlines, and partnership details",
      icon: HelpCircle
    },
    {
      title: "Deliverable Support",
      description: "Help with file submissions and approvals",
      icon: FileText
    },
    {
      title: "Event Planning",
      description: "Booth setup, activations, and event logistics",
      icon: Calendar
    },
    {
      title: "Media & Branding",
      description: "Logo usage, brand guidelines, and media assets",
      icon: Video
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account Manager</h1>
          <p className="text-gray-600">Your dedicated Sheraa contact for all partnership needs</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-8 border-2 border-green-200 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 h-32"></div>
          <CardContent className="p-8 -mt-16">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="w-32 h-32 border-4 border-white shadow-2xl bg-gradient-to-br from-green-600 to-emerald-700">
                <AvatarFallback className="text-4xl font-bold text-white">
                  {getInitials(profile.account_manager_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left mt-4">
                <Badge className="mb-3 bg-green-100 text-green-800 border-green-300">
                  Your Sheraa Account Manager
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  {profile.account_manager_name}
                </h2>
                
                <div className="space-y-3">
                  {profile.account_manager_email && (
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-500">Email</p>
                        <a 
                          href={`mailto:${profile.account_manager_email}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {profile.account_manager_email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {profile.account_manager_phone && (
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-500">Phone</p>
                        <a 
                          href={`tel:${profile.account_manager_phone}`}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {profile.account_manager_phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-8 border-green-100">
          <CardHeader>
            <CardTitle>Quick Contact Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center gap-3 hover:shadow-lg transition-all disabled:opacity-50"
                  onClick={action.action}
                  disabled={action.disabled}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">{action.title}</span>
                    <span className="text-xs text-gray-500">{action.description}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* About Your Manager */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                How Your Account Manager Helps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                {profile.account_manager_name} is your dedicated point of contact at Sheraa Entrepreneurship Forum. 
                They ensure your partnership runs smoothly and you get maximum value from SEF.
              </p>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Partnership Guidance</p>
                    <p className="text-sm text-gray-600">Answers all your partnership questions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Submission Review</p>
                    <p className="text-sm text-gray-600">Reviews and approves deliverables</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Event Coordination</p>
                    <p className="text-sm text-gray-600">Helps with event logistics and planning</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Problem Resolution</p>
                    <p className="text-sm text-gray-600">Resolves issues and concerns quickly</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-600" />
                Topics Your Manager Can Help With
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supportTopics.map((topic, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <topic.icon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{topic.title}</p>
                      <p className="text-sm text-gray-600">{topic.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Response Time */}
        <Card className="border-blue-100 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Expected Response Time</h3>
                <p className="text-blue-800 mb-3">
                  Your account manager typically responds within <strong>24 hours</strong> on business days. 
                  For urgent matters, please call directly or mark your email as urgent.
                </p>
                <div className="flex gap-4 text-sm">
                  <div>
                    <p className="text-blue-700 font-medium">Business Hours</p>
                    <p className="text-blue-600">Sunday - Thursday, 9AM - 6PM GST</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Communications - Placeholder */}
        <Card className="mt-6 border-green-100">
          <CardHeader>
            <CardTitle>Recent Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No recent messages</p>
              <p className="text-sm mt-2">Your communication history with {profile.account_manager_name} will appear here</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
