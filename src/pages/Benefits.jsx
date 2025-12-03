import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Award, Star, Users, Lightbulb, Globe, Ticket, Briefcase, TrendingUp, CheckCircle, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Benefits() {
  const partnerBenefits = [
    {
      id: 1,
      title: "Exclusive Networking Opportunities",
      description: "Connect with industry leaders, investors, and fellow entrepreneurs in private lounges and dedicated networking sessions.",
      icon: Users,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: 2,
      title: "Brand Visibility & Exposure",
      description: "Showcase your brand to thousands of attendees through prominent signage, digital displays, and official communications.",
      icon: Globe,
      color: "from-green-500 to-green-600",
    },
    {
      id: 3,
      title: "Speaking & Panel Slots",
      description: "Share your expertise on stage, participate in panel discussions, or lead interactive workshops.",
      icon: Mic,
      color: "from-purple-500 to-purple-600",
    },
    {
      id: 4,
      title: "Access to Innovation Hub",
      description: "Gain insights into emerging trends and technologies, participate in exclusive innovation challenges.",
      icon: Lightbulb,
      color: "from-orange-500 to-orange-600",
    },
    {
      id: 5,
      title: "Mentorship & Advisory Access",
      description: "Benefit from one-on-one sessions with seasoned mentors and business advisors.",
      icon: Briefcase,
      color: "from-pink-500 to-pink-600",
    },
    {
      id: 6,
      title: "Media & PR Support",
      description: "Leverage our media partners for increased press coverage and public relations support.",
      icon: TrendingUp,
      color: "from-red-500 to-red-600",
    },
    {
      id: 7,
      title: "VIP Access & Hospitality",
      description: "Enjoy premium passes, dedicated lounges, and exclusive hospitality services throughout the event.",
      icon: Ticket,
      color: "from-teal-500 to-teal-600",
    },
    {
      id: 8,
      title: "Awards & Recognition",
      description: "Nominate for or receive prestigious awards, recognizing your contributions in the entrepreneurship ecosystem.",
      icon: Award,
      color: "from-amber-500 to-amber-600",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Benefits & Perks</h1>
          <p className="text-gray-600">Discover the exclusive advantages of being a SEF 2026 Partner</p>
        </div>

        <Card className="mb-8 border-purple-200/50 shadow-2xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 p-10 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative flex items-start gap-6">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center flex-shrink-0 shadow-2xl border border-white/20">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-4 tracking-tight">Unlock Your Partnership Potential</h2>
                <p className="text-white/95 text-xl font-medium">Maximize your engagement and success with these exclusive benefits</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {partnerBenefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ scale: 1.03, y: -8 }}
              >
                <Card className="border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all h-full flex flex-col">
                  <CardContent className="p-6 flex-1">
                    <div className={`p-4 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br ${benefit.color} shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Card className="border-blue-200/50 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Maximize Your Experience?</h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">Explore these benefits and engage with the SEF 2026 community to elevate your entrepreneurial journey. Contact your account manager for more information.</p>
            <Link to={createPageUrl("AccountManager")}>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg">
                Contact Account Manager
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}