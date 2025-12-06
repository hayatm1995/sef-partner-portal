
import React, { useState } from "react";
// TODO: Base44 removed - migrate to Supabase
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  CheckCircle,
  Circle,
  ArrowRight,
  Sparkles,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GettingStartedChecklist({ user }) {
  const [isDismissed, setIsDismissed] = useState(
    localStorage.getItem('checklistDismissed') === 'true'
  );

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

  const { data: deliverables = [] } = useQuery({
    queryKey: ['userDeliverables', user?.email],
    queryFn: () => base44.entities.Deliverable.filter({ partner_email: user?.email }),
    enabled: !!user,
  });

  const { data: nominations = [] } = useQuery({
    queryKey: ['userNominations', user?.email],
    queryFn: () => base44.entities.Nomination.filter({ partner_email: user?.email }),
    enabled: !!user,
  });

  const steps = [
    {
      id: 'profile',
      title: "Complete Your Profile",
      description: "Add your company information and contact details",
      completed: !!profile,
      link: createPageUrl("PartnerHub"),
      priority: "high"
    },
    {
      id: 'deliverable',
      title: "Upload Your First Deliverable",
      description: "Submit required documents and files",
      completed: deliverables.length > 0,
      link: createPageUrl("Deliverables"),
      priority: "high"
    },
    {
      id: 'nomination',
      title: "Submit a Nomination",
      description: "Nominate speakers, startups, or workshops",
      completed: nominations.length > 0,
      link: createPageUrl("Nominations"),
      priority: "medium"
    },
    {
      id: 'account_manager',
      title: "Meet Your Account Manager",
      description: "Get to know your dedicated Sheraa contact",
      completed: false,
      link: createPageUrl("AccountManager"),
      priority: "medium"
    },
    {
      id: 'resources',
      title: "Download Partner Resources",
      description: "Access templates, guides, and brand assets",
      completed: false,
      link: createPageUrl("Resources"),
      priority: "low"
    }
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = (completedSteps / steps.length) * 100;
  const allCompleted = completedSteps === steps.length;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('checklistDismissed', 'true');
  };

  if (isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Getting Started</CardTitle>
                  <p className="text-sm text-gray-600">Complete these steps to get the most from your partnership</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {completedSteps} of {steps.length} completed
                </span>
                <Badge className={allCompleted ? "bg-green-500" : "bg-orange-500"}>
                  {Math.round(progress)}%
                </Badge>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Steps List */}
            <div className="space-y-3">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                    step.completed 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-white border border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className={`font-semibold mb-1 ${step.completed ? 'text-green-900' : 'text-gray-900'}`}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                      {!step.completed && (
                        <Link to={step.link}>
                          <Button size="sm" variant="outline" className="flex-shrink-0">
                            Start
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {allCompleted && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-bold text-green-900 mb-1">All Set!</h3>
                <p className="text-sm text-green-700 mb-3">
                  You've completed all the getting started steps. Great work!
                </p>
                <Button onClick={handleDismiss} variant="outline" size="sm">
                  Dismiss Checklist
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
