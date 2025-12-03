import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Globe, Image, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function MediaStats({ totalUsages, totalReach, platforms, mediaAssets }) {
  const stats = [
    {
      title: "Total Usages",
      value: totalUsages,
      icon: BarChart3,
      gradient: "from-blue-500 to-blue-600"
    },
    {
      title: "Total Reach",
      value: totalReach.toLocaleString(),
      icon: TrendingUp,
      gradient: "from-green-500 to-green-600"
    },
    {
      title: "Platforms",
      value: platforms,
      icon: Globe,
      gradient: "from-purple-500 to-purple-600"
    },
    {
      title: "Media Assets",
      value: mediaAssets,
      icon: Image,
      gradient: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-orange-100 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}