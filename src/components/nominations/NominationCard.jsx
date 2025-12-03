import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Mail, Phone, Calendar, Briefcase, Users, Trophy } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client'; // Changed import path

export default function NominationCard({ nomination, isAdmin }) {
  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const getPartnerName = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.full_name || email;
  };

  const getPartnerCompany = (email) => {
    const partner = allPartners.find(p => p.email === email);
    return partner?.company_name || '';
  };

  const getStatusColor = (status) => {
    const colors = {
      submitted: "bg-blue-100 text-blue-800",
      under_review: "bg-purple-100 text-purple-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800"
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getTypeIcon = (type) => {
    const icons = {
      workshop: Briefcase,
      speaker: Users,
      startup: Trophy,
      award: Award
    };
    return icons[type] || Award;
  };

  const getTypeColor = (type) => {
    const colors = {
      workshop: "from-blue-500 to-blue-600",
      speaker: "from-purple-500 to-purple-600",
      startup: "from-green-500 to-green-600",
      award: "from-orange-500 to-orange-600"
    };
    return colors[type] || "from-gray-500 to-gray-600";
  };

  const TypeIcon = getTypeIcon(nomination.nomination_type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className="border-orange-100 hover:shadow-lg transition-all">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 bg-gradient-to-br ${getTypeColor(nomination.nomination_type)} rounded-xl shadow-lg flex-shrink-0`}>
              <TypeIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{nomination.nominee_name}</h3>
                  {isAdmin && (
                    <div className="mb-2 space-y-1">
                      <p className="text-sm font-medium text-blue-600">
                        {getPartnerName(nomination.partner_email)}
                      </p>
                      {getPartnerCompany(nomination.partner_email) && (
                        <p className="text-xs text-gray-500">
                          {getPartnerCompany(nomination.partner_email)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">{nomination.partner_email}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {nomination.nomination_type}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(nomination.status)}>
                      {nomination.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{nomination.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {nomination.contact_email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{nomination.contact_email}</span>
                  </div>
                )}
                {nomination.contact_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    <span>{nomination.contact_phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(nomination.created_date), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
              {nomination.admin_notes && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Admin Feedback:</p>
                  <p className="text-sm text-blue-800">{nomination.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}