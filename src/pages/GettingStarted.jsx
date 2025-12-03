import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CheckCircle,
  Target,
  FileText,
  Award,
  Calendar,
  Package,
  Users,
  MessageSquare,
  Download,
  Video,
  ArrowRight,
  Sparkles,
  Clock,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  BookOpen,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function GettingStarted() {
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

  const steps = [
    {
      id: 1,
      title: "Complete Your Profile",
      description: "Add your company details, contacts, and team information",
      icon: Package,
      link: createPageUrl("PartnerHub"),
      linkText: "Go to Partner Hub",
      status: "critical",
      time: "10 minutes"
    },
    {
      id: 2,
      title: "Upload Required Deliverables",
      description: "Submit contracts, logos, media assets, and other required files",
      icon: FileText,
      link: createPageUrl("Deliverables"),
      linkText: "Upload Files",
      status: "critical",
      time: "15 minutes"
    },
    {
      id: 3,
      title: "Submit Your Nominations",
      description: "Nominate speakers, workshops, startups, or awards",
      icon: Award,
      link: createPageUrl("Nominations"),
      linkText: "Make Nominations",
      status: "important",
      time: "20 minutes"
    },
    {
      id: 4,
      title: "Meet Your Account Manager",
      description: "Connect with your dedicated Sheraa contact person",
      icon: MessageSquare,
      link: createPageUrl("AccountManager"),
      linkText: "View Contact",
      status: "recommended",
      time: "2 minutes"
    }
  ];

  const quickLinks = [
    {
      title: "Partner Hub",
      description: "Your central information hub",
      icon: Package,
      link: createPageUrl("PartnerHub"),
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Event Schedule",
      description: "Full SEF event program",
      icon: Calendar,
      link: createPageUrl("EventSchedule"),
      color: "from-purple-500 to-purple-600"
    },
    {
      title: "Support & FAQs",
      description: "Get help and answers",
      icon: BookOpen,
      link: createPageUrl("Support"),
      color: "from-green-500 to-green-600"
    },
    {
      title: "Training Videos",
      description: "Platform tutorials",
      icon: Video,
      link: createPageUrl("Training"),
      color: "from-orange-500 to-orange-600"
    }
  ];

  const importantDates = [
    {
      date: "December 15, 2025",
      event: "Deliverables Deadline",
      description: "All required files must be submitted",
      icon: FileText,
      urgent: true
    },
    {
      date: "December 15, 2025",
      event: "Nominations Close",
      description: "Final date for speaker/startup nominations",
      icon: Award,
      urgent: true
    },
    {
      date: "January 29, 2026",
      event: "Day Zero Tours",
      description: "Partner tours and venue walkthrough",
      icon: MapPin,
      urgent: false
    },
    {
      date: "January 31 - February 1, 2026",
      event: "SEF Main Event",
      description: "Sharjah Entrepreneurship Festival",
      icon: Sparkles,
      urgent: false
    }
  ];

  const getStatusColor = (status) => {
    if (status === 'critical') return 'bg-red-100 text-red-800 border-red-300';
    if (status === 'important') return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Hero Section */}
        <div className="mb-8 bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">Welcome to SEF Partner Portal! 🎉</h1>
              <p className="text-xl text-green-50 mb-4">
                Thank you for partnering with us for the Sharjah Entrepreneurship Festival. This guide will help you get started quickly.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Badge className="bg-white text-green-700 px-4 py-2 text-sm">
                  Est. Time: 47 minutes to complete
                </Badge>
                {profile?.account_manager_name && (
                  <div className="flex items-center gap-2 text-green-50">
                    <MessageSquare className="w-4 h-4" />
                    <span>Your Manager: {profile.account_manager_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Important Dates */}
        <Card className="mb-8 border-orange-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Clock className="w-6 h-6 text-orange-600" />
              Important Dates & Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {importantDates.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    item.urgent 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      item.urgent ? 'bg-red-500' : 'bg-blue-500'
                    }`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{item.event}</p>
                      <p className="text-sm text-gray-600 mb-1">{item.description}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.date}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step-by-Step Guide */}
        <Card className="mb-8 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Zap className="w-6 h-6 text-green-600" />
              Your Action Plan
            </CardTitle>
            <p className="text-gray-600 mt-2">Follow these steps to set up your partnership</p>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:shadow-md transition-all bg-white">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {step.id}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-1">{step.title}</h3>
                          <p className="text-gray-600 text-sm mb-2">{step.description}</p>
                        </div>
                        <Badge className={`ml-4 ${getStatusColor(step.status)} border`}>
                          {step.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {step.time}
                        </div>
                        <Link to={step.link}>
                          <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-700">
                            {step.linkText}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-6 bg-gray-300 ml-10 my-2"></div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Links Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link to={link.link}>
                  <Card className="border-2 hover:border-green-300 transition-all cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${link.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <link.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{link.title}</h3>
                      <p className="text-sm text-gray-600">{link.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                Our team is here to support you throughout your partnership journey.
              </p>
              
              {profile?.account_manager_name ? (
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Your Account Manager</p>
                    <p className="font-bold text-lg text-gray-900">{profile.account_manager_name}</p>
                    {profile.account_manager_email && (
                      <a 
                        href={`mailto:${profile.account_manager_email}`}
                        className="flex items-center gap-2 text-sm text-green-600 hover:underline mt-2"
                      >
                        <Mail className="w-4 h-4" />
                        {profile.account_manager_email}
                      </a>
                    )}
                    {profile.account_manager_phone && (
                      <a 
                        href={`tel:${profile.account_manager_phone}`}
                        className="flex items-center gap-2 text-sm text-green-600 hover:underline mt-1"
                      >
                        <Phone className="w-4 h-4" />
                        {profile.account_manager_phone}
                      </a>
                    )}
                  </div>
                  <Link to={createPageUrl("AccountManager")}>
                    <Button variant="outline" className="w-full">
                      View Full Contact Details
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <a href="mailto:sefteam@sheraa.ae" className="hover:underline">sefteam@sheraa.ae</a>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <a href="tel:+97165094000" className="hover:underline">+971 6 509 4000</a>
                  </div>
                  <Link to={createPageUrl("Support")}>
                    <Button variant="outline" className="w-full">
                      Visit Support Center
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" />
                Learning Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 mb-4">
                Explore our guides and tutorials to make the most of your partnership.
              </p>
              <div className="space-y-3">
                <Link to={createPageUrl("Training")}>
                  <Button variant="outline" className="w-full justify-start">
                    <Video className="w-4 h-4 mr-2" />
                    Watch Tutorial Videos
                  </Button>
                </Link>
                <Link to={createPageUrl("Resources")}>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Download Partner Guide
                  </Button>
                </Link>
                <Link to={createPageUrl("Support")}>
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse FAQs
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips & Best Practices */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-green-600" />
              Pro Tips for Success
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Submit Early</p>
                  <p className="text-sm text-gray-600">Don't wait until deadlines - early submissions get priority review.</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Check Notifications</p>
                  <p className="text-sm text-gray-600">Stay updated with status changes and important announcements.</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Use High-Quality Assets</p>
                  <p className="text-sm text-gray-600">Upload high-resolution logos and images for best results.</p>
                </div>
              </div>
              
              <div className="flex gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Book Calendar Slots</p>
                  <p className="text-sm text-gray-600">Popular time slots fill up quickly - reserve yours early!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}