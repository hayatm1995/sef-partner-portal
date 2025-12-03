import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function EventSchedule() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Schedule</h1>
          <p className="text-gray-600">Full agenda for SEF 2026</p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-blue-100 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Info className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Event Dates</h3>
                <p className="text-gray-600 mb-4">
                  Sharjah Entrepreneurship Festival 2026<br />
                  January 31 - February 1, 2026
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://www.sharjahef.com', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit Main Website
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Embedded Schedule */}
        <Card className="border-orange-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Full Event Agenda
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full bg-gray-50 relative overflow-hidden rounded-b-lg">
              <iframe
                src="https://www.sharjahef.com"
                className="w-full h-[800px] border-0"
                title="SEF 2026 Event Schedule"
                allowFullScreen
              />
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                For the best experience, visit the{" "}
                <a
                  href="https://www.sharjahef.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline font-medium"
                >
                  official SEF website
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}