
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Button is not used in the new structure, but keeping it for safety if other parts of the app rely on it from this import.
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Upload, Award, FileText, Users, BarChart3, ClipboardList, CalendarIcon, Package, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickActions({ isAdmin }) {
  const actions = isAdmin ? [
    {
      title: "Review Deliverables",
      description: "Check pending submissions",
      icon: FileText,
      gradient: "from-green-500 to-emerald-600",
      url: createPageUrl("AdminPanel")
    },
    {
      title: "Manage Partners",
      description: "View all partners",
      icon: Users,
      gradient: "from-lime-500 to-green-600",
      url: createPageUrl("ManagePartners")
    },
    {
      title: "View Analytics",
      description: "Partner engagement data",
      icon: BarChart3,
      gradient: "from-teal-500 to-cyan-600",
      url: createPageUrl("AdminAnalytics")
    },
    {
      title: "Set Requirements",
      description: "Configure requirements",
      icon: ClipboardList,
      gradient: "from-emerald-500 to-green-600",
      url: createPageUrl("AdminRequirements")
    }
  ] : [
    {
      title: "Upload Deliverable",
      description: "Submit your latest files",
      icon: Upload,
      gradient: "from-green-500 to-emerald-600",
      url: createPageUrl("Deliverables")
    },
    {
      title: "Submit Nomination",
      description: "Nominate speakers or startups",
      icon: Award,
      gradient: "from-lime-500 to-green-600",
      url: createPageUrl("Nominations")
    },
    {
      title: "View Calendar",
      description: "Check your schedule",
      icon: CalendarIcon,
      gradient: "from-teal-500 to-cyan-600",
      url: createPageUrl("Calendar")
    },
    {
      title: "Partner Hub",
      description: "Access your complete profile",
      icon: Package,
      gradient: "from-emerald-500 to-green-600",
      url: createPageUrl("PartnerHub")
    }
  ];

  return (
    <Card className="border-green-100 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-600" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Link key={action.title} to={action.url}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:border-green-300 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 shadow-md`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
