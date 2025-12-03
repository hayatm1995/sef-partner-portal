import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MessageSquare, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AccountManagerCard({ profile, user }) {
  if (!profile || !profile.account_manager_name) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-lg">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 mx-auto text-yellow-600 mb-3" />
            <p className="text-gray-600">Your account manager will be assigned shortly.</p>
            <p className="text-sm text-gray-500 mt-2">You'll receive an email notification once assigned.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const handleScheduleMeeting = () => {
    if (profile.account_manager_email) {
      const subject = encodeURIComponent(`Meeting Request - ${user?.company_name || 'Partner'}`);
      const body = encodeURIComponent(
        `Hello ${profile.account_manager_name},\n\n` +
        `I would like to schedule a meeting to discuss our partnership.\n\n` +
        `Best regards,\n${user?.full_name}\n${user?.company_name || ''}`
      );
      window.location.href = `mailto:${profile.account_manager_email}?subject=${subject}&body=${body}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-shadow">
        <CardHeader className="border-b border-blue-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Your Dedicated Account Manager
            </CardTitle>
            <Badge className="bg-blue-600 text-white capitalize px-3 py-1">
              {profile.partnership_type} Partner
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                <User className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Manager Details */}
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {profile.account_manager_name}
                </h3>
                <p className="text-sm text-blue-600 font-medium">Sheraa Account Manager</p>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 bg-white/60 p-4 rounded-lg">
                {profile.account_manager_email && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <a 
                        href={`mailto:${profile.account_manager_email}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline block truncate"
                      >
                        {profile.account_manager_email}
                      </a>
                    </div>
                  </div>
                )}

                {profile.account_manager_phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                      <a 
                        href={`tel:${profile.account_manager_phone}`}
                        className="text-sm font-medium text-gray-900 hover:text-green-600 hover:underline block"
                      >
                        {profile.account_manager_phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {profile.account_manager_email && (
                  <>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 min-w-[200px]"
                      onClick={() => window.location.href = `mailto:${profile.account_manager_email}`}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>

                    <Button 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex-1 min-w-[200px]"
                      onClick={handleScheduleMeeting}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Meeting
                    </Button>
                  </>
                )}
              </div>

              {/* Helper Text */}
              <p className="text-xs text-gray-500 italic">
                Your account manager is here to help you throughout your partnership journey. 
                Don't hesitate to reach out for support, guidance, or any questions.
              </p>
            </div>
          </div>

          {/* Admin Notes (Admin View Only) */}
          {profile.admin_notes && user?.role === 'admin' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded bg-yellow-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-700 text-xs font-bold">!</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">Admin Notes (Internal Only):</p>
                  <p className="text-sm text-yellow-700">{profile.admin_notes}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}