import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb,
  TrendingUp,
  Users,
  Mic,
  Award,
  Calendar,
  ArrowRight,
  CheckCircle,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

export default function Opportunities() {
  const [expressedInterest, setExpressedInterest] = useState([]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.is_super_admin;
  const urlParams = new URLSearchParams(window.location.search);
  const viewAsEmail = urlParams.get('viewAs');

  if (isAdmin && !viewAsEmail) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Card className="border-yellow-200 bg-yellow-50 shadow-lg">
          <CardContent className="p-8 text-center">
            <Lightbulb className="w-16 h-16 mx-auto text-yellow-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Admin View</h3>
            <p className="text-gray-600">Use "View as Partner" to see specific partner opportunities.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const opportunities = [
    {
      id: 1,
      title: "Speaker Opportunity: Tech Innovation Panel",
      description: "Share your insights on technology and innovation at our main stage panel discussion",
      category: "speaking",
      deadline: "2024-12-01",
      spots: 3,
      status: "open",
      benefits: ["Main stage exposure", "Professional recording", "Social media promotion"],
      icon: Mic
    },
    {
      id: 2,
      title: "Mentor Program: Support Early-Stage Startups",
      description: "Guide and mentor selected startups through our accelerator program",
      category: "mentorship",
      deadline: "2024-11-25",
      spots: 10,
      status: "open",
      benefits: ["Direct impact on startups", "Networking opportunities", "Recognition certificate"],
      icon: Users
    },
    {
      id: 3,
      title: "Judging Panel: Pitch Competition Finals",
      description: "Evaluate and judge startup pitches in our annual competition",
      category: "judging",
      deadline: "2024-11-30",
      spots: 5,
      status: "filling_fast",
      benefits: ["VIP seating", "Networking dinner", "Certificate of appreciation"],
      icon: Award
    },
    {
      id: 4,
      title: "Workshop Leader: Digital Marketing Masterclass",
      description: "Lead a hands-on workshop on digital marketing strategies for entrepreneurs",
      category: "workshop",
      deadline: "2024-12-05",
      spots: 2,
      status: "open",
      benefits: ["Workshop stipend", "Professional materials support", "Video content"],
      icon: TrendingUp
    }
  ];

  const handleExpressInterest = (opportunityId) => {
    if (!expressedInterest.includes(opportunityId)) {
      setExpressedInterest([...expressedInterest, opportunityId]);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "bg-green-100 text-green-800",
      filling_fast: "bg-orange-100 text-orange-800",
      closed: "bg-gray-100 text-gray-800"
    };
    return colors[status] || colors.open;
  };

  const getCategoryColor = (category) => {
    const colors = {
      speaking: "from-purple-500 to-purple-600",
      mentorship: "from-blue-500 to-blue-600",
      judging: "from-orange-500 to-amber-600",
      workshop: "from-green-500 to-green-600"
    };
    return colors[category] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Opportunities & Engagement</h1>
          <p className="text-gray-600">Discover ways to get more involved with Sheraa</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-orange-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Opportunities</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {opportunities.filter(o => o.status === 'open').length}
                  </p>
                </div>
                <Lightbulb className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Your Interests</p>
                  <p className="text-3xl font-bold text-blue-600">{expressedInterest.length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Spots</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {opportunities.reduce((sum, o) => sum + o.spots, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-3xl font-bold text-green-600">4</p>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Opportunities List */}
        <div className="space-y-6">
          {opportunities.map((opportunity) => {
            const Icon = opportunity.icon;
            const hasExpressedInterest = expressedInterest.includes(opportunity.id);

            return (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card className="border-orange-100 shadow-md hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className={`p-4 bg-gradient-to-br ${getCategoryColor(opportunity.category)} rounded-2xl shadow-lg flex-shrink-0`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {opportunity.title}
                            </h3>
                            <p className="text-gray-600 mb-4">{opportunity.description}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                              <Badge className={getStatusColor(opportunity.status)}>
                                {opportunity.status.replace(/_/g, ' ')}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {opportunity.category}
                              </Badge>
                              <Badge variant="outline">
                                <Users className="w-3 h-3 mr-1" />
                                {opportunity.spots} spot{opportunity.spots > 1 ? 's' : ''} available
                              </Badge>
                              <Badge variant="outline">
                                <Calendar className="w-3 h-3 mr-1" />
                                Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                              </Badge>
                            </div>

                            <div className="mb-4">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Benefits:</p>
                              <div className="flex flex-wrap gap-2">
                                {opportunity.benefits.map((benefit, index) => (
                                  <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {benefit}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleExpressInterest(opportunity.id)}
                            disabled={hasExpressedInterest || opportunity.status === 'closed'}
                            className="bg-gradient-to-r from-orange-500 to-amber-600"
                          >
                            {hasExpressedInterest ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Interest Expressed
                              </>
                            ) : (
                              <>
                                <Lightbulb className="w-4 h-4 mr-2" />
                                Express Interest
                              </>
                            )}
                          </Button>
                          <Button variant="outline">
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* My Interests */}
        {expressedInterest.length > 0 && (
          <Card className="mt-8 border-blue-100 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Your Expressed Interests ({expressedInterest.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800">
                Thank you for your interest! Our team will review your responses and get back to you within 3-5 business days.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8 border-purple-100 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Have an idea for collaboration?</h3>
                <p className="text-sm text-purple-700">
                  Contact your account manager to discuss custom partnership opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}