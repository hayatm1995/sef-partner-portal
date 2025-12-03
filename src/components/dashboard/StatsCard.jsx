import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function StatsCard({ title, value, subtitle, icon: Icon, gradient, link, badge }) {
  const CardWrapper = link ? Link : 'div';
  const cardProps = link ? { to: link } : {};

  return (
    <CardWrapper {...cardProps}>
      <motion.div
        whileHover={{ scale: 1.03, y: -8 }}
        transition={{ duration: 0.2 }}
        className="group h-full"
      >
        <Card className={`relative overflow-hidden border border-gray-200/50 bg-white shadow-lg hover:shadow-2xl transition-all duration-300 h-full ${link ? 'cursor-pointer' : ''}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-300`} />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
              <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 flex items-center justify-center`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className={`text-4xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent mb-2 tabular-nums`}>{value}</p>
                {subtitle && (
                  <p className="text-sm text-gray-600 font-medium">{subtitle}</p>
                )}
              </div>
              {badge && value > 0 && (
                <Badge className="bg-red-500 text-white mb-2 font-semibold shadow-md">{value}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </CardWrapper>
  );
}